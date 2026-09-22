import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

import CorrectExpenseInputValidator from '../../../../../../app/tools/validator/resolvers/staff/mutations/CorrectExpenseInputValidator.js'

import Expense from '../../../../../../sequelize/models/Expense.js'
import ExpenseCategory from '../../../../../../sequelize/models/ExpenseCategory.js'

/**
 * Resolver of the `correctExpense` mutation.
 *
 * Rewrites one expense the caller already owns, and answers with its identifier and nothing else.
 *
 * -------------------------------------------------------------------------------------------
 * **It is a FULL REPLACE, not a patch — and the memo is where that bites**
 * -------------------------------------------------------------------------------------------
 *
 * `CorrectExpenseInput` types `spentOn`, `amount` and `expenseCategoryId` each non-null and `memo`
 * nullable (003-expense-entry.graphql), so **every field of the entry is rewritten from what the
 * correction presents, and a correction that omits the memo clears it.** There is no spelling of
 * "leave this one alone": an absent `memo` and a `memo` of `null` are the same correction, and both
 * write null.
 *
 * Checkpoint 2 recorded this as a trap the screen gets wrong once and a member of staff discovers
 * by losing a memo they had typed. **A client must therefore pre-fill every field from `expenses`
 * before sending**, and send the memo back unchanged when the member of staff did not touch it —
 * sending a sparse object silently erases it. The frontend author at checkpoint 16 meets this
 * paragraph rather than the defect.
 *
 * -------------------------------------------------------------------------------------------
 * The one answer for somebody else's entry and for an entry nobody holds
 * -------------------------------------------------------------------------------------------
 *
 * **`#findExpense()` narrows by `id` and by `StaffMemberId` together, in one read.** So there is
 * no moment at which this operation knows that an entry exists but is not the caller's: the read
 * either answers a row the caller owns, or answers nothing, and `204.M005.002` is what nothing
 * becomes. A caller naming another member of staff's entry and a caller naming an id no row holds
 * receive **the same code, from the same line, carrying no distinguishing detail** — spec section
 * 7's not-found answer and section 11's own criterion, and the reason they are met by the shape of
 * the query rather than by a comparison somebody could reorder.
 *
 * Refusing after a two-step read — find by id, then compare the owner — would answer the same code
 * today and leak by timing, by log line or by the first later edit that made the two branches
 * differ. One read cannot drift apart from itself.
 *
 * **And nothing is written on that path.** The refusal is raised inside the transaction
 * `#saveExpense()` opened and before any statement that writes, so an attempt against somebody
 * else's row leaves that row exactly as it was.
 *
 * -------------------------------------------------------------------------------------------
 * Whose row is rewritten
 * -------------------------------------------------------------------------------------------
 *
 * `context.staffMemberId` — the id the framework resolved from the request's access token — and
 * never a field of the input. `CorrectExpenseInput` has no `staffMemberId` to take one from, and
 * `#updateExpense()` does not write the column either, so **a correction can neither reach another
 * member of staff's entry nor hand one away.**
 *
 * **The refusal of a caller with no session is the engine's, not this method's.** `correctExpense`
 * is deliberately absent from `StaffGraphqlServerEngine#get:schemasToSkipFiltering`, so the
 * authentication filter refuses a tokenless caller before `resolve()` is entered — which is what
 * section 11's "refused without a session, before it reads anything" asks for. The null guard below
 * is the second line and defence in depth only, for the case where that hand-maintained list is
 * wrong; `RecordExpenseMutationResolver` carries the same shape for the same reason. Unguarded, a
 * misconfiguration would rewrite a row on behalf of nobody.
 *
 * -------------------------------------------------------------------------------------------
 * What it answers with, and what it deliberately does not
 * -------------------------------------------------------------------------------------------
 *
 * The identifier of the row it rewrote. Not the row: the screen re-reads through `expenses`, which
 * is CQRS as the architecture rule states it and what spec section 11.1 declares for every mutation
 * of this feature. Asking the document for more than `expenseId` does not compile against the
 * schema, so the contract enforces it rather than a convention.
 *
 * -------------------------------------------------------------------------------------------
 * The category, and what the model already guarantees about it
 * -------------------------------------------------------------------------------------------
 *
 * `Expense` carries a `verifyExpenseCategory` hook on all three of its write paths, the instance
 * save this operation performs included, and **it is a real guarantee: no row naming a category
 * that does not exist can be written, whatever this resolver does.** What the hook does not give is
 * an answer a caller can read — it throws a bare `Error('Expense names an ExpenseCategory that does
 * not exist: 10009992')`, a raw model exception escaping to the transport and carrying a row id
 * into a message nobody meant to publish.
 *
 * So the check in `#saveExpense()` is **not** a duplicate of the model's guarantee; it is the
 * missing half of it. The model decides whether the row may exist, this resolver decides what the
 * caller is told, and the answer is `204.M005.003` — a code that names the category and nothing
 * about anybody's rows. Both run inside one transaction, and the read the model's own hook performs
 * joins it too, so the two can never disagree.
 *
 * **Whether the category id is a plausible value at all is the validator's**, under `203.M005.008`.
 * Existence is a row and cannot be read off the input; a value is not a row.
 *
 * **The category is read after the entry, not before**, and the order is the security property
 * again: a caller probing another member of staff's entry is answered not-found whatever category
 * they named, so a bad category cannot be used to tell one refusal from the other.
 *
 * -------------------------------------------------------------------------------------------
 * The transaction, and why the entry count cannot move
 * -------------------------------------------------------------------------------------------
 *
 * Two reads and one `UPDATE`, in one transaction, so a refusal raised between them leaves nothing
 * behind. **The write is an update of the row that was read — never a delete and an insert — so
 * the identifier survives the correction and the number of entries a member of staff has is
 * arithmetically unable to change.** That is section 11's "corrected in place" criterion, and it is
 * a property of the statement rather than of a count taken afterwards.
 *
 * @augments {BaseMutationResolver}
 */
export default class CorrectExpenseMutationResolver extends BaseMutationResolver {
  /**
   * get: Name of the operation this resolver serves.
   *
   * @override
   * @returns {string} Operation name.
   */
  static get schema () {
    return 'correctExpense'
  }

  /**
   * get: Error code hash.
   *
   * `M005` is this operation's stable id, fixed in `server/graphql/resolver-id-hash-staff.js`.
   *
   * The ten `203` codes are the validator's, one per rule `CorrectExpenseInputValidator` declares,
   * and the names are the ones it reads off `this.errorHash` — a name changed here refuses nothing
   * and throws on an undefined constructor instead.
   *
   * **`ExpenseNotFound` is one code for two situations on purpose, and it is the security
   * property.** An entry belonging to another member of staff and an id no row holds are answered
   * identically, because telling them apart is telling a caller that somebody else's entry exists.
   * There is deliberately no `ExpenseNotOwned` beside it: a second code would be the leak, written
   * down.
   *
   * `StaffMemberNotFound` is the session guard and names nobody. `ExpenseCategoryNotFound` names a
   * row of a four-row master table seeded into every environment, which is public by construction.
   *
   * @override
   * @returns {Record<string, string>} Error code hash.
   */
  static get errorCodeHash () {
    return {
      ...super.errorCodeHash,

      // Invalid input errors — one per rule CorrectExpenseInputValidator declares.
      MissingExpenseId: '203.M005.001',
      MissingSpentOn: '203.M005.002',
      MissingAmount: '203.M005.003',
      MissingExpenseCategoryId: '203.M005.004',
      InvalidExpenseId: '203.M005.005',
      MalformedSpentOn: '203.M005.006',
      InvalidAmount: '203.M005.007',
      InvalidExpenseCategoryId: '203.M005.008',
      FutureSpentOn: '203.M005.009',
      TooLongMemo: '203.M005.010',

      // Database / state errors
      StaffMemberNotFound: '204.M005.001',
      ExpenseNotFound: '204.M005.002',
      ExpenseCategoryNotFound: '204.M005.003',
    }
  }

  /**
   * get: CorrectExpenseInputValidator class — a seam so tests can substitute it.
   *
   * @returns {typeof CorrectExpenseInputValidator} The class.
   */
  static get CorrectExpenseInputValidatorCtor () {
    return CorrectExpenseInputValidator
  }

  /**
   * get: Class itself — reach own statics through the instance.
   *
   * @returns {typeof CorrectExpenseMutationResolver} The class.
   */
  get Ctor () {
    return /** @type {typeof CorrectExpenseMutationResolver} */ (this.constructor)
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
   *   input: server.graphql.staff.CorrectExpenseInput
   * }>} params - Parameters.
   * @returns {Promise<server.graphql.staff.CorrectExpenseResult>} The identifier of the entry corrected.
   * @throws {GraphqlType.Error} Refusal of a caller with no session, of an input no expense can be made of, of an entry the caller does not hold, or of a category that does not exist.
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
   * Validate the input against every rule `CorrectExpenseInputValidator` declares.
   *
   * The validator returns the error rather than throwing it, so the `throw` of this operation sits
   * in one place beside every other reason it refuses.
   *
   * @param {{
   *   input: server.graphql.staff.CorrectExpenseInput
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
   * resolver's `203.M005.*` code rather than with an error of the validator's own. So is the
   * request's instant, which is the clock "dated after today" is decided against.
   *
   * @param {{
   *   input: server.graphql.staff.CorrectExpenseInput
   *   readAt: Date
   * }} params - Parameters.
   * @returns {CorrectExpenseInputValidator} Input validator over this request's input.
   */
  createInputValidator ({
    input,
    readAt,
  }) {
    return this.Ctor.CorrectExpenseInputValidatorCtor.create({
      input,
      errorHash: /** @type {*} */ (this.errorHash),
      readAt,
    })
  }

  /**
   * Rewrite the entry, refusing an entry the caller does not hold and a category that does not
   * exist rather than letting the model throw.
   *
   * All three steps run inside one transaction, so a refusal here leaves nothing behind and the
   * model's own hook — whose read joins the same transaction — can never disagree with the check
   * above it.
   *
   * **The entry is read before the category** so that a caller probing another member of staff's
   * entry receives the not-found answer whatever category they named.
   *
   * @param {{
   *   staffMemberId: number
   *   input: server.graphql.staff.CorrectExpenseInput
   * }} params - Parameters.
   * @returns {Promise<model.Expense>} The entry rewritten.
   * @throws {GraphqlType.Error} The caller holds no such entry, or the named category does not exist.
   */
  async saveExpense ({
    staffMemberId,
    input,
  }) {
    return this.ExpenseModel.beginTransaction(async transaction => {
      const expenseEntity = await this.findExpense({
        expenseId: input.expenseId,
        staffMemberId,
        transaction,
      })

      if (!expenseEntity) {
        throw this.errorHash.ExpenseNotFound.create()
      }

      const expenseCategoryEntity = await this.findExpenseCategory({
        expenseCategoryId: input.expenseCategoryId,
        transaction,
      })

      if (!expenseCategoryEntity) {
        throw this.errorHash.ExpenseCategoryNotFound.create()
      }

      return this.updateExpense({
        expenseEntity,
        input,
        transaction,
      })
    })
  }

  /**
   * Find the entry the correction names, **among the caller's own and nowhere else**.
   *
   * The `where` carries the owner beside the identifier, so another member of staff's entry is
   * outside the query rather than filtered out of its result: this method cannot report that one
   * exists, because it never selected it. An entry nobody holds and an entry somebody else holds
   * are therefore the same `null`, which is what makes the two refusals identical by construction.
   *
   * The read joins the caller's transaction, so what it answers is what the update beside it will
   * rewrite.
   *
   * @param {{
   *   expenseId: number
   *   staffMemberId: number
   *   transaction: import('sequelize').Transaction
   * }} params - Parameters.
   * @returns {Promise<model.Expense | null>} The caller's own entry of that id. null: the caller holds no such entry, whether or not anybody else does.
   */
  async findExpense ({
    expenseId,
    staffMemberId,
    transaction,
  }) {
    return /** @type {*} */ (
      this.ExpenseModel.findOne({
        where: {
          id: expenseId,
          StaffMemberId: staffMemberId,
        },
        transaction,
      })
    )
  }

  /**
   * Find the category the correction names.
   *
   * The read joins the caller's transaction, so what it answers is what the update beside it will
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
   * Rewrite the entry that was read.
   *
   * **An update of that row, never a delete and an insert.** The identifier survives, the row keeps
   * the `createdAt` it was written with, and the number of entries its owner has cannot move.
   *
   * **Every field the correction carries is written, the memo included, and an absent memo is
   * written as null** — that is the full replace this operation's contract declares, and the trap
   * worth reading the class comment for.
   *
   * `StaffMemberId` is deliberately not among the fields written: a correction cannot change whose
   * entry it is, and leaving the column out is what makes that impossible rather than merely
   * unintended. Neither is `status`, which no operation of 1.0.0 moves.
   *
   * @param {{
   *   expenseEntity: model.Expense
   *   input: server.graphql.staff.CorrectExpenseInput
   *   transaction: import('sequelize').Transaction
   * }} params - Parameters.
   * @returns {Promise<model.Expense>} The entry rewritten.
   */
  async updateExpense ({
    expenseEntity,
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
      expenseEntity.update(
        {
          ExpenseCategoryId: expenseCategoryId,
          spentOn,
          amount,
          memo,
        },
        {
          transaction,
        }
      )
    )
  }

  /**
   * Format the response — the identifier of the entry corrected, and nothing else.
   *
   * The id is read off the row that was rewritten rather than echoed from the input, so what comes
   * back is the entry this operation actually touched.
   *
   * @param {{
   *   expenseEntity: model.Expense
   * }} params - Parameters.
   * @returns {server.graphql.staff.CorrectExpenseResult} The identifier of the entry corrected.
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
