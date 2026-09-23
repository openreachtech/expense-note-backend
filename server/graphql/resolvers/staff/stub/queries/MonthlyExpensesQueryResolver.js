import {
  BaseQueryResolver,
} from '@openreachtech/renchan'

/*
 * The four expense categories, as
 * `sequelize/seeders/master/20260908181714-000001-expense_categories.cjs` seeds them: the same
 * ids, the same names, the same display order.
 *
 * They are written out here rather than read from anywhere, because a stub reads nothing. Taking
 * them from the master seeder rather than inventing them is what makes this operation agree with
 * `expenses` and `expenseCategories` — both of those stubs write the same four out, for the same
 * reason — so a screen can match a category on a monthly entry, by id, to the category the list
 * screen showed for the same kind of expense.
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
 * One month of entries — September 2026 — and the entries were chosen for what each of them makes
 * visible on a screen built against this stub.
 *
 * **Written in the order the operation is required to answer in**, and nothing here sorts them.
 * Spec section 6's `entry order` is newest `spentOn` first — the day the money was paid, not the
 * day the entry was typed — and, where two entries share a date, the more recently recorded first.
 * A stub holds literals, so it applies no ordering and cannot disagree with section 6; writing the
 * array already in that order is how it stays literal while still showing a screen the order it
 * must render in.
 *
 * **`9202` and `9203` share `2026-09-18`, and they are the reason a tie is here at all.** Section 6
 * decided the tie-break (Q61) and calls same-day entries ordinary rather than rare, so a monthly
 * screen meets one on its first read rather than discovering it against the real operation later.
 * The pair is written with the later-recorded one first — `9202` was recorded at 11:20, `9203` at
 * 02:05 — which is the tie-break as a fixture demonstrates it, not as a stub proves it. The proof
 * belongs to the `actual/` resolver at checkpoint 6, where rows are really ordered.
 *
 * **`9201` is dated the last day of the month and `9207` the first**, which is section 12's second
 * acceptance criterion made visible from the side this stub can show it from. The other side of
 * that criterion — that an entry dated the day before or the day after is *not* in the month — is
 * a filter, and a stub filters nothing: no entry outside September 2026 is written here, and the
 * absence is a fixture choice rather than a boundary this resolver enforces. Checkpoint 6 owns it.
 *
 * `9203` carries a null memo, the one genuinely optional field (section 9.3), so a screen that
 * renders the memo meets one that is not there without having to be asked to look for it.
 *
 * `9206` is the one entry whose `updatedAt` is later than its `createdAt`: the corrected one. Every
 * other entry was written once and not touched since.
 *
 * Every `amount` is an integer number of yen, and every one of them differs from every other, so an
 * amount landing on the wrong row is visible rather than absorbed. Spec section 4 puts more than
 * one currency permanently out of scope, so there is no currency and no minor unit here.
 *
 * Every `status` is `recorded`. It is the approval seam section 4 holds open for 1.1.0, and in
 * 1.0.0 it carries that one value — exposed from this version so that every read goes through the
 * field rather than assuming what it holds.
 *
 * The ids are stub ids and belong to no table. Nothing here is written, so no row id is spent. They
 * are their own set rather than a copy of `ExpensesQueryResolver`'s twelve: neither stub reads
 * anything, so the two sets answer different screens and are under no obligation to agree, and
 * keeping them separate means neither can be edited into disagreeing with the other.
 */
const STUB_MONTHLY_EXPENSES = [
  {
    id: 9201,
    spentOn: '2026-09-30', // the last day of the month
    amount: 4200,
    memo: 'Taxi home after the month-end close',
    status: 'recorded',
    expenseCategory: TRANSPORT_EXPENSE_CATEGORY,
    createdAt: new Date('2026-09-30T12:40:00.000Z'),
    updatedAt: new Date('2026-09-30T12:40:00.000Z'),
  },
  {
    id: 9202,
    spentOn: '2026-09-18', // tied with 9203, and recorded the later of the two
    amount: 1650,
    memo: 'Dinner with the visiting audit team',
    status: 'recorded',
    expenseCategory: MEALS_EXPENSE_CATEGORY,
    createdAt: new Date('2026-09-18T11:20:00.000Z'),
    updatedAt: new Date('2026-09-18T11:20:00.000Z'),
  },
  {
    id: 9203,
    spentOn: '2026-09-18', // tied with 9202, and recorded the earlier of the two
    amount: 780,
    memo: null, // the optional memo, left empty on purpose
    status: 'recorded',
    expenseCategory: SUPPLIES_EXPENSE_CATEGORY,
    createdAt: new Date('2026-09-18T02:05:00.000Z'),
    updatedAt: new Date('2026-09-18T02:05:00.000Z'),
  },
  {
    id: 9204,
    spentOn: '2026-09-12',
    amount: 23500,
    memo: 'Conference ticket for the autumn meetup',
    status: 'recorded',
    expenseCategory: OTHER_EXPENSE_CATEGORY,
    createdAt: new Date('2026-09-12T06:15:00.000Z'),
    updatedAt: new Date('2026-09-12T06:15:00.000Z'),
  },
  {
    id: 9205,
    spentOn: '2026-09-09',
    amount: 340,
    memo: 'Stamps for posting the signed contract',
    status: 'recorded',
    expenseCategory: SUPPLIES_EXPENSE_CATEGORY,
    createdAt: new Date('2026-09-09T23:55:00.000Z'),
    updatedAt: new Date('2026-09-09T23:55:00.000Z'),
  },
  {
    id: 9206,
    spentOn: '2026-09-05',
    amount: 2100,
    memo: 'Lunch boxes for the Saturday shift',
    status: 'recorded',
    expenseCategory: MEALS_EXPENSE_CATEGORY,
    createdAt: new Date('2026-09-05T04:30:00.000Z'),
    updatedAt: new Date('2026-09-05T08:10:00.000Z'), // corrected the same afternoon
  },
  {
    id: 9207,
    spentOn: '2026-09-01', // the first day of the month
    amount: 990,
    memo: 'Train fare to the client kickoff',
    status: 'recorded',
    expenseCategory: TRANSPORT_EXPENSE_CATEGORY,
    createdAt: new Date('2026-09-01T00:20:00.000Z'),
    updatedAt: new Date('2026-09-01T00:20:00.000Z'),
  },
]

/*
 * The month's total, **summed from the entries above rather than written by hand**.
 *
 * Spec section 12's first acceptance criterion is that the total shown equals the sum of the
 * amounts of the entries shown, and section 12.1 gives the reason one operation returns both: so
 * that the two can never disagree. A hand-written literal here could disagree with the rows beside
 * it, and a screen built against it would look right and be wrong — which is the one failure a stub
 * exists to prevent.
 *
 * It is summed once, here, over a hardcoded array — not over anything the caller sent, and not
 * inside `resolve()`, which stays a return of literals. This is the same move `ExpensesQueryResolver`
 * makes with `totalRecords: STUB_EXPENSES.length`: the number is derived from the stub's own data by
 * construction, so the two cannot be edited apart.
 */
const STUB_TOTAL_AMOUNT = STUB_MONTHLY_EXPENSES.reduce(
  (total, expense) => total + expense.amount,
  0
)

/**
 * Stub resolver of the `monthlyExpenses` query.
 *
 * Hardcoded, schema-accurate literals and nothing else: no row is read, no member of staff is
 * identified, nothing is narrowed to an owner. The entries above are answered to whoever asks.
 *
 * **The `year` and `month` the caller sends are read and not used**, and that is a property of the
 * stub rather than of the operation. `MonthlyExpensesResult` carries neither field, so there is
 * nothing for the stub to echo them into, and choosing entries by month is a filter — the work
 * checkpoint 6's `actual/` resolver does. Until then, every month asked for is answered with the
 * one September 2026 set. A screen that moves between months against this stub will see the same
 * rows each time; that is the stub being a stub, not the month selector being broken.
 *
 * For the same reason this stub cannot show the criterion that a month in which nothing was
 * recorded reports a total of zero: it holds one non-empty month and no way to be asked for
 * another.
 *
 * While this operation is served from the stub pool it runs with **no authentication filter at
 * all**: renchan builds its filter hash from the `actual/` pool alone —
 * `GraphqlResolversBuilder.createAsync()` extracts the schemas it passes to
 * `buildFilterSchemaHash()` from `actualResolverSchemaHash` only — so a stub-only field is handed
 * `filter === undefined` and nothing refuses the call.
 *
 * **Section 12's last acceptance criterion is that this operation is refused without a session,
 * before it reads anything, and a stub cannot honour it and must not be read as doing so.** Neither
 * can it honour the criterion beside it, that another member of staff's expense in the same month
 * changes neither the entries nor the total: there is no owner here to compare a caller against.
 * Both arrive with the `actual/` resolver at checkpoint 6.
 *
 * @augments {BaseQueryResolver}
 */
export default class MonthlyExpensesQueryResolver extends BaseQueryResolver {
  /**
   * get: Name of the operation this resolver serves.
   *
   * @override
   * @returns {string} Operation name.
   */
  static get schema () {
    return 'monthlyExpenses'
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
   * The signature is the one the `actual/` resolver will carry at checkpoint 6 — the same class
   * name, the same destructuring of `year` and `month` — so that swapping the pools is a change of
   * endpoint rather than a rewrite.
   *
   * @override
   * @param {GraphqlType.ResolverInput<{
   *   input: server.graphql.staff.MonthlyExpensesInput
   * }>} params - Parameters.
   * @returns {Promise<server.graphql.staff.MonthlyExpensesResult>} One month of entries, in section 6's entry order, with the total taken over them.
   * @public
   */
  async resolve ({
    variables: {
      input: {
        year,
        month,
      },
    },
    context,
  }) {
    return {
      expenses: STUB_MONTHLY_EXPENSES,
      totalAmount: STUB_TOTAL_AMOUNT,
    }
  }
}
