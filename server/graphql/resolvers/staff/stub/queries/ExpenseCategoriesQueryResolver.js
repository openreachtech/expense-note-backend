import {
  BaseQueryResolver,
} from '@openreachtech/renchan'

/*
 * The four expense categories, as
 * `sequelize/seeders/master/20260908181714-000001-expense_categories.cjs` seeds them: the same
 * ids, the same names, the same display order.
 *
 * They are written out here rather than read from anywhere, because a stub reads nothing. Taking
 * them from that master seeder rather than inventing them is what makes this operation and
 * `expenses` agree — `ExpensesQueryResolver` writes the same four out for the same reason, and
 * every entry it answers with carries one of them. So a screen can offer these four and match a
 * chosen one, by id, to the category on any entry it reads back.
 *
 * A category is a seeded row and never an enum written into the code, which is the seam spec
 * section 4 holds open for an operator-editable category list. The master seeder stays the one
 * place the four names are decided; this array only repeats them.
 *
 * **In display order**, which is the order the operation answers in and the order a screen offers
 * them in: transport, meals, supplies, other (spec section 6's terminology entry).
 */
const STUB_EXPENSE_CATEGORIES = [
  {
    id: 10000001,
    name: 'transport',
    displayOrder: 1,
  },
  {
    id: 10000002,
    name: 'meals',
    displayOrder: 2,
  },
  {
    id: 10000003,
    name: 'supplies',
    displayOrder: 3,
  },
  {
    id: 10000004,
    name: 'other',
    displayOrder: 4,
  },
]

/**
 * Stub resolver of the `expenseCategories` query.
 *
 * Hardcoded, schema-accurate literals and nothing else: no row is read, and the same four
 * categories are answered to whoever asks.
 *
 * The operation takes no argument. The SDL declares `expenseCategories: ExpenseCategoriesResult!`
 * with no input — the category master is the same for everybody and there is nothing to narrow it
 * by — and the convention gives an operation with no input no argument at all, so there is no
 * empty input type to destructure.
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
 * `actual/` resolver at checkpoint 6.
 *
 * @augments {BaseQueryResolver}
 */
export default class ExpenseCategoriesQueryResolver extends BaseQueryResolver {
  /**
   * get: Name of the operation this resolver serves.
   *
   * @override
   * @returns {string} Operation name.
   */
  static get schema () {
    return 'expenseCategories'
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
   * @returns {Promise<server.graphql.staff.ExpenseCategoriesResult>} The category master, in display order.
   * @public
   */
  async resolve () {
    return {
      expenseCategories: STUB_EXPENSE_CATEGORIES,
    }
  }
}
