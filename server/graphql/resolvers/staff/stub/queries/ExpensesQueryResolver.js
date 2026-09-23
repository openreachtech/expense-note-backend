import {
  BaseQueryResolver,
} from '@openreachtech/renchan'

/*
 * The four expense categories, as
 * `sequelize/seeders/master/20260908181714-000001-expense_categories.cjs` seeds them: the same
 * ids, the same names, the same display order.
 *
 * They are written out here rather than read from anywhere, because a stub reads nothing. Taking
 * them from the master seeder rather than inventing them is what makes this operation and
 * `expenseCategories` agree: both describe the four rows that one master file holds, so a screen
 * can offer the categories one operation returns and match them, by id, to the category the other
 * returns on a row.
 *
 * One object per category, referenced by every entry of that category below, so that the id and
 * the name on an entry cannot drift apart from the id and the name in the category master.
 */
const TRANSPORT_EXPENSE_CATEGORY = {
  id: 10000001,
  name: 'transport',
  displayOrder: 1,
}

const MEALS_EXPENSE_CATEGORY = {
  id: 10000002,
  name: 'meals',
  displayOrder: 2,
}

const SUPPLIES_EXPENSE_CATEGORY = {
  id: 10000003,
  name: 'supplies',
  displayOrder: 3,
}

const OTHER_EXPENSE_CATEGORY = {
  id: 10000004,
  name: 'other',
  displayOrder: 4,
}

/*
 * The entries this stub answers with: twelve, so that a page of ten leaves a second page to ask
 * for.
 *
 * **Written in the order the operation is required to answer in** — newest `spentOn` first, the
 * day the money was paid and not the day the entry was typed (spec **section 6, `entry order`**,
 * and the composite index section 9.3 declares for it). The array is already in that order and
 * nothing here sorts it: a stub holds literals, and ordering them by hand is how this one stays
 * literal. A screen built against a differently ordered stub would look right and be wrong, which
 * is why the order is part of the data rather than left to chance.
 *
 * **No two entries share a `spentOn`, and the reason is no longer the one this paragraph used to
 * give.** It said a same-date tie-break had deliberately not been decided, so the data must not
 * raise the question. Section 6 has since decided it (Q61): within a date, the more recently
 * recorded first. The rows below still carry no tie, and that is now a fixture choice rather than
 * a refusal to settle anything — these twelve literals are what the frontend builds its screen
 * against and what this stub's own suite asserts by value, so giving two of them one date would
 * change a fixture two sides already read, to demonstrate an order a literal array cannot get
 * wrong. **A stub answers with a hardcoded page; it applies no ordering, so it cannot disagree
 * with section 6.** The clause is the actual resolver's to keep, and the tie it now settles is
 * exercised where rows are really written — `tests/_orders/Expense/ExpensesQueryResolver.js`.
 *
 * Every `amount` is an integer number of yen. Spec section 4 puts more than one currency
 * permanently out of scope, so there is no currency and no minor unit anywhere in this feature.
 *
 * Every `status` is `recorded`. It is the approval seam section 4 holds open for 1.1.0, and in
 * 1.0.0 it carries that one value — exposed from this version so that every read goes through the
 * field rather than assuming what it holds.
 *
 * `9103` carries a null memo, because section 11's criterion is that the memo is genuinely
 * optional and reads back empty rather than failing. A screen that renders the memo meets one that
 * is not there on the first page, without having to be asked to look for it.
 *
 * `9105` is the one entry whose `updatedAt` is later than its `createdAt`: the corrected one, from
 * section 11's second use case. Every other entry was written once and not touched since.
 *
 * The ids are stub ids and belong to no table. Nothing here is written, so no row id is spent.
 */
const STUB_EXPENSES = [
  {
    id: 9101,
    spentOn: '2026-09-12',
    amount: 1200,
    memo: 'Taxi back from the client office',
    status: 'recorded',
    expenseCategory: TRANSPORT_EXPENSE_CATEGORY,
    createdAt: new Date('2026-09-12T13:05:00.000Z'),
    updatedAt: new Date('2026-09-12T13:05:00.000Z'),
  },
  {
    id: 9102,
    spentOn: '2026-09-11',
    amount: 880,
    memo: 'Lunch while visiting the branch',
    status: 'recorded',
    expenseCategory: MEALS_EXPENSE_CATEGORY,
    createdAt: new Date('2026-09-11T09:40:00.000Z'),
    updatedAt: new Date('2026-09-11T09:40:00.000Z'),
  },
  {
    id: 9103,
    spentOn: '2026-09-09',
    amount: 3400,
    memo: null, // the optional memo, left empty on purpose
    status: 'recorded',
    expenseCategory: SUPPLIES_EXPENSE_CATEGORY,
    createdAt: new Date('2026-09-09T02:15:00.000Z'),
    updatedAt: new Date('2026-09-09T02:15:00.000Z'),
  },
  {
    id: 9104,
    spentOn: '2026-09-08',
    amount: 560,
    memo: 'Train fare to the warehouse',
    status: 'recorded',
    expenseCategory: TRANSPORT_EXPENSE_CATEGORY,
    createdAt: new Date('2026-09-08T11:30:00.000Z'),
    updatedAt: new Date('2026-09-08T11:30:00.000Z'),
  },
  {
    id: 9105,
    spentOn: '2026-09-05',
    amount: 1500,
    memo: 'Team dinner after the release',
    status: 'recorded',
    expenseCategory: MEALS_EXPENSE_CATEGORY,
    createdAt: new Date('2026-09-05T14:50:00.000Z'),
    updatedAt: new Date('2026-09-06T01:20:00.000Z'), // corrected the next morning
  },
  {
    id: 9106,
    spentOn: '2026-09-03',
    amount: 2780,
    memo: 'Notebooks and pens for the new joiner',
    status: 'recorded',
    expenseCategory: SUPPLIES_EXPENSE_CATEGORY,
    createdAt: new Date('2026-09-03T07:05:00.000Z'),
    updatedAt: new Date('2026-09-03T07:05:00.000Z'),
  },
  {
    id: 9107,
    spentOn: '2026-09-01',
    amount: 430,
    memo: 'Parcel postage to the auditor',
    status: 'recorded',
    expenseCategory: OTHER_EXPENSE_CATEGORY,
    createdAt: new Date('2026-09-01T08:25:00.000Z'),
    updatedAt: new Date('2026-09-01T08:25:00.000Z'),
  },
  {
    id: 9108,
    spentOn: '2026-08-28',
    amount: 9600,
    memo: 'Express ticket to the regional office',
    status: 'recorded',
    expenseCategory: TRANSPORT_EXPENSE_CATEGORY,
    createdAt: new Date('2026-08-28T22:10:00.000Z'),
    updatedAt: new Date('2026-08-28T22:10:00.000Z'),
  },
  {
    id: 9109,
    spentOn: '2026-08-25',
    amount: 1980,
    memo: 'Coffee for the interview panel',
    status: 'recorded',
    expenseCategory: MEALS_EXPENSE_CATEGORY,
    createdAt: new Date('2026-08-25T03:45:00.000Z'),
    updatedAt: new Date('2026-08-25T03:45:00.000Z'),
  },
  {
    id: 9110,
    spentOn: '2026-08-21',
    amount: 7350,
    memo: 'Replacement keyboard for the shared desk',
    status: 'recorded',
    expenseCategory: SUPPLIES_EXPENSE_CATEGORY,
    createdAt: new Date('2026-08-21T06:55:00.000Z'),
    updatedAt: new Date('2026-08-21T06:55:00.000Z'),
  },
  {
    id: 9111,
    spentOn: '2026-08-18',
    amount: 24800,
    memo: 'Conference ticket, paid in advance',
    status: 'recorded',
    expenseCategory: OTHER_EXPENSE_CATEGORY,
    createdAt: new Date('2026-08-18T23:35:00.000Z'),
    updatedAt: new Date('2026-08-18T23:35:00.000Z'),
  },
  {
    id: 9112,
    spentOn: '2026-08-14',
    amount: 640,
    memo: 'Bus fare to the supplier',
    status: 'recorded',
    expenseCategory: TRANSPORT_EXPENSE_CATEGORY,
    createdAt: new Date('2026-08-14T10:00:00.000Z'),
    updatedAt: new Date('2026-08-14T10:00:00.000Z'),
  },
]

/**
 * Stub resolver of the `expenses` query.
 *
 * Hardcoded, schema-accurate literals and nothing else: no row is read, no member of staff is
 * identified, nothing is narrowed to an owner. The twelve entries above are answered to whoever
 * asks, which is exactly what makes this a stub rather than the operation.
 *
 * The one computation any stub is allowed is the pagination slice, and it is the only one here:
 * the entries are sliced by the `offset` and `limit` the caller sent, and `totalRecords` is the
 * length of the whole set rather than a number written by hand. Nothing else reads the input.
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
 * cannot honour that criterion and must not be read as doing so.** Neither can it honour the
 * neighbouring rule that another member of staff's entry is answered as not found: there is no
 * owner here to compare a caller against. Both arrive with the `actual/` resolver at checkpoint 6.
 *
 * @augments {BaseQueryResolver}
 */
export default class ExpensesQueryResolver extends BaseQueryResolver {
  /**
   * get: Name of the operation this resolver serves.
   *
   * @override
   * @returns {string} Operation name.
   */
  static get schema () {
    return 'expenses'
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
   * The sort clause is handed straight back rather than applied. `ExpensesInput` carries one
   * because the audience's pagination shape has one, and the pinned contract says in writing that
   * no operation in 1.0.0 lets the caller choose a sort — so echoing it is reading a field, while
   * ordering by it would be inventing a behaviour nobody decided.
   *
   * @override
   * @param {GraphqlType.ResolverInput<{
   *   input: server.graphql.staff.ExpensesInput
   * }>} params - Parameters.
   * @returns {Promise<server.graphql.staff.ExpensesResult>} A page of entries, in section 6's entry order.
   * @public
   */
  async resolve ({
    variables: {
      input: {
        pagination: {
          limit,
          offset,
          sort,
        },
      },
    },
    context,
  }) {
    const totalRecords = STUB_EXPENSES.length
    const expenses = STUB_EXPENSES.slice(offset, offset + limit)

    return {
      expenses,
      pagination: {
        limit,
        offset,
        sort,
        totalRecords,
      },
    }
  }
}
