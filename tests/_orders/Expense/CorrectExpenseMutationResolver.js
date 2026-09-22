import CorrectExpenseMutationResolver from '../../../server/graphql/resolvers/staff/actual/mutations/CorrectExpenseMutationResolver.js'

import ExpensesQueryResolver from '../../../server/graphql/resolvers/staff/actual/queries/ExpensesQueryResolver.js'

/*
 * The three methods of `correctExpense` that **write** — `#resolve()`, `#saveExpense()` and
 * `#updateExpense()` — against the real tables. Everything else this resolver has is in
 * `tests/__tests__/server/graphql/resolvers/staff/actual/mutations/CorrectExpenseMutationResolver.js`,
 * because placement is per method and not per class.
 *
 * -------------------------------------------------------------------------------------------
 * No row of `expenses` is created here, and none is given an explicit id
 * -------------------------------------------------------------------------------------------
 *
 * A correction rewrites a row that already exists, so unlike `recordExpense` this file needs no
 * row of its own: **every entry it corrects is one the development seeder wrote**
 * (`sequelize/seeders/development/20260914120004-000004-expenses.cjs`), and their ids are the ones
 * that seeder states. Nothing here inserts into `expenses` at all, so the collision its docblock
 * warns about — an explicit id written at or above the table's high-water mark — is not merely
 * avoided but unreachable.
 *
 * `expense_categories` is likewise never written. `tests/__tests__/sequelize/seeders/master/
 * expense_categories.js` asserts that whole table with one `toEqual`, so the four seeded rows
 * (`10000001`–`10000004`) are the only categories named, and a category that does not exist is
 * named by an id no row holds.
 *
 * -------------------------------------------------------------------------------------------
 * Which rows this file rewrites, and which it deliberately leaves alone
 * -------------------------------------------------------------------------------------------
 *
 * The seeder gives `10110001` ten entries (`10200001`–`10200010`) and `10110002` four
 * (`10200011`–`10200014`). This file rewrites only rows of `10110001`, and splits its ten into
 * two groups that never overlap:
 *
 *   - `10200001`–`10200005`, `10200007` and `10200009` are **corrected**. Each is corrected by
 *     exactly one case of one describe where the result is read back, so a page read afterwards
 *     shows that row carrying exactly what that case presented.
 *   - `10200006`, `10200008` and `10200010` are **never corrected**. They are the targets of the
 *     corrections that are *refused*, and are read back **unchanged** — which is how "a refused
 *     correction rewrites nothing" is proved rather than assumed.
 *
 * `10110002`'s four rows are never corrected by any case. They are the rows that exist and are not
 * the caller's, and one describe below reads that member of staff's whole page back to show an
 * attempt against them left every field of every one of them alone.
 *
 * Every corrected `spentOn` is chosen so that no two entries of `10110001` ever hold the same one
 * at the same moment — the seeder took the same care, because a same-date tie-break was never
 * decided and seeding data that raised the question would be deciding it.
 *
 * -------------------------------------------------------------------------------------------
 * How "the number of entries did not change" is proved
 * -------------------------------------------------------------------------------------------
 *
 * By reading the owner's page back through the product's own `ExpensesQueryResolver#resolve()` and
 * asserting `pagination.totalRecords`, which is the count of the **whole set** and not of the page.
 * `10110001` has ten seeded entries, so `totalRecords: 10` after a correction is the criterion —
 * an implementation that removed the row and inserted a replacement would answer ten as well, so
 * the corrected row's own `id` is asserted beside it: a re-inserted row carries a new id, minted
 * above the seeded block, and fails.
 *
 * `tests/_orders/Expense/RecordExpenseMutationResolver.js` proves "nothing was recorded" the same
 * way, and `tests/_orders/SignIn/SignInMutationResolver.js` before it.
 *
 * Nothing is mocked. Every refusal here is reachable from the input alone, from an id no row of the
 * caller's holds, or from a category id no row holds, so there is no branch that needs steering.
 *
 * -------------------------------------------------------------------------------------------
 * The clock, and why no case reads a wall clock
 * -------------------------------------------------------------------------------------------
 *
 * "An expense dated after today is refused" is decided by `CalendarDateInspector` against
 * `CALENDAR.TIMEZONE` (`Asia/Tokyo`), and the instant it reads is the one `#resolve()` hands it:
 * `context.now`. Every case below therefore **states its own instant** and dates its entry relative
 * to that, so the boundary is pinned to the day and nothing here depends on the day the suite
 * happens to run on.
 *
 * Two instants recur, and the pair is what pins the zone rather than merely the arithmetic:
 *
 *   - `2026-09-15T01:00:00.000Z` — `2026-09-15 10:00` in Tokyo, so today is `2026-09-15` in both
 *     zones.
 *   - `2026-09-15T15:30:00.000Z` — `2026-09-16 00:30` in Tokyo while UTC is still `2026-09-15`, so
 *     `2026-09-16` is **today** in the calendar's own zone and **tomorrow** in UTC. A resolver
 *     reading the host's zone rather than the constant refuses that correction, and no other case
 *     can tell the two apart.
 */

describe('CorrectExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The operation end to end: one row rewritten, and **only the identifier of it answered**.
     *
     * The assertion is a whole-object `toEqual` over a one-field object, which is what makes it the
     * CQRS criterion rather than a shape check — a resolver that helpfully returned the corrected
     * row beside the id, or the amount, or the owner, fails here.
     *
     * **The identifier is asserted by value rather than by kind**, unlike `recordExpense`'s: the id
     * of a correction is the caller's to name, not the database's to mint, so a resolver echoing
     * some other row's id would pass a `expect.any(Number)` and fails here.
     *
     * The three cases differ in the optional memo — presented, presented as null, and not presented
     * at all — so the answer is the same one field in all three.
     */
    describe('should answer with the identifier of the entry corrected and nothing else', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200001,
              spentOn: '2026-05-01',
              amount: 1500,
              expenseCategoryId: 10000002,
              memo: 'corrected: the fare was 1500, not 1200',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: {
            expenseId: 10200001,
          },
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200002,
              spentOn: '2026-05-02',
              amount: 990,
              expenseCategoryId: 10000003,
              memo: null,
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: {
            expenseId: 10200002,
          },
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200003,
              spentOn: '2026-05-03',
              amount: 3460,
              expenseCategoryId: 10000004,
              // memo: undefined -- the optional memo, not presented at all
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: {
            expenseId: 10200003,
          },
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', async ({
        params,
        expected,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()
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

describe('CorrectExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **"Correcting an entry changes it in place — the number of entries a member of staff has does
     * not change"** (spec section 11), and both halves are asserted by one read.
     *
     * The correction is the Arrange and the owner's own page is the Act, read through the product's
     * own `expenses` query. What comes back carries:
     *
     *   - the corrected row **under the id it already had**, holding every value the correction
     *     presented — a different `spentOn`, a different `amount`, a different category and a
     *     different memo, so no field could have been left behind and passed by looking unchanged;
     *   - `totalRecords: 10`, which is `10110001`'s seeded count and the count of the whole set
     *     rather than of the page.
     *
     * Those two together are what a delete-and-reinsert fails: it would answer ten as well, but the
     * replacement row carries a freshly minted id above the seeded block and no longer matches.
     *
     * The second case is the one that pins the zone. Its instant is `2026-09-15T15:30:00.000Z`,
     * already `2026-09-16` in Tokyo and still `2026-09-15` in UTC, so a correction dated
     * `2026-09-16` is today's in the calendar's own zone and tomorrow's in the host's. It is
     * accepted, and nothing else here would notice if the zone were wrong.
     */
    describe('should change the entry in place and leave the number of entries unchanged', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200004,
              spentOn: '2026-04-10',
              amount: 7700,
              expenseCategoryId: 10000003,
              memo: 'corrected: the ticket was a workshop, not a conference',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: expect.arrayContaining([
              {
                id: 10200004, // the id it already had: rewritten, not replaced
                spentOn: '2026-04-10',
                amount: 7700,
                memo: 'corrected: the ticket was a workshop, not a conference',
                status: 'recorded',
                expenseCategory: {
                  id: 10000003,
                  name: 'supplies',
                  displayOrder: 3,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
            ]),
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 10, // the seeded count, unmoved by the correction
            },
          },
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200005,
              spentOn: '2026-09-16', // today in Asia/Tokyo, tomorrow in UTC
              amount: 1,
              expenseCategoryId: 10000002,
              memo: 'corrected just after midnight in Tokyo',
            },
            presentedAt: new Date('2026-09-15T15:30:00.000Z'),
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: expect.arrayContaining([
              {
                id: 10200005,
                spentOn: '2026-09-16',
                amount: 1,
                memo: 'corrected just after midnight in Tokyo',
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
            ]),
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 10,
            },
          },
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', async ({
        params,
        expected,
      }) => {
        const correctResolver = CorrectExpenseMutationResolver.create()
        await correctResolver.resolve(/** @type {*} */ ({
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

describe('CorrectExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **The full replace, and the trap it carries: a correction that omits the memo CLEARS it.**
     *
     * `CorrectExpenseInput` types `spentOn`, `amount` and `expenseCategoryId` non-null and `memo`
     * nullable, so there is no spelling of "leave the memo alone" — an absent memo and a memo of
     * null are the same correction, and both write null. Checkpoint 2 recorded this as the trap a
     * screen gets wrong once and a member of staff discovers by losing something they had typed,
     * so it is asserted rather than left to the contract to imply.
     *
     * Both rows corrected here carried a memo before the correction (`10200007` and `10200009` are
     * seeded with one), and both read back with none. A resolver that quietly preserved the old
     * memo when the correction presented none would fail here — and would be the defect the screen
     * is being warned about, moved into the backend.
     */
    describe('should clear the memo when the correction presents none', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200007, // seeded with the memo 'one envelope, bought singly'
              spentOn: '2026-03-20',
              amount: 480,
              expenseCategoryId: 10000001,
              // memo: undefined -- not presented, which CLEARS the memo the row carried
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: expect.arrayContaining([
              {
                id: 10200007,
                spentOn: '2026-03-20',
                amount: 480,
                memo: null, // cleared by a correction that presented none
                status: 'recorded',
                expenseCategory: {
                  id: 10000001,
                  name: 'transport',
                  displayOrder: 1,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
            ]),
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 10,
            },
          },
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200009, // seeded with the memo 'taxi from the station in the rain'
              spentOn: '2026-03-21',
              amount: 3900,
              expenseCategoryId: 10000004,
              memo: null, // presented as null, which is the same correction
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: expect.arrayContaining([
              {
                id: 10200009,
                spentOn: '2026-03-21',
                amount: 3900,
                memo: null,
                status: 'recorded',
                expenseCategory: {
                  id: 10000004,
                  name: 'other',
                  displayOrder: 4,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
            ]),
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 10,
            },
          },
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', async ({
        params,
        expected,
      }) => {
        const correctResolver = CorrectExpenseMutationResolver.create()
        await correctResolver.resolve(/** @type {*} */ ({
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

describe('CorrectExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **"Correcting an expense belonging to somebody else is answered as NOT FOUND, and the answer
     * says nothing about whether it exists"** (spec sections 7 and 11), and this describe is where
     * the *sameness* of the two answers is asserted rather than merely the throwing.
     *
     * The four cases are two of each kind, and **every one of them declares the same expected
     * code**:
     *
     *   - `10200011` and `10200013` are seeded rows of `10110002`. They genuinely exist, and they
     *     genuinely are not the caller's.
     *   - `10200098` and `10200099` are ids no row of the table holds at all.
     *
     * All four come back `204.M005.002`, from the one line of `#saveExpense()` that turns a `null`
     * read into a refusal. There is no second code to come back instead, because
     * `CorrectExpenseMutationResolver.errorCodeHash` declares none — a resolver that told the two
     * apart would have to invent one, and that invention is the leak this criterion forbids.
     *
     * A test that only asserted "it throws" would pass while the two answers differed. Asserting
     * the identical literal across the two kinds of id is what makes the two indistinguishable to a
     * caller, and it is the only thing a caller can see: the error carries the code as its whole
     * message and nothing else — no id, no owner, no count.
     *
     * Every input below is otherwise valid — a plausible id, a past date, a positive amount, a
     * seeded category — so nothing but the entry itself can be what refuses them.
     */
    describe('should answer the identical not-found code for another member of staff entry and for an id no row holds', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200011, // exists, and belongs to 10110002
              spentOn: '2026-08-27',
              amount: 4390,
              expenseCategoryId: 10000003,
              memo: 'an attempt on somebody else keyboard',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '204.M005.002',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200013, // exists, and belongs to 10110002
              spentOn: '2026-09-05',
              amount: 33500,
              expenseCategoryId: 10000001,
              memo: 'an attempt on somebody else fare',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '204.M005.002',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200098, // no row of the table holds it
              spentOn: '2026-08-27',
              amount: 4390,
              expenseCategoryId: 10000003,
              memo: 'an attempt on nothing at all',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '204.M005.002',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200099, // nor this one
              spentOn: '2026-09-05',
              amount: 33500,
              expenseCategoryId: 10000001,
              memo: 'an attempt on nothing at all, again',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '204.M005.002',
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', async ({
        params,
        expected,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()
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

describe('CorrectExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The other half of that criterion: **an attempt against somebody else's entry leaves that
     * entry untouched.** A refusal that had already written would satisfy the describe above and
     * lose somebody's record.
     *
     * The refused correction is the Arrange, and the Act is a read of the **owner's** own page —
     * `10110002`'s, through the product's own `expenses` query. What is asserted is that whole page
     * by value: all four seeded rows, every field of every one of them, and `totalRecords: 4`. No
     * case of this file corrects a row of `10110002`, so the page is the seeder's own and any
     * difference at all is the refusal having written.
     *
     * Each refused correction presents values that differ from the seeded row in every field, so a
     * write that slipped through could not pass by coincidence.
     */
    describe('should rewrite nothing when the entry belongs to somebody else', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200012, // belongs to 10110002
              spentOn: '2026-01-05',
              amount: 66600,
              expenseCategoryId: 10000002,
              memo: 'a correction that must never land',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            ownerStaffMemberId: 10110002,
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: [
              {
                id: 10200013,
                spentOn: '2026-09-05',
                amount: 33500,
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
              {
                id: 10200011,
                spentOn: '2026-08-27',
                amount: 4390,
                memo: 'replacement keyboard for the shared desk',
                status: 'recorded',
                expenseCategory: {
                  id: 10000003,
                  name: 'supplies',
                  displayOrder: 3,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
              {
                id: 10200012,
                spentOn: '2026-07-09',
                amount: 715,
                memo: 'postage on the signed contract',
                status: 'recorded',
                expenseCategory: {
                  id: 10000004,
                  name: 'other',
                  displayOrder: 4,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
              {
                id: 10200014,
                spentOn: '2026-06-18',
                amount: 1860,
                memo: 'dinner with the visiting auditor',
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
              totalRecords: 4,
            },
          },
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200014, // belongs to 10110002
              spentOn: '2026-01-06',
              amount: 77700,
              expenseCategoryId: 10000003,
              // memo: undefined -- which would have cleared the memo, had it landed
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            ownerStaffMemberId: 10110002,
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: [
              {
                id: 10200013,
                spentOn: '2026-09-05',
                amount: 33500,
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
              {
                id: 10200011,
                spentOn: '2026-08-27',
                amount: 4390,
                memo: 'replacement keyboard for the shared desk',
                status: 'recorded',
                expenseCategory: {
                  id: 10000003,
                  name: 'supplies',
                  displayOrder: 3,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
              {
                id: 10200012,
                spentOn: '2026-07-09',
                amount: 715,
                memo: 'postage on the signed contract',
                status: 'recorded',
                expenseCategory: {
                  id: 10000004,
                  name: 'other',
                  displayOrder: 4,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
              {
                id: 10200014,
                spentOn: '2026-06-18',
                amount: 1860,
                memo: 'dinner with the visiting auditor',
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
              totalRecords: 4,
            },
          },
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', async ({
        params,
        expected,
      }) => {
        const correctResolver = CorrectExpenseMutationResolver.create()
        const refusedCorrection = () => correctResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
            now: params.presentedAt,
          },
        }))
        await expect(refusedCorrection)
          .rejects
          .toThrow('204.M005.002')
        const readResolver = ExpensesQueryResolver.create()
        const readArgs = {
          variables: {
            input: {
              pagination: params.pagination,
            },
          },
          context: {
            staffMemberId: params.ownerStaffMemberId,
          },
        }

        const actual = await readResolver.resolve(/** @type {*} */ (readArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **"An expense dated after today is refused"** (spec section 11), with `203.M005.009` as the
     * refusal — the same criterion `recordExpense` owes, on the same clock.
     *
     * Each case dates its correction one day past the day its own instant falls on in Tokyo, so the
     * boundary is pinned to the day rather than to a year far enough away to be safe:
     *
     *   - `2026-09-15T01:00:00.000Z` is `2026-09-15` in Tokyo, and `2026-09-16` is refused.
     *   - `2026-09-15T14:59:59.000Z` is `2026-09-15 23:59:59` in Tokyo — the last second of today —
     *     and `2026-09-16` is still refused.
     *   - `2026-09-15T15:30:00.000Z` is `2026-09-16 00:30` in Tokyo, and it is now `2026-09-17`
     *     that is refused. The same instant *accepts* `2026-09-16`, two describes above.
     *
     * Every case names `10200006`, an entry the caller really does hold, so the refusal cannot be
     * the not-found answer wearing a different code.
     *
     * The title interpolates the instant, because two of the three cases present the same date and
     * it is the clock that moved.
     */
    describe('should refuse a correction dated after today', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200006,
              spentOn: '2026-09-16',
              amount: 2175,
              expenseCategoryId: 10000001,
              memo: 'a fare not yet paid',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M005.009',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200006,
              spentOn: '2026-09-16',
              amount: 760,
              expenseCategoryId: 10000002,
              memo: 'a lunch not yet eaten',
            },
            presentedAt: new Date('2026-09-15T14:59:59.000Z'),
          },
          expected: '203.M005.009',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200006,
              spentOn: '2026-09-17',
              amount: 9400,
              expenseCategoryId: 10000003,
              memo: 'supplies not yet ordered',
            },
            presentedAt: new Date('2026-09-15T15:30:00.000Z'),
          },
          expected: '203.M005.009',
        },
      ]

      test.each(cases)('presentedAt: $params.presentedAt', async ({
        params,
        expected,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()
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

describe('CorrectExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The other half of that criterion: **a correction dated after today rewrites nothing.** The
     * refusal is the Arrange and the owner's page is the Act.
     *
     * `10200006` is corrected by no case of this file, so what comes back is the seeder's own row —
     * `2026-08-05`, 5730 yen, no memo, filed under meals — and every field of the refused
     * correction differs from it. `totalRecords: 10` beside it says the refusal neither wrote nor
     * removed.
     */
    describe('should rewrite nothing when the correction is dated after today', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200006,
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
            expenses: expect.arrayContaining([
              {
                id: 10200006,
                spentOn: '2026-08-05', // the seeded value, untouched
                amount: 5730,
                memo: null,
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
            ]),
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 10,
            },
          },
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200006,
              spentOn: '2026-09-17',
              amount: 330,
              expenseCategoryId: 10000001,
              memo: 'a fare of the day after tomorrow',
            },
            presentedAt: new Date('2026-09-15T15:30:00.000Z'),
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: expect.arrayContaining([
              {
                id: 10200006,
                spentOn: '2026-08-05',
                amount: 5730,
                memo: null,
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
            ]),
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 10,
            },
          },
        },
      ]

      test.each(cases)('presentedAt: $params.presentedAt', async ({
        params,
        expected,
      }) => {
        const correctResolver = CorrectExpenseMutationResolver.create()
        const refusedCorrection = () => correctResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
            now: params.presentedAt,
          },
        }))
        await expect(refusedCorrection)
          .rejects
          .toThrow('203.M005.009')
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

describe('CorrectExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **"An expense with no amount … is refused"** (spec section 11), with `203.M005.003` as the
     * refusal — the presence half of that criterion.
     *
     * Both spellings of "no amount" are presented: the field sent as null, and the field not sent at
     * all. GraphQL types `amount` as `Int!` and would refuse both before a resolver ran, so these
     * two cases are the resolver being asked directly — which is how a caller reaching it any other
     * way would arrive.
     */
    describe('should refuse a correction presenting no amount', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200010,
              spentOn: '2026-09-08',
              amount: null,
              expenseCategoryId: 10000001,
              memo: 'a fare with no amount beside it',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M005.003',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200010,
              spentOn: '2026-09-07',
              // amount: undefined -- not presented at all
              expenseCategoryId: 10000002,
              memo: 'a lunch with no amount beside it',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M005.003',
        },
      ]

      test.each(cases)('input.spentOn: $params.input.spentOn', async ({
        params,
        expected,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()
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

describe('CorrectExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **"… an amount of zero, or a negative amount is refused"** (spec section 11), with
     * `203.M005.007` as the refusal — the value half of that criterion, and a separate code from
     * the presence half on purpose: a caller who sent nothing and a caller who sent `-4500` have
     * different things to correct.
     *
     * A fractional amount is refused under the same code, because the yen has no minor unit and the
     * column is an `int`.
     */
    describe('should refuse a correction presenting an amount of zero or less', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200010,
              spentOn: '2026-09-06',
              amount: 0,
              expenseCategoryId: 10000001,
              memo: 'a fare that cost nothing',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M005.007',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200010,
              spentOn: '2026-09-05',
              amount: -4500,
              expenseCategoryId: 10000002,
              memo: 'a lunch that paid the payer',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M005.007',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200010,
              spentOn: '2026-09-04',
              amount: 1200.5,
              expenseCategoryId: 10000003,
              memo: 'half a yen of stationery',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M005.007',
        },
      ]

      test.each(cases)('input.amount: $params.input.amount', async ({
        params,
        expected,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()
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

describe('CorrectExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The other half of the amount criteria: **a correction whose amount is missing, zero or
     * negative rewrites nothing.** The refusal is the Arrange and the owner's page is the Act.
     *
     * `10200010` is corrected by no case of this file, so what comes back is the seeder's own row —
     * `2026-08-13`, 2175 yen, the team-breakfast memo, filed under meals.
     *
     * The two cases carry the two refusals of this pair, `203.M005.003` for the amount left out and
     * `203.M005.007` for the negative one, and both leave the row exactly as it was.
     */
    describe('should rewrite nothing when the amount is missing or not positive', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200010,
              spentOn: '2026-09-03',
              amount: null,
              expenseCategoryId: 10000004,
              memo: 'an amount left out, sent as null',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            refusalCode: '203.M005.003',
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: expect.arrayContaining([
              {
                id: 10200010,
                spentOn: '2026-08-13', // the seeded value, untouched
                amount: 2175,
                memo: 'team breakfast before the release',
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
            ]),
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 10,
            },
          },
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200010,
              spentOn: '2026-09-01',
              amount: -12000,
              expenseCategoryId: 10000001,
              memo: 'a ticket of minus twelve thousand yen',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            refusalCode: '203.M005.007',
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: expect.arrayContaining([
              {
                id: 10200010,
                spentOn: '2026-08-13',
                amount: 2175,
                memo: 'team breakfast before the release',
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
            ]),
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 10,
            },
          },
        },
      ]

      test.each(cases)('input.spentOn: $params.input.spentOn', async ({
        params,
        expected,
      }) => {
        const correctResolver = CorrectExpenseMutationResolver.create()
        const refusedCorrection = () => correctResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
            now: params.presentedAt,
          },
        }))
        await expect(refusedCorrection)
          .rejects
          .toThrow(params.refusalCode)
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

describe('CorrectExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **A category that does not exist is answered with an error code, not with a raw model
     * exception.**
     *
     * `Expense` carries a `verifyExpenseCategory` hook on the instance save this operation performs,
     * and it would refuse these corrections on its own — with `Error('Expense names an
     * ExpenseCategory that does not exist: 10009996')`, a model exception escaping to the transport
     * and carrying a row id into a message nobody meant to publish. What comes back instead is
     * `204.M005.003`, which is this resolver's own answer: it reads the category first, inside the
     * same transaction the update would join, and refuses before the hook is ever reached.
     *
     * So the assertion is deliberately the code and not a substring of that sentence.
     *
     * Both ids are plausible values — positive whole numbers, so the validator's `203.M005.008` is
     * satisfied and it is existence, not shape, that refuses them — and neither belongs to the
     * four-row master. **No category row is created to make them real**, and none is created
     * anywhere in this file.
     */
    describe('should refuse a correction naming a category that does not exist', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200008,
              spentOn: '2026-08-29',
              amount: 1860,
              expenseCategoryId: 10009996, // no row of the master holds it
              memo: 'a dinner filed under nothing',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '204.M005.003',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200008,
              spentOn: '2026-08-28',
              amount: 260,
              expenseCategoryId: 55555555, // nor this one
              memo: 'a fare filed under nothing',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '204.M005.003',
        },
      ]

      test.each(cases)('input.expenseCategoryId: $params.input.expenseCategoryId', async ({
        params,
        expected,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()
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

describe('CorrectExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **A correction naming a category that does not exist rewrites nothing**, which is the
     * transaction doing its work: the refusal is raised inside the one `#saveExpense()` opens and
     * before the update, so there is nothing to commit.
     *
     * `10200008` is corrected by no case of this file, so what comes back is the seeder's own row —
     * `2026-09-09`, 98000 yen, the membership memo, filed under other.
     */
    describe('should rewrite nothing for a category that does not exist', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200008,
              spentOn: '2026-08-27',
              amount: 4800,
              expenseCategoryId: 10009997,
              memo: 'supplies filed under nothing',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: expect.arrayContaining([
              {
                id: 10200008,
                spentOn: '2026-09-09', // the seeded value, untouched
                amount: 98000,
                memo: 'annual membership of the standards body',
                status: 'recorded',
                expenseCategory: {
                  id: 10000004,
                  name: 'other',
                  displayOrder: 4,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
            ]),
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 10,
            },
          },
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200008,
              spentOn: '2026-08-26',
              amount: 33500,
              expenseCategoryId: 44444444,
              memo: 'a ticket filed under nothing',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: expect.arrayContaining([
              {
                id: 10200008,
                spentOn: '2026-09-09',
                amount: 98000,
                memo: 'annual membership of the standards body',
                status: 'recorded',
                expenseCategory: {
                  id: 10000004,
                  name: 'other',
                  displayOrder: 4,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
            ]),
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 10,
            },
          },
        },
      ]

      test.each(cases)('input.expenseCategoryId: $params.input.expenseCategoryId', async ({
        params,
        expected,
      }) => {
        const correctResolver = CorrectExpenseMutationResolver.create()
        const refusedCorrection = () => correctResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
            now: params.presentedAt,
          },
        }))
        await expect(refusedCorrection)
          .rejects
          .toThrow('204.M005.003')
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

describe('CorrectExpenseMutationResolver', () => {
  describe('#saveExpense()', () => {
    /*
     * The write on its own, outside `#resolve()`: it opens the transaction, refuses an entry the
     * caller does not hold, refuses a category that does not exist and returns the row it rewrote.
     *
     * It reads no input rule, so the corrections below are not validated on the way past — that is
     * `#validateInput()`'s work and `#resolve()`'s order of business, both asserted elsewhere. What
     * is asserted here is the row: the owner is unchanged, `status` is still `recorded`, and the id
     * is the one the entry already had.
     *
     * The rows named are `10200001` and `10200002`, which the first describe of this file already
     * corrected and no describe reads a page of — so rewriting them again disturbs nothing.
     */
    describe('should rewrite the entry and answer with the row', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200001,
              spentOn: '2026-02-01',
              amount: 1375,
              expenseCategoryId: 10000001,
              memo: 'taxi home after the late release',
            },
          },
          expected: expect.objectContaining({
            id: 10200001,
            StaffMemberId: 10110001,
            ExpenseCategoryId: 10000001,
            spentOn: '2026-02-01',
            amount: 1375,
            memo: 'taxi home after the late release',
            status: 'recorded',
          }),
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200002,
              spentOn: '2026-02-02',
              amount: 20800,
              expenseCategoryId: 10000004,
              memo: null,
            },
          },
          expected: expect.objectContaining({
            id: 10200002,
            StaffMemberId: 10110001,
            ExpenseCategoryId: 10000004,
            spentOn: '2026-02-02',
            amount: 20800,
            memo: null,
            status: 'recorded',
          }),
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', async ({
        params,
        expected,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()

        const actual = await resolver.saveExpense(/** @type {*} */ (params))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
  describe('#saveExpense()', () => {
    /*
     * The not-found refusal this method owns, raised inside the transaction it opened, so the
     * update beside it never runs — and raised from one read that narrowed by owner and identifier
     * together, so an entry somebody else holds and an entry nobody holds are the same `null` and
     * the same `204.M005.002`.
     *
     * The four cases are two of each kind and declare the same expected code, exactly as the
     * `#resolve()` describe above does, because the property belongs to this method and is merely
     * visible through that one.
     */
    describe('should answer the identical not-found code whether the entry is another member of staff or nobody', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200011, // exists, and belongs to 10110002
              spentOn: '2026-01-11',
              amount: 910,
              expenseCategoryId: 10000001,
              memo: 'an attempt on somebody else entry',
            },
          },
          expected: '204.M005.002',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200012, // exists, and belongs to 10110002
              spentOn: '2026-01-12',
              amount: 6650,
              expenseCategoryId: 10000002,
              memo: 'another attempt on somebody else entry',
            },
          },
          expected: '204.M005.002',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200096, // no row of the table holds it
              spentOn: '2026-01-13',
              amount: 910,
              expenseCategoryId: 10000001,
              memo: 'an attempt on nothing at all',
            },
          },
          expected: '204.M005.002',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200097, // nor this one
              spentOn: '2026-01-14',
              amount: 6650,
              expenseCategoryId: 10000002,
              memo: 'another attempt on nothing at all',
            },
          },
          expected: '204.M005.002',
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', async ({
        params,
        expected,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()

        const actual = () => resolver.saveExpense(/** @type {*} */ (params))

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
  describe('#saveExpense()', () => {
    /*
     * The category refusal this method owns, raised inside the transaction it opened and after the
     * entry has already been found — so it can only be reached by a caller who really does hold the
     * entry, which is why `10200001` is named rather than somebody else's row.
     *
     * The code is the resolver's own `204.M005.003` and not the model hook's sentence — see the
     * `#resolve()` describe above for why the difference matters.
     */
    describe('should refuse a category that does not exist', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200001,
              spentOn: '2026-01-21',
              amount: 910,
              expenseCategoryId: 10009998,
              memo: 'a fare filed under nothing',
            },
          },
          expected: '204.M005.003',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200001,
              spentOn: '2026-01-22',
              amount: 6650,
              expenseCategoryId: 33333333,
              memo: 'a dinner filed under nothing',
            },
          },
          expected: '204.M005.003',
        },
      ]

      test.each(cases)('input.expenseCategoryId: $params.input.expenseCategoryId', async ({
        params,
        expected,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()

        const actual = () => resolver.saveExpense(/** @type {*} */ (params))

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
  describe('#updateExpense()', () => {
    /*
     * The update itself, handed the row it is to rewrite — which is how `#saveExpense()` calls it,
     * having just read that row inside the transaction.
     *
     * **The memo is what this method is really asserted on**: it normalizes an absent one to null
     * rather than leaving it out, so the third case is the one that would notice if that line went
     * away — and it is the full replace, which is the trap this whole operation carries. Every one
     * of the three rows below held a memo when the case began, and the last two read back with
     * none.
     *
     * **`StaffMemberId` is asserted unchanged in all three**, because the method deliberately does
     * not write that column: a correction cannot hand an entry to somebody else.
     *
     * The entry is fetched through the resolver's own `#findExpense()` rather than through the
     * model, so the test exercises no read path the product does not have. No transaction is opened
     * around either step: this method is being exercised on its own, outside the one
     * `#saveExpense()` opens.
     */
    describe('should rewrite the entry with the memo normalized', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200003,
              spentOn: '2026-02-03',
              amount: 4310,
              expenseCategoryId: 10000002,
              memo: 'lunch with the two visiting engineers',
            },
          },
          expected: expect.objectContaining({
            id: 10200003,
            StaffMemberId: 10110001,
            ExpenseCategoryId: 10000002,
            spentOn: '2026-02-03',
            amount: 4310,
            memo: 'lunch with the two visiting engineers',
            status: 'recorded',
          }),
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200001,
              spentOn: '2026-02-04',
              amount: 530,
              expenseCategoryId: 10000003,
              memo: null,
            },
          },
          expected: expect.objectContaining({
            id: 10200001,
            StaffMemberId: 10110001,
            ExpenseCategoryId: 10000003,
            spentOn: '2026-02-04',
            amount: 530,
            memo: null,
            status: 'recorded',
          }),
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200002,
              spentOn: '2026-02-05',
              amount: 8175,
              expenseCategoryId: 10000004,
              // memo: undefined -- not presented, and normalized to null
            },
          },
          expected: expect.objectContaining({
            id: 10200002,
            StaffMemberId: 10110001,
            ExpenseCategoryId: 10000004,
            spentOn: '2026-02-05',
            amount: 8175,
            memo: null,
            status: 'recorded',
          }),
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', async ({
        params,
        expected,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()
        const expenseEntity = await resolver.findExpense(/** @type {*} */ ({
          expenseId: params.input.expenseId,
          staffMemberId: params.staffMemberId,
          transaction: null,
        }))

        const actual = await resolver.updateExpense(/** @type {*} */ ({
          expenseEntity,
          input: params.input,
          transaction: null,
        }))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The operation refuses with `204.M005.001` when the context carries no member of staff, and
     * refuses it **before it reads or rewrites anything**.
     *
     * The engine is where a tokenless caller is really stopped — `correctExpense` is absent from
     * `StaffGraphqlServerEngine#get:schemasToSkipFiltering`, so the authentication filter refuses
     * one before `#resolve()` is entered. What is asserted here is the resolver's own second line,
     * for the case where that hand-maintained list is wrong: unguarded, a misconfiguration would
     * rewrite a row on behalf of nobody.
     * `tests/__tests__/server/graphql/resolvers/staff/actual/queries/ExpensesQueryResolver.js`
     * carries the same describe for `expenses`, and this one follows its shape.
     *
     * The cases differ in how the context fails to name a member of staff, and in what was asked
     * for: a correction nothing else is wrong with, two no correction could be made of, one naming
     * an entry that is somebody else's, and one naming a category no row holds. **The session code
     * comes back in every one of them**, which is what pins the ordering rather than merely the
     * existence of the branch — a later refactoring that validated the input first, or that read
     * the entry first, would answer `203.M005.*` or `204.M005.002` here and change what a caller
     * with no session is told about what they sent.
     *
     * Every call below is refused before a transaction is opened, so no row is rewritten and the
     * allocation stated at the head of this file is untouched: the entries named are ones this
     * file deliberately never corrects (`10200006`, `10200008`, `10200010`) and one of
     * `10110002`'s, which no case here corrects either.
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
              expenseId: 10200006,
              spentOn: '2026-09-10',
              amount: 1300,
              expenseCategoryId: 10000001,
              memo: 'a correction presented with no session',
            },
          },
          label: 'staffMemberId null, with a correction nothing else is wrong with',
          expected: '204.M005.001',
        },
        {
          params: {
            context: {
              // staffMemberId: undefined -- no member of staff was resolved at all
              staffMember: null,
              now: new Date('2026-09-15T01:00:00.000Z'),
            },
            input: {
              expenseId: 10200008,
              spentOn: '2026-09-09',
              amount: 3500,
              expenseCategoryId: 10000002,
              memo: 'another correction presented with no session',
            },
          },
          label: 'staffMemberId absent from a context carrying the rest',
          expected: '204.M005.001',
        },
        {
          params: {
            context: {
              staffMemberId: null,
              now: new Date('2026-09-15T01:00:00.000Z'),
            },
            input: {
              // expenseId: undefined -- no entry named at all
              spentOn: '2026-09-08',
              amount: 4600,
              expenseCategoryId: 10000003,
              memo: 'a correction naming no entry, with no session',
            },
          },
          label: 'staffMemberId null, with no entry named at all',
          expected: '204.M005.001',
        },
        {
          params: {
            context: {
              staffMemberId: null,
              now: new Date('2026-09-15T01:00:00.000Z'),
            },
            input: {
              expenseId: 10200010,
              spentOn: '2026-09-07',
              amount: 0,
              expenseCategoryId: 10000004,
              memo: 'an amount no correction could be made of, with no session',
            },
          },
          label: 'staffMemberId null, with an amount of zero',
          expected: '204.M005.001',
        },
        {
          params: {
            context: {
              staffMemberId: null,
              now: new Date('2026-09-15T01:00:00.000Z'),
            },
            input: {
              expenseId: 10200011,
              spentOn: '2026-09-06',
              amount: 7900,
              expenseCategoryId: 10000001,
              memo: 'another member of staff entry, with no session',
            },
          },
          label: 'staffMemberId null, naming another member of staff entry',
          expected: '204.M005.001',
        },
        {
          params: {
            context: {
              staffMemberId: null,
              now: new Date('2026-09-15T01:00:00.000Z'),
            },
            input: {
              expenseId: 10200006,
              spentOn: '2026-09-05',
              amount: 8100,
              expenseCategoryId: 10009992,
              memo: 'a category no row holds, with no session',
            },
          },
          label: 'staffMemberId null, naming a category no row holds',
          expected: '204.M005.001',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
        expected,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()
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
