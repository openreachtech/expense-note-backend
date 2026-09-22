import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

/*
 * The id this stub reports having written.
 *
 * It sits one past the twelve entries `ExpensesQueryResolver` answers with, so it reads as the
 * next entry rather than as one of the existing ones — and it is deliberately **not** added to
 * that array, because a stub holds one fixed set of literals and cannot remember a call. A screen
 * that records an entry and then re-reads through `expenses` will not find it there, and that is
 * the stub being a stub, not a defect to work around.
 *
 * It is a stub id and belongs to no table. Nothing is written, so no row id is spent.
 */
const STUB_RECORDED_EXPENSE_ID = 9113

/**
 * Stub resolver of the `recordExpense` mutation.
 *
 * Hardcoded, schema-accurate literals and nothing else: no value is checked, no row is written.
 * It reports the same id as written every time it is called.
 *
 * **It answers with the identifier and nothing more**, which is the shape spec section 11.1
 * declares for every mutation of this feature: the screen re-reads through `expenses` rather than
 * being handed the row back, which is CQRS as the architecture rule states it.
 *
 * The value checks section 11 makes acceptance criteria of — no amount, a zero amount and a
 * negative amount each refused, and a date after today refused — belong to the input validator
 * and the `actual/` resolver at checkpoint 6. **A stub refuses nothing**, so presenting it a
 * negative amount is answered exactly as presenting it a plausible one.
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
 * cannot honour that criterion and must not be read as doing so.** The refusal arrives with the
 * `actual/` resolver at checkpoint 6, which is also where the entry acquires an owner.
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
   * The four presented fields are destructured to document the input this operation takes, and are
   * deliberately left unread: the result mirrors none of them — a recorded entry's id is minted by
   * the write, not sent by the caller — so there is nothing here to echo, and reading them would
   * be the validation and the write that belong to the `actual/` resolver.
   *
   * @override
   * @param {GraphqlType.ResolverInput<{
   *   input: server.graphql.staff.RecordExpenseInput
   * }>} params - Parameters.
   * @returns {Promise<server.graphql.staff.RecordExpenseResult>} The identifier of the entry recorded.
   * @public
   */
  async resolve ({
    variables: {
      input: {
        spentOn,
        amount,
        expenseCategoryId,
        memo,
      },
    },
    context,
  }) {
    return {
      expenseId: STUB_RECORDED_EXPENSE_ID,
    }
  }
}
