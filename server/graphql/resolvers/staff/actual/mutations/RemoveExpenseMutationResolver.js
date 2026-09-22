import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

import RemoveExpenseInputValidator from '../../../../../../app/tools/validator/resolvers/staff/mutations/RemoveExpenseInputValidator.js'

import Expense from '../../../../../../sequelize/models/Expense.js'

/**
 * Resolver of the `removeExpense` mutation.
 *
 * Deletes one expense the caller already owns, and answers with its identifier and nothing else.
 *
 * -------------------------------------------------------------------------------------------
 * **A hard delete, and that is what collapses two criteria into one rule**
 * -------------------------------------------------------------------------------------------
 *
 * Spec section 7 removes an entry **outright rather than archiving it**, and `Expense` carries no
 * `deletedAt` and is not paranoid, so `#destroyExpense()` issues a `DELETE` and the row stops
 * existing. Nothing is flagged, nothing is hidden from a later read, and no later read has to
 * remember to exclude anything.
 *
 * That single fact is why this operation gives **one answer to three different situations**:
 *
 * 1. an entry this very caller removed a moment ago — the row is gone;
 * 2. an entry another member of staff holds — the row exists and is outside this caller's query;
 * 3. an id no row has ever held — there was never anything.
 *
 * All three reach `#removeExpense()`'s one `null` and become `204.M006.002`. Section 11 asks for
 * exactly that: *"removing it a second time is answered as not found — the same answer somebody
 * else's expense gets, so a removed entry and another member of staff's are indistinguishable"*.
 * **There is deliberately no `ExpenseAlreadyRemoved` code**, and adding one later would not be a
 * nicety: it would tell a caller that an id they cannot read once belonged to a row, which is the
 * existence leak section 7's not-found answer exists to prevent. `errorCodeHash` is asserted whole
 * in this resolver's tests, so such a code cannot be added quietly.
 *
 * -------------------------------------------------------------------------------------------
 * How the three become one, mechanically
 * -------------------------------------------------------------------------------------------
 *
 * **`#findExpense()` narrows by `id` and by `StaffMemberId` together, in one read.** So there is
 * no moment at which this operation knows that an entry exists but is not the caller's, and no
 * moment at which it knows an id once existed. The read either answers a row the caller owns right
 * now, or answers nothing.
 *
 * Refusing after a two-step read — find by id, then compare the owner — would answer the same code
 * today and leak by timing, by log line or by the first later edit that made the branches differ.
 * One read cannot drift apart from itself. `CorrectExpenseMutationResolver` is built the same way
 * and for the same reason; this operation merely has one more situation folded into it.
 *
 * **And nothing is deleted on that path.** The refusal is raised inside the transaction
 * `#removeExpense()` opened and before the `DELETE`, so an attempt against somebody else's row
 * leaves that row exactly as it was.
 *
 * -------------------------------------------------------------------------------------------
 * Whose row is deleted
 * -------------------------------------------------------------------------------------------
 *
 * `context.staffMemberId` — the id the framework resolved from the request's access token — and
 * never a field of the input. `RemoveExpenseInput` carries `expenseId` and nothing else, so there
 * is no owner in it to take one from.
 *
 * **The refusal of a caller with no session is the engine's, not this method's.** `removeExpense`
 * is deliberately absent from `StaffGraphqlServerEngine#get:schemasToSkipFiltering`, so the
 * authentication filter refuses a tokenless caller before `resolve()` is entered — which is what
 * section 11's "refused without a session, before it reads anything" asks for. The null guard
 * below is the second line and defence in depth only, for the case where that hand-maintained list
 * is wrong; `RecordExpenseMutationResolver` and `CorrectExpenseMutationResolver` carry the same
 * shape for the same reason. Unguarded, a misconfiguration would delete a row on behalf of nobody.
 *
 * -------------------------------------------------------------------------------------------
 * What it answers with, and what it deliberately does not
 * -------------------------------------------------------------------------------------------
 *
 * The identifier of the row it removed — read off that row rather than echoed from the input, so
 * what comes back is the entry this operation actually deleted. **The row is gone and the
 * identifier is what the screen needs**: it re-reads through `expenses` and reconciles its list
 * against an id, which is CQRS as the architecture rule states it and what spec section 11.1
 * declares for every mutation of this feature. Asking the document for more than `expenseId` does
 * not compile against the schema, so the contract enforces it rather than a convention.
 *
 * -------------------------------------------------------------------------------------------
 * The transaction
 * -------------------------------------------------------------------------------------------
 *
 * One read and one `DELETE`, in one transaction, so a refusal raised between them leaves nothing
 * behind and the row a caller is told about is the row that was deleted. No category is read: a
 * removal names none, and the model's `verifyExpenseCategory` hook guards writes rather than
 * deletions, so there is no second refusal this operation has to own.
 *
 * @augments {BaseMutationResolver}
 */
export default class RemoveExpenseMutationResolver extends BaseMutationResolver {
  /**
   * get: Name of the operation this resolver serves.
   *
   * @override
   * @returns {string} Operation name.
   */
  static get schema () {
    return 'removeExpense'
  }

  /**
   * get: Error code hash.
   *
   * `M006` is this operation's stable id, fixed in `server/graphql/resolver-id-hash-staff.js`.
   *
   * The two `203` codes are the validator's, one per rule `RemoveExpenseInputValidator` declares,
   * and the names are the ones it reads off `this.errorHash` — a name changed here refuses nothing
   * and throws on an undefined constructor instead.
   *
   * **`ExpenseNotFound` is one code for three situations on purpose, and it is the security
   * property.** An entry this caller already removed, an entry another member of staff holds and
   * an id no row ever held are answered identically, because telling any of them apart is telling
   * a caller that a row they may not read exists or once did. There is deliberately no
   * `ExpenseNotOwned` and no `ExpenseAlreadyRemoved` beside it: either would be the leak, written
   * down.
   *
   * `StaffMemberNotFound` is the session guard and names nobody.
   *
   * @override
   * @returns {Record<string, string>} Error code hash.
   */
  static get errorCodeHash () {
    return {
      ...super.errorCodeHash,

      // Invalid input errors — one per rule RemoveExpenseInputValidator declares.
      MissingExpenseId: '203.M006.001',
      InvalidExpenseId: '203.M006.002',

      // Database / state errors
      StaffMemberNotFound: '204.M006.001',
      ExpenseNotFound: '204.M006.002',
    }
  }

  /**
   * get: RemoveExpenseInputValidator class — a seam so tests can substitute it.
   *
   * @returns {typeof RemoveExpenseInputValidator} The class.
   */
  static get RemoveExpenseInputValidatorCtor () {
    return RemoveExpenseInputValidator
  }

  /**
   * get: Class itself — reach own statics through the instance.
   *
   * @returns {typeof RemoveExpenseMutationResolver} The class.
   */
  get Ctor () {
    return /** @type {typeof RemoveExpenseMutationResolver} */ (this.constructor)
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
   * Resolve the operation.
   *
   * The session guard is answered before the input is looked at, so a caller with no session is
   * refused without this operation reporting anything about what they asked for — and before a
   * transaction is opened, so there is nothing to roll back.
   *
   * @override
   * @param {GraphqlType.ResolverInput<{
   *   input: server.graphql.staff.RemoveExpenseInput
   * }>} params - Parameters.
   * @returns {Promise<server.graphql.staff.RemoveExpenseResult>} The identifier of the entry removed.
   * @throws {GraphqlType.Error} Refusal of a caller with no session, of an input naming no entry, or of an entry the caller does not hold.
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
    })

    if (validationError) {
      throw validationError
    }

    const expenseEntity = await this.removeExpense({
      staffMemberId,
      input,
    })

    return this.formatResponse({
      expenseEntity,
    })
  }

  /**
   * Validate the input against every rule `RemoveExpenseInputValidator` declares.
   *
   * The validator returns the error rather than throwing it, so the `throw` of this operation sits
   * in one place beside every other reason it refuses.
   *
   * @param {{
   *   input: server.graphql.staff.RemoveExpenseInput
   * }} params - Parameters.
   * @returns {import('@openreachtech/renchan').RenchanGraphqlError | null} The error of the first rule the input fails. null: the input satisfies every rule.
   */
  validateInput ({
    input,
  }) {
    const inputValidator = this.createInputValidator({
      input,
    })

    return inputValidator.validateInput()
  }

  /**
   * Create the validator holding this operation's input rules.
   *
   * The resolver's own `errorHash` is handed over, which is what makes each rule refuse with this
   * resolver's `203.M006.*` code rather than with an error of the validator's own. No instant is
   * handed over, because a removal presents no date and this operation consults no clock.
   *
   * @param {{
   *   input: server.graphql.staff.RemoveExpenseInput
   * }} params - Parameters.
   * @returns {RemoveExpenseInputValidator} Input validator over this request's input.
   */
  createInputValidator ({
    input,
  }) {
    return this.Ctor.RemoveExpenseInputValidatorCtor.create({
      input,
      errorHash: /** @type {*} */ (this.errorHash),
    })
  }

  /**
   * Delete the entry, refusing an entry the caller does not hold rather than deleting nothing
   * quietly.
   *
   * Both steps run inside one transaction, so a refusal here leaves nothing behind and the row
   * answered to the caller is the row that was deleted.
   *
   * **The one `null` this method turns into a refusal is where the three situations meet**: an
   * entry already removed, an entry somebody else holds and an id no row ever held all arrive here
   * as the same absence, and all three leave as `204.M006.002`.
   *
   * @param {{
   *   staffMemberId: number
   *   input: server.graphql.staff.RemoveExpenseInput
   * }} params - Parameters.
   * @returns {Promise<model.Expense>} The entry removed.
   * @throws {GraphqlType.Error} The caller holds no such entry.
   */
  async removeExpense ({
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

      return this.destroyExpense({
        expenseEntity,
        transaction,
      })
    })
  }

  /**
   * Find the entry the removal names, **among the caller's own and nowhere else**.
   *
   * The `where` carries the owner beside the identifier, so another member of staff's entry is
   * outside the query rather than filtered out of its result: this method cannot report that one
   * exists, because it never selected it. An entry nobody holds, an entry somebody else holds and
   * an entry that has already been deleted are therefore the same `null`, which is what makes the
   * three refusals identical by construction.
   *
   * The read joins the caller's transaction, so what it answers is what the delete beside it will
   * remove.
   *
   * @param {{
   *   expenseId: number
   *   staffMemberId: number
   *   transaction: import('sequelize').Transaction
   * }} params - Parameters.
   * @returns {Promise<model.Expense | null>} The caller's own entry of that id. null: the caller holds no such entry, whether or not anybody else does and whether or not one ever existed.
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
   * Delete the entry that was read.
   *
   * **Outright, not archived.** Spec section 7 removes an entry rather than flagging it, `Expense`
   * declares no `deletedAt` and is not paranoid, so this issues a `DELETE` and the row is gone from
   * every later read without any read having to exclude it.
   *
   * The instance is answered rather than `destroy()`'s own result, which is nothing: the row is no
   * longer in the table, and the in-memory instance is the only thing left that still carries the
   * identifier the caller is owed.
   *
   * @param {{
   *   expenseEntity: model.Expense
   *   transaction: import('sequelize').Transaction
   * }} params - Parameters.
   * @returns {Promise<model.Expense>} The entry removed.
   */
  async destroyExpense ({
    expenseEntity,
    transaction,
  }) {
    await expenseEntity.destroy({
      transaction,
    })

    return expenseEntity
  }

  /**
   * Format the response — the identifier of the entry removed, and nothing else.
   *
   * The id is read off the row that was deleted rather than echoed from the input, so what comes
   * back is the entry this operation actually removed. The stub this replaces echoed the input,
   * which reads the same on the happy path and says nothing on any other.
   *
   * @param {{
   *   expenseEntity: model.Expense
   * }} params - Parameters.
   * @returns {server.graphql.staff.RemoveExpenseResult} The identifier of the entry removed.
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
