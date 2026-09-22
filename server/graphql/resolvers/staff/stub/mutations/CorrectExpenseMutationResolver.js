import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

/**
 * Stub resolver of the `correctExpense` mutation.
 *
 * Hardcoded, schema-accurate literals and nothing else: no value is checked, no owner is compared,
 * no row is written. It hands back the identifier it was given and reports the correction as done.
 *
 * **The identifier is echoed rather than invented**, because this is one of the two places the
 * schema's result mirrors the input: `CorrectExpenseInput` carries the `expenseId` and
 * `CorrectExpenseResult` answers with it. Echoing a field is reading it; transforming it would be
 * logic, and belongs to the `actual/` resolver.
 *
 * **It answers with the identifier and nothing more**, which is the shape spec section 11.1
 * declares for every mutation of this feature: the screen re-reads through `expenses` rather than
 * being handed the corrected row back, which is CQRS as the architecture rule states it.
 *
 * **The operation is a full replace, not a patch** — `spentOn`, `amount` and `expenseCategoryId`
 * are each required and `memo` is nullable, so a correction that omits the memo clears it. That is
 * the input the contract declares, and the trap checkpoint 2 recorded for the screen: it must
 * pre-fill every field from `expenses` rather than send a sparse object. The stub honours none of
 * it, holding no row to replace, but a client written against this input meets the same shape the
 * real operation will.
 *
 * The value checks and the not-found answer for another member of staff's entry both arrive with
 * the `actual/` resolver at checkpoint 6. **A stub refuses nothing**, so an identifier belonging to
 * nobody is answered exactly as one belonging to the caller.
 *
 * While this operation is served from the stub pool it runs with **no authentication filter at
 * all**: renchan builds its filter hash from the `actual/` pool alone —
 * `GraphqlResolversBuilder.createAsync()` extracts the schemas it passes to
 * `buildFilterSchemaHash()` from `actualResolverSchemaHash` only — so a stub-only field is handed
 * `filter === undefined` and nothing refuses the call.
 *
 * **That matters more for this feature than it did for `#sign-in`.** Sign-in's stub-only
 * operations were mostly reachable without a session by design; every operation this feature adds
 * is supposed to require one — spec section 7's Authentication row, and section 11's own criterion
 * that every operation it adds is refused without a session, before it reads anything. **A stub
 * cannot honour that criterion and must not be read as doing so.**
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
   * get: Error code hash. Empty, because a stub throws nothing and so owns no error code.
   *
   * @override
   * @returns {Record<string, string>} Error code hash.
   */
  static get errorCodeHash () {
    return {
      ...super.errorCodeHash,
    }
  }

  /**
   * Resolve the operation with hardcoded, schema-accurate data.
   *
   * The three replacement fields and the memo are destructured to document the input this
   * operation takes, and are deliberately left unread: reading them would be the validation and
   * the replacement that belong to the `actual/` resolver.
   *
   * @override
   * @param {GraphqlType.ResolverInput<{
   *   input: server.graphql.staff.CorrectExpenseInput
   * }>} params - Parameters.
   * @returns {Promise<server.graphql.staff.CorrectExpenseResult>} The identifier of the entry corrected.
   * @public
   */
  async resolve ({
    variables: {
      input: {
        expenseId,
        spentOn,
        amount,
        expenseCategoryId,
        memo,
      },
    },
    context,
  }) {
    return {
      expenseId,
    }
  }
}
