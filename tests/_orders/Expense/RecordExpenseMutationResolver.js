import RecordExpenseMutationResolver from '../../../server/graphql/resolvers/staff/actual/mutations/RecordExpenseMutationResolver.js'

import ExpensesQueryResolver from '../../../server/graphql/resolvers/staff/actual/queries/ExpensesQueryResolver.js'

/*
 * The three methods of `recordExpense` that **write** — `#resolve()`, `#saveExpense()` and
 * `#createExpense()` — against the real tables. Everything else this resolver has is in
 * `tests/__tests__/server/graphql/resolvers/staff/actual/mutations/RecordExpenseMutationResolver.js`,
 * because placement is per method and not per class.
 *
 * -------------------------------------------------------------------------------------------
 * No row of `expenses` is given an explicit id, here or anywhere
 * -------------------------------------------------------------------------------------------
 *
 * `expenses` is a table the product writes: the id is the database's, minted as `max(id) + 1`.
 * The development seeder
 * (`sequelize/seeders/development/20260914120004-000004-expenses.cjs`) is the only writer of
 * explicit ids in it, and its own docblock spells out why that is safe there and nowhere else —
 * an explicit id written above the high-water mark **is** the next auto-increment value, so the
 * following product write collides with it and the failure surfaces in an unrelated suite as a
 * `SequelizeUniqueConstraintError`. So every row this file needs is created **through the
 * operation under test**, and where one has to be identified afterwards it is identified by the
 * id the operation handed back, or read back by its owner.
 *
 * -------------------------------------------------------------------------------------------
 * Which members of staff this file writes for, and which it deliberately does not
 * -------------------------------------------------------------------------------------------
 *
 * The ten seeded members of staff split into three groups, and the split is not cosmetic:
 *
 *   - `10110001` (ten seeded expenses) and `10110002` (four) are never written for here. Their
 *     rows are what `ExpensesQueryResolver`'s tests page through by value.
 *   - `10110003`, `10110007`, `10110009` and `10110010` are asserted to have recorded **nothing**
 *     by `tests/__tests__/server/graphql/resolvers/staff/actual/queries/ExpensesQueryResolver.js`,
 *     with no id bound on the read — so a row written for one of them turns that suite red. They
 *     are therefore used **only** by the describes here whose operation is refused, where writing
 *     nothing is the very thing being asserted.
 *   - `10110004`, `10110005`, `10110006` and `10110008` are the four nobody asserts empty, and
 *     they are the only ones written for.
 *
 * Within that last group, `10110005`, `10110006` and `10110008` are each written for by exactly
 * **one** case of exactly one describe, so that a read-back of their page holds exactly one row
 * and can be asserted by value. `10110004` carries every write that is never read back.
 *
 * -------------------------------------------------------------------------------------------
 * How "nothing is recorded" is proved
 * -------------------------------------------------------------------------------------------
 *
 * Half of section 11's refusal criteria is that the refused entry leaves no row, and a test that
 * only caught the throw would pass against a resolver that wrote the row and then refused.
 *
 * So the refused call is the **Arrange** — awaited, and asserted to refuse with the code it owes —
 * and the **Act** is a read of that member of staff's own page through
 * `ExpensesQueryResolver#resolve()`, the product's own read path. `totalRecords` is the count of
 * the whole set rather than of the page, so `0` is the table's answer and not the page's.
 * `tests/_orders/SignIn/SignInMutationResolver.js` proves "a successful sign-in records nothing"
 * the same way, and for the same reason.
 *
 * Nothing is mocked. Every refusal here is reachable from the input alone or from a category id
 * no row holds, so there is no branch that needs steering.
 *
 * -------------------------------------------------------------------------------------------
 * The clock, and why no case reads a wall clock
 * -------------------------------------------------------------------------------------------
 *
 * "An expense dated after today is refused" is decided by `CalendarDateInspector` against
 * `CALENDAR.TIMEZONE` (`Asia/Tokyo`), and the instant it reads is the one `#resolve()` hands it:
 * `context.now`. Every case below therefore **states its own instant** and dates its entry
 * relative to that — so the boundary is pinned to the day, and nothing here depends on the day
 * the suite happens to run on. A case dated in some far-off year would pass whatever the rule
 * did.
 *
 * Two instants recur, and the pair is what pins the zone rather than merely the arithmetic:
 *
 *   - `2026-09-15T01:00:00.000Z` — `2026-09-15 10:00` in Tokyo, so today is `2026-09-15` in both
 *     zones.
 *   - `2026-09-15T15:30:00.000Z` — `2026-09-16 00:30` in Tokyo while UTC is still `2026-09-15`,
 *     so `2026-09-16` is **today** in the calendar's own zone and **tomorrow** in UTC. A resolver
 *     reading the host's zone rather than the constant refuses that case, and no other case can
 *     tell the two apart.
 *
 * -------------------------------------------------------------------------------------------
 * No `expense_categories` row is created
 * -------------------------------------------------------------------------------------------
 *
 * `tests/__tests__/sequelize/seeders/master/expense_categories.js` asserts that whole table with
 * one `toEqual`, so a row left behind there turns a different feature's suite red. The four
 * seeded categories (`10000001`–`10000004`) are the only ones named, and a category that does not
 * exist is named by an id no row holds.
 */

describe('RecordExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The operation end to end: one row written, and **only the identifier of it answered**.
     *
     * The assertion is a whole-object `toEqual` over a one-field object, which is what makes it
     * the CQRS criterion rather than a shape check — a resolver that helpfully returned the row
     * beside the id, or the amount, or the owner, fails here. The id itself is asserted by kind,
     * because it is the database's to mint and no test may state it.
     *
     * The three cases differ in the optional memo — presented, presented as null, and not
     * presented at all — so the answer is the same one field in all three.
     */
    describe('should answer with the identifier of the entry recorded and nothing else', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110004,
            input: {
              spentOn: '2026-09-10',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare to the client office',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: {
            expenseId: expect.any(Number),
          },
        },
        {
          params: {
            staffMemberId: 10110004,
            input: {
              spentOn: '2026-08-31',
              amount: 98000,
              expenseCategoryId: 10000004,
              memo: null,
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: {
            expenseId: expect.any(Number),
          },
        },
        {
          params: {
            staffMemberId: 10110004,
            input: {
              spentOn: '2026-07-01',
              amount: 1,
              expenseCategoryId: 10000002,
              // memo: undefined -- the optional memo, not presented at all
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: {
            expenseId: expect.any(Number),
          },
        },
      ]

      test.each(cases)('input.spentOn: $params.input.spentOn', async ({
        params,
        expected,
      }) => {
        const resolver = RecordExpenseMutationResolver.create()
        const resolveArgs = {
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
            now: params.presentedAt,
          },
        }

        const actual = await resolver.resolve(/** @type {*} */ (resolveArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The accepting side of "an expense dated after today is refused": **today itself is
     * accepted**, which is the ordinary case this feature exists for — a member of staff
     * recording this evening's train fare.
     *
     * The second case is the one that pins the zone. Its instant is `2026-09-15T15:30:00.000Z`,
     * which is already `2026-09-16` in Tokyo and still `2026-09-15` in UTC, so an entry dated
     * `2026-09-16` is today's in the calendar's own zone and tomorrow's in the host's. It is
     * accepted, and nothing else here would notice if the zone were wrong.
     *
     * The third is an entry of months ago, which the feature must keep accepting: nothing bounds
     * how old an entry may be.
     */
    describe('should accept an entry dated today in the calendar own zone', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110004,
            input: {
              spentOn: '2026-09-15', // today, at the instant below
              amount: 3450,
              expenseCategoryId: 10000003,
              memo: 'printer paper for the Tokyo office',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: {
            expenseId: expect.any(Number),
          },
        },
        {
          params: {
            staffMemberId: 10110004,
            input: {
              spentOn: '2026-09-16', // today in Asia/Tokyo, tomorrow in UTC
              amount: 640,
              expenseCategoryId: 10000001,
              memo: 'bus fare recorded just after midnight in Tokyo',
            },
            presentedAt: new Date('2026-09-15T15:30:00.000Z'),
          },
          expected: {
            expenseId: expect.any(Number),
          },
        },
        {
          params: {
            staffMemberId: 10110004,
            input: {
              spentOn: '2026-01-31', // months before today, which nothing bounds
              amount: 5730,
              expenseCategoryId: 10000002,
              memo: 'new year lunch with the supplier',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: {
            expenseId: expect.any(Number),
          },
        },
      ]

      test.each(cases)('input.spentOn: $params.input.spentOn', async ({
        params,
        expected,
      }) => {
        const resolver = RecordExpenseMutationResolver.create()
        const resolveArgs = {
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
            now: params.presentedAt,
          },
        }

        const actual = await resolver.resolve(/** @type {*} */ (resolveArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **"An expense dated after today is refused"** (spec section 11), with `203.M004.007` as the
     * refusal.
     *
     * Each case dates its entry one day past the day its own instant falls on in Tokyo, so the
     * boundary is pinned to the day rather than to a year far enough away to be safe:
     *
     *   - `2026-09-15T01:00:00.000Z` is `2026-09-15` in Tokyo, and `2026-09-16` is refused.
     *   - `2026-09-15T14:59:59.000Z` is `2026-09-15 23:59:59` in Tokyo — the last second of
     *     today — and `2026-09-16` is still refused.
     *   - `2026-09-15T15:30:00.000Z` is `2026-09-16 00:30` in Tokyo, and it is now `2026-09-17`
     *     that is refused. The same instant accepts `2026-09-16`, one describe above.
     *
     * The title interpolates the instant, because two of the three cases present the same date
     * and it is the clock that moved.
     */
    describe('should refuse an entry dated after today', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110007,
            input: {
              spentOn: '2026-09-16',
              amount: 2175,
              expenseCategoryId: 10000001,
              memo: 'a fare not yet paid',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M004.007',
        },
        {
          params: {
            staffMemberId: 10110007,
            input: {
              spentOn: '2026-09-16',
              amount: 760,
              expenseCategoryId: 10000002,
              memo: 'a lunch not yet eaten',
            },
            presentedAt: new Date('2026-09-15T14:59:59.000Z'),
          },
          expected: '203.M004.007',
        },
        {
          params: {
            staffMemberId: 10110007,
            input: {
              spentOn: '2026-09-17',
              amount: 9400,
              expenseCategoryId: 10000003,
              memo: 'supplies not yet ordered',
            },
            presentedAt: new Date('2026-09-15T15:30:00.000Z'),
          },
          expected: '203.M004.007',
        },
      ]

      test.each(cases)('presentedAt: $params.presentedAt', async ({
        params,
        expected,
      }) => {
        const resolver = RecordExpenseMutationResolver.create()
        const resolveArgs = {
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
            now: params.presentedAt,
          },
        }

        const actual = () => resolver.resolve(/** @type {*} */ (resolveArgs))

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The other half of that criterion: **the refused entry leaves no row**. The refusal is the
     * Arrange, and the count of what it left behind is the Act — zero.
     *
     * `10110007` has recorded nothing and is written for by no describe of this file, so a row in
     * this page could only have come from the refused call above it.
     */
    describe('should record nothing for an entry dated after today', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110007,
            input: {
              spentOn: '2026-09-16',
              amount: 12000,
              expenseCategoryId: 10000004,
              memo: 'a conference ticket not yet bought',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: [],
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 0, // the refused entry left no row
            },
          },
        },
        {
          params: {
            staffMemberId: 10110007,
            input: {
              spentOn: '2026-09-17',
              amount: 330,
              expenseCategoryId: 10000001,
              memo: 'a fare of the day after tomorrow',
            },
            presentedAt: new Date('2026-09-15T15:30:00.000Z'),
            pagination: {
              limit: 5,
              offset: 0,
            },
          },
          expected: {
            expenses: [],
            pagination: {
              limit: 5,
              offset: 0,
              sort: null,
              totalRecords: 0, // the refused entry left no row
            },
          },
        },
      ]

      test.each(cases)('presentedAt: $params.presentedAt', async ({
        params,
        expected,
      }) => {
        const recordResolver = RecordExpenseMutationResolver.create()
        const refusedRecording = () => recordResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
            now: params.presentedAt,
          },
        }))
        await expect(refusedRecording)
          .rejects
          .toThrow('203.M004.007')
        const readResolver = ExpensesQueryResolver.create()
        const readArgs = {
          variables: {
            input: {
              pagination: params.pagination,
            },
          },
          context: {
            staffMemberId: params.staffMemberId,
          },
        }

        const actual = await readResolver.resolve(/** @type {*} */ (readArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **"An expense with no amount … is refused"** (spec section 11), with `203.M004.002` as the
     * refusal — the presence half of that criterion.
     *
     * Both spellings of "no amount" are presented: the field sent as null, and the field not sent
     * at all. GraphQL types `amount` as `Int!` and would refuse both before a resolver ran, so
     * these two cases are the resolver being asked directly — which is how a caller reaching it
     * any other way would arrive.
     */
    describe('should refuse an entry presenting no amount', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110003,
            input: {
              spentOn: '2026-09-08',
              amount: null,
              expenseCategoryId: 10000001,
              memo: 'a fare with no amount beside it',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M004.002',
        },
        {
          params: {
            staffMemberId: 10110003,
            input: {
              spentOn: '2026-09-07',
              // amount: undefined -- not presented at all
              expenseCategoryId: 10000002,
              memo: 'a lunch with no amount beside it',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M004.002',
        },
      ]

      test.each(cases)('input.spentOn: $params.input.spentOn', async ({
        params,
        expected,
      }) => {
        const resolver = RecordExpenseMutationResolver.create()
        const resolveArgs = {
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
            now: params.presentedAt,
          },
        }

        const actual = () => resolver.resolve(/** @type {*} */ (resolveArgs))

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **"… an amount of zero, or a negative amount is refused"** (spec section 11), with
     * `203.M004.005` as the refusal — the value half of that criterion, and a separate code from
     * the presence half on purpose: a caller who sent nothing and a caller who sent `-4500` have
     * different things to correct.
     *
     * A fractional amount is refused under the same code, because the yen has no minor unit and
     * the column is an `int`.
     */
    describe('should refuse an entry presenting an amount of zero or less', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110003,
            input: {
              spentOn: '2026-09-06',
              amount: 0,
              expenseCategoryId: 10000001,
              memo: 'a fare that cost nothing',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M004.005',
        },
        {
          params: {
            staffMemberId: 10110003,
            input: {
              spentOn: '2026-09-05',
              amount: -4500,
              expenseCategoryId: 10000002,
              memo: 'a lunch that paid the payer',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M004.005',
        },
        {
          params: {
            staffMemberId: 10110003,
            input: {
              spentOn: '2026-09-04',
              amount: 1200.5,
              expenseCategoryId: 10000003,
              memo: 'half a yen of stationery',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M004.005',
        },
      ]

      test.each(cases)('input.amount: $params.input.amount', async ({
        params,
        expected,
      }) => {
        const resolver = RecordExpenseMutationResolver.create()
        const resolveArgs = {
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
            now: params.presentedAt,
          },
        }

        const actual = () => resolver.resolve(/** @type {*} */ (resolveArgs))

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The other half of the presence criterion: **an entry presenting no amount leaves no row**.
     * The refusal is the Arrange and the count is the Act.
     *
     * `10110003` has recorded nothing and is written for by no describe of this file.
     */
    describe('should record nothing when no amount was presented', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110003,
            input: {
              spentOn: '2026-09-03',
              amount: null,
              expenseCategoryId: 10000004,
              memo: 'an amount left out, sent as null',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: [],
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 0, // the refused entry left no row
            },
          },
        },
        {
          params: {
            staffMemberId: 10110003,
            input: {
              spentOn: '2026-09-02',
              // amount: undefined -- not presented at all
              expenseCategoryId: 10000003,
              memo: 'an amount left out altogether',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            pagination: {
              limit: 4,
              offset: 0,
            },
          },
          expected: {
            expenses: [],
            pagination: {
              limit: 4,
              offset: 0,
              sort: null,
              totalRecords: 0, // the refused entry left no row
            },
          },
        },
      ]

      test.each(cases)('input.spentOn: $params.input.spentOn', async ({
        params,
        expected,
      }) => {
        const recordResolver = RecordExpenseMutationResolver.create()
        const refusedRecording = () => recordResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
            now: params.presentedAt,
          },
        }))
        await expect(refusedRecording)
          .rejects
          .toThrow('203.M004.002')
        const readResolver = ExpensesQueryResolver.create()
        const readArgs = {
          variables: {
            input: {
              pagination: params.pagination,
            },
          },
          context: {
            staffMemberId: params.staffMemberId,
          },
        }

        const actual = await readResolver.resolve(/** @type {*} */ (readArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The other half of the value criterion: **an entry whose amount is zero or negative leaves
     * no row**. The refusal is the Arrange and the count is the Act.
     */
    describe('should record nothing when the amount is zero or negative', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110003,
            input: {
              spentOn: '2026-09-01',
              amount: 0,
              expenseCategoryId: 10000001,
              memo: 'a fare of zero yen',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: [],
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 0, // the refused entry left no row
            },
          },
        },
        {
          params: {
            staffMemberId: 10110003,
            input: {
              spentOn: '2026-08-30',
              amount: -12000,
              expenseCategoryId: 10000004,
              memo: 'a ticket of minus twelve thousand yen',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            pagination: {
              limit: 7,
              offset: 0,
            },
          },
          expected: {
            expenses: [],
            pagination: {
              limit: 7,
              offset: 0,
              sort: null,
              totalRecords: 0, // the refused entry left no row
            },
          },
        },
      ]

      test.each(cases)('input.amount: $params.input.amount', async ({
        params,
        expected,
      }) => {
        const recordResolver = RecordExpenseMutationResolver.create()
        const refusedRecording = () => recordResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
            now: params.presentedAt,
          },
        }))
        await expect(refusedRecording)
          .rejects
          .toThrow('203.M004.005')
        const readResolver = ExpensesQueryResolver.create()
        const readArgs = {
          variables: {
            input: {
              pagination: params.pagination,
            },
          },
          context: {
            staffMemberId: params.staffMemberId,
          },
        }

        const actual = await readResolver.resolve(/** @type {*} */ (readArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **A category that does not exist is answered with an error code, not with a raw model
     * exception.**
     *
     * `Expense` carries a `verifyExpenseCategory` hook on its write paths, and it would refuse
     * these rows on its own — with `Error('Expense names an ExpenseCategory that does not exist:
     * 10009993')`, a model exception escaping to the transport and carrying an id into a message
     * nobody meant to publish. What comes back instead is `204.M004.002`, which is this
     * resolver's own answer: it reads the category first, inside the same transaction the insert
     * would join, and refuses before the hook is ever reached.
     *
     * So the assertion is deliberately the code and not a substring of that sentence. A resolver
     * that dropped its own check and let the hook fire would fail here rather than pass with a
     * different message.
     *
     * Both ids are plausible values — positive whole numbers, so the validator's
     * `203.M004.006` is satisfied and it is existence, not shape, that refuses them — and neither
     * belongs to the four-row master. **No category row is created to make them real**, and none
     * is created anywhere in this file.
     */
    describe('should refuse an entry naming a category that does not exist', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110009,
            input: {
              spentOn: '2026-08-29',
              amount: 1860,
              expenseCategoryId: 10009993, // no row of the master holds it
              memo: 'a dinner filed under nothing',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '204.M004.002',
        },
        {
          params: {
            staffMemberId: 10110009,
            input: {
              spentOn: '2026-08-28',
              amount: 260,
              expenseCategoryId: 88888888, // nor this one
              memo: 'a fare filed under nothing',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '204.M004.002',
        },
      ]

      test.each(cases)('input.expenseCategoryId: $params.input.expenseCategoryId', async ({
        params,
        expected,
      }) => {
        const resolver = RecordExpenseMutationResolver.create()
        const resolveArgs = {
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
            now: params.presentedAt,
          },
        }

        const actual = () => resolver.resolve(/** @type {*} */ (resolveArgs))

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **An entry naming a category that does not exist leaves no row**, which is the transaction
     * doing its work: the refusal is raised inside the one `#saveExpense()` opens, so there is
     * nothing to commit.
     *
     * `10110009` has recorded nothing and is written for by no describe of this file.
     */
    describe('should record nothing for a category that does not exist', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110009,
            input: {
              spentOn: '2026-08-27',
              amount: 4800,
              expenseCategoryId: 10009994,
              memo: 'supplies filed under nothing',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: [],
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 0, // the refused entry left no row
            },
          },
        },
        {
          params: {
            staffMemberId: 10110009,
            input: {
              spentOn: '2026-08-26',
              amount: 33500,
              expenseCategoryId: 77777777,
              memo: 'a ticket filed under nothing',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            pagination: {
              limit: 6,
              offset: 0,
            },
          },
          expected: {
            expenses: [],
            pagination: {
              limit: 6,
              offset: 0,
              sort: null,
              totalRecords: 0, // the refused entry left no row
            },
          },
        },
      ]

      test.each(cases)('input.expenseCategoryId: $params.input.expenseCategoryId', async ({
        params,
        expected,
      }) => {
        const recordResolver = RecordExpenseMutationResolver.create()
        const refusedRecording = () => recordResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
            now: params.presentedAt,
          },
        }))
        await expect(refusedRecording)
          .rejects
          .toThrow('204.M004.002')
        const readResolver = ExpensesQueryResolver.create()
        const readArgs = {
          variables: {
            input: {
              pagination: params.pagination,
            },
          },
          context: {
            staffMemberId: params.staffMemberId,
          },
        }

        const actual = await readResolver.resolve(/** @type {*} */ (readArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **"The memo is optional: an expense recorded without one is accepted, and reads back with
     * an empty memo rather than failing"** (spec section 11).
     *
     * Both spellings of "without one" are recorded — the field sent as null, and the field not
     * sent at all — and each is then **read back** through `expenses`, which is where the second
     * half of the criterion lives: an accepted write that came back unreadable would satisfy the
     * first half and fail the feature.
     *
     * Each case records for a member of staff of its own, written for by nothing else, so the
     * page holds exactly the one row it wrote and can be asserted by value rather than by shape.
     * The id and the timestamps are the database's and are asserted by kind; everything else is
     * the value presented, and `memo` is null.
     */
    describe('should read back an empty memo when none was presented', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110006,
            input: {
              spentOn: '2026-08-25',
              amount: 7420,
              expenseCategoryId: 10000003,
              memo: null,
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: [
              {
                id: expect.any(Number),
                spentOn: '2026-08-25',
                amount: 7420,
                memo: null,
                status: 'recorded',
                expenseCategory: {
                  id: 10000003,
                  name: 'supplies',
                  displayOrder: 3,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
            ],
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 1,
            },
          },
        },
        {
          params: {
            staffMemberId: 10110008,
            input: {
              spentOn: '2026-08-24',
              amount: 185,
              expenseCategoryId: 10000001,
              // memo: undefined -- the optional memo, not presented at all
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: [
              {
                id: expect.any(Number),
                spentOn: '2026-08-24',
                amount: 185,
                memo: null,
                status: 'recorded',
                expenseCategory: {
                  id: 10000001,
                  name: 'transport',
                  displayOrder: 1,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
            ],
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 1,
            },
          },
        },
      ]

      test.each(cases)('staffMemberId: $params.staffMemberId', async ({
        params,
        expected,
      }) => {
        const recordResolver = RecordExpenseMutationResolver.create()
        await recordResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
            now: params.presentedAt,
          },
        }))
        const readResolver = ExpensesQueryResolver.create()
        const readArgs = {
          variables: {
            input: {
              pagination: params.pagination,
            },
          },
          context: {
            staffMemberId: params.staffMemberId,
          },
        }

        const actual = await readResolver.resolve(/** @type {*} */ (readArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The contrast to the describe above: **a memo that was presented reads back as it was
     * typed**, so "reads back empty" is a property of the absent memo and not of every memo.
     *
     * The memo crosses the contract as a `String` and is stored in a `varchar(191)` column, so
     * what is asserted is that it arrives whole: the same text back, beside the same amount.
     */
    describe('should read the presented memo back unchanged', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110005,
            input: {
              spentOn: '2026-08-23',
              amount: 2640,
              expenseCategoryId: 10000002,
              memo: 'dinner after the meeting at the client office',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: [
              {
                id: expect.any(Number),
                spentOn: '2026-08-23',
                amount: 2640,
                memo: 'dinner after the meeting at the client office',
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
            ],
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 1,
            },
          },
        },
      ]

      test.each(cases)('staffMemberId: $params.staffMemberId', async ({
        params,
        expected,
      }) => {
        const recordResolver = RecordExpenseMutationResolver.create()
        await recordResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
            now: params.presentedAt,
          },
        }))
        const readResolver = ExpensesQueryResolver.create()
        const readArgs = {
          variables: {
            input: {
              pagination: params.pagination,
            },
          },
          context: {
            staffMemberId: params.staffMemberId,
          },
        }

        const actual = await readResolver.resolve(/** @type {*} */ (readArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#saveExpense()', () => {
    /*
     * The write on its own, outside `#resolve()`: it opens the transaction, refuses a category
     * that does not exist and returns the row it wrote.
     *
     * It reads no input rule, so the entries below are not validated on the way past — that is
     * `#validateInput()`'s work and `#resolve()`'s order of business, both asserted elsewhere.
     * What is asserted here is the row: the owner is the id handed in and never a field of the
     * input, and `status` is `recorded`, the only value 1.0.0 writes.
     */
    describe('should write the entry and answer with the row', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110004,
            input: {
              spentOn: '2026-06-02',
              amount: 1375,
              expenseCategoryId: 10000001,
              memo: 'taxi home after the late release',
            },
          },
          expected: expect.objectContaining({
            StaffMemberId: 10110004,
            ExpenseCategoryId: 10000001,
            spentOn: '2026-06-02',
            amount: 1375,
            memo: 'taxi home after the late release',
            status: 'recorded',
          }),
        },
        {
          params: {
            staffMemberId: 10110004,
            input: {
              spentOn: '2026-06-03',
              amount: 20800,
              expenseCategoryId: 10000004,
              memo: null,
            },
          },
          expected: expect.objectContaining({
            StaffMemberId: 10110004,
            ExpenseCategoryId: 10000004,
            spentOn: '2026-06-03',
            amount: 20800,
            memo: null,
            status: 'recorded',
          }),
        },
      ]

      test.each(cases)('input.spentOn: $params.input.spentOn', async ({
        params,
        expected,
      }) => {
        const resolver = RecordExpenseMutationResolver.create()

        const actual = await resolver.saveExpense(/** @type {*} */ (params))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#saveExpense()', () => {
    /*
     * The refusal this method owns, raised inside the transaction it opened, so the insert beside
     * it never runs. The code is the resolver's own `204.M004.002` and not the model hook's
     * sentence — see the `#resolve()` describe above for why the difference matters.
     */
    describe('should refuse a category that does not exist', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110004,
            input: {
              spentOn: '2026-06-04',
              amount: 910,
              expenseCategoryId: 10009995,
              memo: 'a fare filed under nothing',
            },
          },
          expected: '204.M004.002',
        },
        {
          params: {
            staffMemberId: 10110004,
            input: {
              spentOn: '2026-06-05',
              amount: 6650,
              expenseCategoryId: 66666666,
              memo: 'a dinner filed under nothing',
            },
          },
          expected: '204.M004.002',
        },
      ]

      test.each(cases)('input.expenseCategoryId: $params.input.expenseCategoryId', async ({
        params,
        expected,
      }) => {
        const resolver = RecordExpenseMutationResolver.create()

        const actual = () => resolver.saveExpense(/** @type {*} */ (params))

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#createExpense()', () => {
    /*
     * The insert itself, joined to a transaction the caller opened — which is how
     * `#saveExpense()` calls it, and the reason the model's own reference hooks read the same
     * uncommitted state.
     *
     * **The memo is what this method is really asserted on**: it normalizes an absent one to
     * null rather than leaving it out, so the third case is the one that would notice if that
     * line went away. The column allows null and an absent field would land there as null on this
     * path anyway, which is precisely why stating it needs a case of its own.
     */
    describe('should write the entry with the memo normalized', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110004,
            input: {
              spentOn: '2026-05-04',
              amount: 4310,
              expenseCategoryId: 10000002,
              memo: 'lunch with the two visiting engineers',
            },
          },
          expected: expect.objectContaining({
            StaffMemberId: 10110004,
            ExpenseCategoryId: 10000002,
            spentOn: '2026-05-04',
            amount: 4310,
            memo: 'lunch with the two visiting engineers',
            status: 'recorded',
          }),
        },
        {
          params: {
            staffMemberId: 10110004,
            input: {
              spentOn: '2026-05-05',
              amount: 530,
              expenseCategoryId: 10000003,
              memo: null,
            },
          },
          expected: expect.objectContaining({
            StaffMemberId: 10110004,
            ExpenseCategoryId: 10000003,
            spentOn: '2026-05-05',
            amount: 530,
            memo: null,
            status: 'recorded',
          }),
        },
        {
          params: {
            staffMemberId: 10110004,
            input: {
              spentOn: '2026-05-06',
              amount: 8175,
              expenseCategoryId: 10000004,
              // memo: undefined -- not presented, and normalized to null
            },
          },
          expected: expect.objectContaining({
            StaffMemberId: 10110004,
            ExpenseCategoryId: 10000004,
            spentOn: '2026-05-06',
            amount: 8175,
            memo: null,
            status: 'recorded',
          }),
        },
      ]

      test.each(cases)('input.spentOn: $params.input.spentOn', async ({
        params,
        expected,
      }) => {
        const resolver = RecordExpenseMutationResolver.create()

        const actual = await resolver.ExpenseModel.beginTransaction(
          async transaction =>
            resolver.createExpense(/** @type {*} */ ({
              staffMemberId: params.staffMemberId,
              input: params.input,
              transaction,
            }))
        )

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The operation refuses with `204.M004.001` when the context carries no member of staff, and
     * refuses it **before it reads or writes anything**.
     *
     * The engine is where a tokenless caller is really stopped — `recordExpense` is absent from
     * `StaffGraphqlServerEngine#get:schemasToSkipFiltering`, so the authentication filter refuses
     * one before `#resolve()` is entered. What is asserted here is the resolver's own second line,
     * for the case where that hand-maintained list is wrong: unguarded, a misconfiguration would
     * write a row owned by nobody.
     * `tests/__tests__/server/graphql/resolvers/staff/actual/queries/ExpensesQueryResolver.js`
     * carries the same describe for `expenses`, and this one follows its shape.
     *
     * The cases differ in how the context fails to name a member of staff, and in what was asked
     * for: an entry nothing else is wrong with, two an expense could not be made of, and one
     * naming a category no row holds. **The session code comes back in every one of them**, which
     * is what pins the ordering rather than merely the existence of the branch — a later
     * refactoring that validated the input first, or that read the category first, would answer
     * `203.M004.*` or `204.M004.002` here and change what a caller with no session is told about
     * what they sent.
     *
     * Every call below is refused before a transaction is opened, so this describe writes no row
     * and consumes none of the allocation stated at the head of this file.
     */
    describe('when the context carries no member of staff', () => {
      const cases = [
        {
          params: {
            context: {
              staffMemberId: null,
              now: new Date('2026-09-15T01:00:00.000Z'),
            },
            input: {
              spentOn: '2026-09-10',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'a train fare presented with no session',
            },
          },
          label: 'staffMemberId null, with an entry nothing else is wrong with',
          expected: '204.M004.001',
        },
        {
          params: {
            context: {
              // staffMemberId: undefined -- no member of staff was resolved at all
              staffMember: null,
              now: new Date('2026-09-15T01:00:00.000Z'),
            },
            input: {
              spentOn: '2026-09-09',
              amount: 3400,
              expenseCategoryId: 10000002,
              memo: 'a lunch presented with no session',
            },
          },
          label: 'staffMemberId absent from a context carrying the rest',
          expected: '204.M004.001',
        },
        {
          params: {
            context: {
              staffMemberId: null,
              now: new Date('2026-09-15T01:00:00.000Z'),
            },
            input: {
              spentOn: '2026-09-08',
              amount: 0,
              expenseCategoryId: 10000003,
              memo: 'an amount no expense could be made of, with no session',
            },
          },
          label: 'staffMemberId null, with an amount of zero',
          expected: '204.M004.001',
        },
        {
          params: {
            context: {
              staffMemberId: null,
              now: new Date('2026-09-15T01:00:00.000Z'),
            },
            input: {
              spentOn: '2026-09-16',
              amount: 5600,
              expenseCategoryId: 10000004,
              memo: 'an entry dated after today, with no session',
            },
          },
          label: 'staffMemberId null, with an entry dated after today',
          expected: '204.M004.001',
        },
        {
          params: {
            context: {
              staffMemberId: null,
              now: new Date('2026-09-15T01:00:00.000Z'),
            },
            input: {
              spentOn: '2026-09-07',
              amount: 7800,
              expenseCategoryId: 10009992,
              memo: 'a category no row holds, with no session',
            },
          },
          label: 'staffMemberId null, naming a category no row holds',
          expected: '204.M004.001',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
        expected,
      }) => {
        const resolver = RecordExpenseMutationResolver.create()
        const resolveArgs = {
          variables: {
            input: params.input,
          },
          context: params.context,
        }

        const actual = () => resolver.resolve(/** @type {*} */ (resolveArgs))

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})
