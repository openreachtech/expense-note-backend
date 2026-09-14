import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

/**
 * Stub resolver of the `removeExpense` mutation.
 *
 * Hardcoded, schema-accurate literals and nothing else: no owner is compared, no row is deleted.
 * It hands back the identifier it was given and reports the removal as done.
 *
 * **The identifier is echoed rather than invented**, because this is one of the two places the
 * schema's result mirrors the input: `RemoveExpenseInput` carries the `expenseId` and
 * `RemoveExpenseResult` answers with it. Echoing a field is reading it; transforming it would be
 * logic, and belongs to the `actual/` resolver.
 *
 * **It answers with the identifier and nothing more**, which is the shape spec section 11.1
 * declares for every mutation of this feature: the screen re-reads through `expenses` rather than
 * being handed anything back, which is CQRS as the architecture rule states it.
 *
 * **Two answers this stub does not give, both settled and both owed by checkpoint 6.** Another
 * member of staff's entry is answered as not found, and the answer says nothing about whether it
 * exists (spec section 7). **Removing an already-removed entry is answered as not found too** —
 * the same answer, decided at checkpoint 1, which collapses a second removal into the ownership
 * rule rather than adding a second rule beside it. Section 7 deletes a removed entry outright
 * rather than archiving it, so a removed entry and somebody else's entry are the same thing to a
 * reader. **A stub throws nothing at all**, so it gives neither answer: every identifier presented
 * to it, including one it has already been handed, is reported as removed.
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
   * @override
   * @param {GraphqlType.ResolverInput<{
   *   input: server.graphql.staff.RemoveExpenseInput
   * }>} params - Parameters.
   * @returns {Promise<server.graphql.staff.RemoveExpenseResult>} The identifier of the entry removed.
   * @public
   */
  async resolve ({
    variables: {
      input: {
        expenseId,
      },
    },
    context,
  }) {
    return {
      expenseId,
    }
  }
}
