import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

import EXPENSE_STATUS_CONSTANT_HASH from '../../../../../../app/constants/expenseStatusConstants.js'

import RecordExpenseInputValidator from '../../../../../../app/tools/validator/resolvers/staff/mutations/RecordExpenseInputValidator.js'

import Expense from '../../../../../../sequelize/models/Expense.js'
import ExpenseCategory from '../../../../../../sequelize/models/ExpenseCategory.js'

const {
  EXPENSE_STATUS,
} = EXPENSE_STATUS_CONSTANT_HASH

/**
 * Resolver of the `recordExpense` mutation.
 *
 * Writes one expense, owned by the member of staff who asked for it, and answers with its
 * identifier and nothing else.
 *
 * -------------------------------------------------------------------------------------------
 * Whose row is written
 * -------------------------------------------------------------------------------------------
 *
 * `context.staffMemberId` — the id the framework resolved from the request's access token — and
 * never a field of the input: `RecordExpenseInput` has no `staffMemberId` to take one from, which
 * is what makes "the row is written against them" (spec section 11.1) a property of the contract
 * rather than of a check. Nobody can record an expense against somebody else because there is no
 * way to say whose it is.
 *
 * **The refusal of a caller with no session is the engine's, not this method's.** `recordExpense`
 * is deliberately absent from `StaffGraphqlServerEngine#get:schemasToSkipFiltering`, so the
 * authentication filter refuses a tokenless caller before `resolve()` is entered — which is what
 * section 11's "refused without a session, before it reads anything" asks for. The null guard below
 * is the second line and defence in depth only, for the case where that hand-maintained list is
 * wrong; `ExpensesQueryResolver` carries the same shape for the same reason. Unguarded, a
 * misconfiguration would write a row owned by nobody.
 *
 * -------------------------------------------------------------------------------------------
 * What it answers with, and what it deliberately does not
 * -------------------------------------------------------------------------------------------
 *
 * The identifier of the row it wrote. Not the row: the screen re-reads through `expenses`, which
 * is CQRS as the architecture rule states it and what spec section 11.1 declares for every mutation
 * of this feature. Asking the document for more than `expenseId` does not compile against the
 * schema, so the contract enforces it rather than a convention.
 *
 * -------------------------------------------------------------------------------------------
 * The category, and what the model already guarantees about it
 * -------------------------------------------------------------------------------------------
 *
 * `Expense` carries a `verifyExpenseCategory` hook on all three of its write paths, and **it is a
 * real guarantee: no row naming a category that does not exist can be written, whatever this
 * resolver does.** What the hook does not give is an answer a caller can read — it throws a bare
 * `Error('Expense names an ExpenseCategory that does not exist: 10009992')`, which is a raw model
 * exception escaping to the transport, surfacing as the framework's generic error and carrying a
 * row id into a message nobody meant to publish.
 *
 * So the check below is **not** a duplicate of the model's guarantee; it is the missing half of it.
 * The model decides whether the row may exist, this resolver decides what the caller is told, and
 * the answer is `204.M004.002` — a code that names the category and nothing about anybody's rows.
 * Both run inside one transaction, and the read that the model's own hook performs joins it too, so
 * the two can never disagree.
 *
 * **Whether the category id is a plausible value at all is the validator's**, under `203.M004.006`.
 * Existence is a row and cannot be read off the input; a value is not a row. The two are separate
 * rules with separate codes, deliberately.
 *
 * The owner's own `verifyStaffMember` hook is left to do its work unaccompanied. Its input is an id
 * the framework resolved from a token it verified against `staff_member_access_tokens`, so the row
 * existed moments earlier, and no operation of 1.0.0 deletes a member of staff — there is no
 * caller-reachable path to that throw, and inventing an error code for one would mean declaring a
 * refusal this operation cannot produce.
 *
 * -------------------------------------------------------------------------------------------
 * The transaction
 * -------------------------------------------------------------------------------------------
 *
 * One read and one insert, so the transaction buys atomicity between them rather than between two
 * writes: without it, the category could in principle be gone by the time the insert ran, and the
 * caller would receive the raw model exception this class exists to prevent. It also gives the
 * refusals their other half — **an input this operation refuses writes nothing**, because the
 * throw leaves the transaction unfinished and it rolls back. The validation refusals never open one
 * at all.
 *
 * @augments {BaseMutationResolver}
 */
export default class RecordExpenseMutationResolver extends BaseMutationResolver {
  /**
   * get: Name of the operation this resolver serves.
   *
   * @override
   * @returns {string} Operation name.
   */
  static get schema () {
    return 'recordExpense'
  }

  /**
   * get: Error code hash.
   *
   * `M004` is this operation's stable id, fixed in `server/graphql/resolver-id-hash-staff.js`.
   *
   * The eight `203` codes are the validator's, one per rule `RecordExpenseInputValidator` declares,
   * and the names are the ones it reads off `this.errorHash` — a name changed here refuses nothing
   * and throws on an undefined constructor instead.
   *
   * **`MissingAmount` and `InvalidAmount` are two codes for one acceptance criterion, on purpose.**
   * Section 11 refuses "no amount, an amount of zero, or a negative amount" in one sentence, but a
   * caller who sent nothing and a caller who sent `-4500` have different things to correct, and
   * neither answer reveals anything about anybody. The criterion is met by both being refused, not
   * by their sharing a code.
   *
   * The two `204`s are state rather than input. `StaffMemberNotFound` is the session guard and
   * names nobody. `ExpenseCategoryNotFound` names a row of a four-row master table seeded into
   * every environment, which is public by construction — it is the one thing this feature can
   * safely say does not exist, and saying it is how a caller learns their category picker is stale
   * rather than that the product is broken.
   *
   * @override
   * @returns {Record<string, string>} Error code hash.
   */
  static get errorCodeHash () {
    return {
      ...super.errorCodeHash,

      // Invalid input errors — one per rule RecordExpenseInputValidator declares.
      MissingSpentOn: '203.M004.001',
      MissingAmount: '203.M004.002',
      MissingExpenseCategoryId: '203.M004.003',
      MalformedSpentOn: '203.M004.004',
      InvalidAmount: '203.M004.005',
      InvalidExpenseCategoryId: '203.M004.006',
      FutureSpentOn: '203.M004.007',
      TooLongMemo: '203.M004.008',

      // Database / state errors
      StaffMemberNotFound: '204.M004.001',
      ExpenseCategoryNotFound: '204.M004.002',
    }
  }

  /**
   * get: RecordExpenseInputValidator class — a seam so tests can substitute it.
   *
   * @returns {typeof RecordExpenseInputValidator} The class.
   */
  static get RecordExpenseInputValidatorCtor () {
    return RecordExpenseInputValidator
  }

  /**
   * get: Class itself — reach own statics through the instance.
   *
   * @returns {typeof RecordExpenseMutationResolver} The class.
   */
  get Ctor () {
    return /** @type {typeof RecordExpenseMutationResolver} */ (this.constructor)
  }

  /**
   * get: Expense model — a seam so tests can substitute it.
   *
   * @returns {typeof Expense} Model declaration.
   */
  get ExpenseModel () {
    return Expense
  }

  /**
   * get: ExpenseCategory model — a seam so tests can substitute it.
   *
   * @returns {typeof ExpenseCategory} Model declaration.
   */
  get ExpenseCategoryModel () {
    return ExpenseCategory
  }

  /**
   * Resolve the operation.
   *
   * The session guard is answered before the input is looked at, so a caller with no session is
   * refused without this operation reporting anything about what they asked for — and before a
   * transaction is opened, so there is nothing to roll back.
   *
   * @override
   * @param {GraphqlType.ResolverInput<{
   *   input: server.graphql.staff.RecordExpenseInput
   * }>} params - Parameters.
   * @returns {Promise<server.graphql.staff.RecordExpenseResult>} The identifier of the entry recorded.
   * @throws {GraphqlType.Error} Refusal of a caller with no session, of an input no expense can be made of, or of a category that does not exist.
   * @public
   */
  async resolve ({
    variables: {
      input,
    },
    context,
  }) {
    const {
      staffMemberId,
    } = context

    if (!staffMemberId) {
      throw this.errorHash.StaffMemberNotFound.create()
    }

    const validationError = this.validateInput({
      input,
      readAt: context.now,
    })

    if (validationError) {
      throw validationError
    }

    const expenseEntity = await this.saveExpense({
      staffMemberId,
      input,
    })

    return this.formatResponse({
      expenseEntity,
    })
  }

  /**
   * Validate the input against every rule `RecordExpenseInputValidator` declares.
   *
   * The validator returns the error rather than throwing it, so the `throw` of this operation sits
   * in one place beside every other reason it refuses.
   *
   * @param {{
   *   input: server.graphql.staff.RecordExpenseInput
   *   readAt: Date
   * }} params - Parameters.
   * @returns {import('@openreachtech/renchan').RenchanGraphqlError | null} The error of the first rule the input fails. null: the input satisfies every rule.
   */
  validateInput ({
    input,
    readAt,
  }) {
    const inputValidator = this.createInputValidator({
      input,
      readAt,
    })

    return inputValidator.validateInput()
  }

  /**
   * Create the validator holding this operation's input rules.
   *
   * The resolver's own `errorHash` is handed over, which is what makes each rule refuse with this
   * resolver's `203.M004.*` code rather than with an error of the validator's own. So is the
   * request's instant, which is the clock "dated after today" is decided against.
   *
   * @param {{
   *   input: server.graphql.staff.RecordExpenseInput
   *   readAt: Date
   * }} params - Parameters.
   * @returns {RecordExpenseInputValidator} Input validator over this request's input.
   */
  createInputValidator ({
    input,
    readAt,
  }) {
    return this.Ctor.RecordExpenseInputValidatorCtor.create({
      input,
      errorHash: /** @type {*} */ (this.errorHash),
      readAt,
    })
  }

  /**
   * Save the entry, refusing a category that does not exist rather than letting the model throw.
   *
   * Both steps run inside one transaction, so a refusal here leaves nothing behind and the model's
   * own hook — whose read joins the same transaction — can never disagree with the check above it.
   *
   * @param {{
   *   staffMemberId: number
   *   input: server.graphql.staff.RecordExpenseInput
   * }} params - Parameters.
   * @returns {Promise<model.Expense>} The entry written.
   * @throws {GraphqlType.Error} The named category does not exist.
   */
  async saveExpense ({
    staffMemberId,
    input,
  }) {
    return this.ExpenseModel.beginTransaction(async transaction => {
      const expenseCategoryEntity = await this.findExpenseCategory({
        expenseCategoryId: input.expenseCategoryId,
        transaction,
      })

      if (!expenseCategoryEntity) {
        throw this.errorHash.ExpenseCategoryNotFound.create()
      }

      return this.createExpense({
        staffMemberId,
        input,
        transaction,
      })
    })
  }

  /**
   * Find the category the entry names.
   *
   * The read joins the caller's transaction, so what it answers is what the insert beside it will
   * see.
   *
   * @param {{
   *   expenseCategoryId: number
   *   transaction: import('sequelize').Transaction
   * }} params - Parameters.
   * @returns {Promise<model.ExpenseCategory | null>} The category named. null: no category of that id exists.
   */
  async findExpenseCategory ({
    expenseCategoryId,
    transaction,
  }) {
    return /** @type {*} */ (
      this.ExpenseCategoryModel.findByPk(expenseCategoryId, {
        transaction,
      })
    )
  }

  /**
   * Write the entry.
   *
   * **`memo` is normalized to null when none was presented**, rather than being left absent. The
   * column allows null and an absent field would land there as null anyway on this path, but
   * stating it is what makes "the memo is optional: an expense recorded without one is accepted,
   * and reads back with an empty memo rather than failing" (spec section 11) a property of this
   * method rather than of a default somebody could change.
   *
   * `status` is read from the constant, never spelled here: `recorded` is the only value 1.0.0
   * writes, and the column is the seam approval is built on (spec section 9.3).
   *
   * @param {{
   *   staffMemberId: number
   *   input: server.graphql.staff.RecordExpenseInput
   *   transaction: import('sequelize').Transaction
   * }} params - Parameters.
   * @returns {Promise<model.Expense>} The entry written.
   */
  async createExpense ({
    staffMemberId,
    input,
    transaction,
  }) {
    const {
      spentOn,
      amount,
      expenseCategoryId,
    } = input

    const memo = input.memo
      ?? null

    return /** @type {*} */ (
      this.ExpenseModel.create(
        {
          StaffMemberId: staffMemberId,
          ExpenseCategoryId: expenseCategoryId,
          spentOn,
          amount,
          memo,
          status: EXPENSE_STATUS.RECORDED,
        },
        {
          transaction,
        }
      )
    )
  }

  /**
   * Format the response — the identifier of the entry recorded, and nothing else.
   *
   * The id is the one the database minted, never one the caller sent: `RecordExpenseInput` carries
   * none, and the table's id is auto-incremented.
   *
   * @param {{
   *   expenseEntity: model.Expense
   * }} params - Parameters.
   * @returns {server.graphql.staff.RecordExpenseResult} The identifier of the entry recorded.
   */
  formatResponse ({
    expenseEntity,
  }) {
    const expenseId = expenseEntity.id

    return {
      expenseId,
    }
  }
}
