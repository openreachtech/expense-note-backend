import RecordExpenseMutationResolver from '../../../server/graphql/resolvers/staff/actual/mutations/RecordExpenseMutationResolver.js'
import CorrectExpenseMutationResolver from '../../../server/graphql/resolvers/staff/actual/mutations/CorrectExpenseMutationResolver.js'
import RemoveExpenseMutationResolver from '../../../server/graphql/resolvers/staff/actual/mutations/RemoveExpenseMutationResolver.js'

import MonthlyExpensesQueryResolver from '../../../server/graphql/resolvers/staff/actual/queries/MonthlyExpensesQueryResolver.js'

import StaffMember from '../../../sequelize/models/StaffMember.js'

/*
 * **The three things section 12 requires of `monthlyExpenses` that the seeded fixtures cannot
 * reach.**
 *
 *   1. that an expense dated the **day after** the chosen month is not in it -- the seeder holds no
 *      row on the day after a month whose entries it also holds;
 *   2. that an expense **recorded, corrected or removed is reflected on the next read**, in the
 *      entries and in the total -- which needs the change to be made;
 *   3. that two entries of one date come back with the more recently recorded first (spec section
 *      6, `entry order`) -- the seeder gives no member of staff two rows on one date, deliberately
 *      and for a reason its own docblock states.
 *
 * Every other test of this operation lives in
 * `tests/__tests__/server/graphql/resolvers/staff/actual/queries/MonthlyExpensesQueryResolver.js`,
 * and that is where a reader looks first.
 *
 * -------------------------------------------------------------------------------------------
 * Why this suite writes, and therefore why it is here rather than beside its siblings
 * -------------------------------------------------------------------------------------------
 *
 * **`monthlyExpenses` writes nothing** -- it is a query, it takes no transaction, and it calls no
 * `create` / `update` / `destroy`. By the placement rule its tests belong in `tests/__tests__/`,
 * and almost all of them are there. What puts *this* file in `tests/_orders/` is **what the test's
 * own path does, not what the method under test does**: reaching the three claims above means
 * recording, correcting and removing entries, and each of those writes.
 *
 * Splitting it -- the writes here, the assertion there -- would put the assertion in a file that
 * may not assume the rows exist, in a phase that runs **before** this one against a database of its
 * own. It would assert nothing.
 *
 * It is in the `Expense/` folder because that is the table its rows belong to, and it is listed
 * last in that folder's `_.test.js`: nothing here depends on the suites before it, and nothing
 * after it depends on this one.
 *
 * -------------------------------------------------------------------------------------------
 * How the rows are made, and how they are kept out of everybody else's fixtures
 * -------------------------------------------------------------------------------------------
 *
 * **Through the product's own write paths -- `recordExpense`, `correctExpense`, `removeExpense` --
 * with the ids left to the database.** No row of `expenses` is given an explicit id here:
 * `../README.md` and the development seeder both spell out why one written into a product-written
 * table manufactures its own collision. Nothing below states an `expenses` id, and nothing below
 * needs to -- a row is told apart by the values it was recorded with, and a row that has to be
 * corrected or removed is named by the id the database returned.
 *
 * **Each case records for a member of staff of its own, created by this file.** `staff_members` is
 * the one table nothing but tests and seeders write, which is what makes an explicit id safe there;
 * `10300001`-`10300010` sit in block `103`, `#monthly-summary`'s own, and no other block appears in
 * this file. No seeded member of staff is written for at all, so `10110001`-`10110010` keep exactly
 * the entries the seeder and the other suites of this folder gave them.
 *
 * A member of staff of this suite's own also makes every assertion **absolute**: the month holds
 * the rows the case put in it and nothing else, and the total is the total of the whole of what
 * that `where` can reach.
 *
 * No `expense_categories` row is created: the four seeded ones (`10000001`-`10000004`) are the only
 * categories named.
 *
 * Every case presents `2026-09-15T01:00:00.000Z` as `context.now`, one of the two instants
 * `RecordExpenseMutationResolver`'s own suite uses, so no date below is read against the day this
 * suite happens to run on. Every `spentOn` here is before it, so nothing here is near section 11's
 * future-dated refusal.
 *
 * `id` is asserted as `expect.any(Number)` throughout -- the database mints it and no test may
 * state it -- and the timestamps by kind, for the same reason the `__tests__` file gives.
 */

describe('MonthlyExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * **Section 12's second acceptance criterion, whole.** Each case records four entries: one on
     * the day before the chosen month, one on its first day, one on its last day, and one on the
     * day after. The read must answer with the middle two and neither of the outer two, and the
     * total must be the sum of the middle two alone.
     *
     * A range one day wide at either end therefore fails here twice over -- in the entries and in
     * the total -- and the two outer amounts are far larger than the two inner ones, so a total
     * that let one in is not a near miss.
     *
     * The second case is **February of a leap year**, whose last day is computed rather than looked
     * up: an entry dated `2024-02-29` is inside the month and one dated `2024-03-01` is not, which
     * is a boundary a month-length table with 28 in it would put in the wrong place.
     */
    describe('should answer the chosen month without the day before it or the day after it', () => {
      const cases = [
        {
          params: {
            staffMember: {
              id: 10300001,
              name: 'Month boundary reader, an ordinary month',
            },
            recordedBeforeMonth: {
              spentOn: '2026-05-31',
              amount: 5100,
              expenseCategoryId: 10000001,
              memo: 'the day before the chosen month begins',
            },
            recordedOnFirstDay: {
              spentOn: '2026-06-01',
              amount: 601,
              expenseCategoryId: 10000002,
              memo: 'the first day of the chosen month',
            },
            recordedOnLastDay: {
              spentOn: '2026-06-30',
              amount: 630,
              expenseCategoryId: 10000003,
              memo: 'the last day of the chosen month',
            },
            recordedAfterMonth: {
              spentOn: '2026-07-01',
              amount: 7100,
              expenseCategoryId: 10000004,
              memo: 'the day after the chosen month ends',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            input: {
              year: 2026,
              month: 6,
            },
          },
          expected: {
            expenses: [
              {
                id: expect.any(Number),
                spentOn: '2026-06-30',
                amount: 630,
                memo: 'the last day of the chosen month',
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
                id: expect.any(Number),
                spentOn: '2026-06-01',
                amount: 601,
                memo: 'the first day of the chosen month',
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
            totalAmount: 1231,
          },
        },
        {
          params: {
            staffMember: {
              id: 10300002,
              name: 'Month boundary reader, the February of a leap year',
            },
            recordedBeforeMonth: {
              spentOn: '2024-01-31',
              amount: 4131,
              expenseCategoryId: 10000004,
              memo: 'the day before the leap February begins',
            },
            recordedOnFirstDay: {
              spentOn: '2024-02-01',
              amount: 4201,
              expenseCategoryId: 10000003,
              memo: 'the first day of the leap February',
            },
            recordedOnLastDay: {
              spentOn: '2024-02-29',
              amount: 4229,
              expenseCategoryId: 10000002,
              memo: 'the twenty-ninth, which only a leap February has',
            },
            recordedAfterMonth: {
              spentOn: '2024-03-01',
              amount: 4301,
              expenseCategoryId: 10000001,
              memo: 'the day after the leap February ends',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            input: {
              year: 2024,
              month: 2,
            },
          },
          expected: {
            expenses: [
              {
                id: expect.any(Number),
                spentOn: '2024-02-29',
                amount: 4229,
                memo: 'the twenty-ninth, which only a leap February has',
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
              {
                id: expect.any(Number),
                spentOn: '2024-02-01',
                amount: 4201,
                memo: 'the first day of the leap February',
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
            totalAmount: 8430,
          },
        },
      ]

      test.each(cases)('staffMember.id: $params.staffMember.id', async ({
        params,
        expected,
      }) => {
        await StaffMember.create(params.staffMember)
        const recordResolver = RecordExpenseMutationResolver.create()
        await recordResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.recordedBeforeMonth,
          },
          context: {
            staffMemberId: params.staffMember.id,
            now: params.presentedAt,
          },
        }))
        await recordResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.recordedOnFirstDay,
          },
          context: {
            staffMemberId: params.staffMember.id,
            now: params.presentedAt,
          },
        }))
        await recordResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.recordedOnLastDay,
          },
          context: {
            staffMemberId: params.staffMember.id,
            now: params.presentedAt,
          },
        }))
        await recordResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.recordedAfterMonth,
          },
          context: {
            staffMemberId: params.staffMember.id,
            now: params.presentedAt,
          },
        }))
        const readResolver = MonthlyExpensesQueryResolver.create()
        const readArgs = {
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMember.id,
            now: params.presentedAt,
          },
        }

        const actual = await readResolver.resolve(/** @type {*} */ (readArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * **Section 6's `entry order`, the half the seeded fixtures cannot reach**: two entries of one
     * date come back with the more recently recorded first.
     *
     * Each case records three entries in one month: two sharing a date, and one on a date of its
     * own. The two that share a date differ in every other field, so naming them in the expected
     * array -- by amount, by memo, by category -- states which of the two came back first without
     * stating an id. **Their order can be decided by nothing but the tie-break**, because the only
     * other thing the ordering can read off them is the date they share.
     *
     * The third entry keeps the date key honest, and the **order it is recorded in** is chosen
     * against the wrong answers rather than for readability:
     *
     *   - `10300003` records its older entry **last**, so that entry holds the highest id of the
     *     three. A resolver ordering by `id` alone puts it first, and this case fails.
     *   - `10300004` records its newer entry **first**, so that entry holds the lowest id. The same
     *     resolver puts it last, and this case fails.
     *
     * **On SQLite this does not fail when `['id', 'DESC']` is deleted**, and that was measured on
     * the sibling operation rather than assumed: section 9.3's index is `(staff_member_id,
     * spent_on)`, SQLite keys its entries by the rowid beneath that, and serving `spent_on DESC` is
     * a backwards walk of the index, so tied rows arrive rowid descending -- already the order
     * section 6 asks for. The describe that fails on the deletion is the sibling `__tests__`
     * file's, which asserts the `order` handed to the model.
     *
     * This suite is not thereby redundant. SQL promises nothing about tied rows; the coincidence is
     * this engine's and this plan's. Section 8 declares **MariaDB** as the store, where a planner
     * that filesorts a small table answers in scan order instead -- ascending id, the opposite of
     * what section 6 requires. Then this is the suite that fails, and it is the only one written in
     * the terms a member of staff would recognise: two entries on one day, in the order they were
     * recorded.
     */
    describe('should answer two entries of one date with the more recently recorded first', () => {
      const cases = [
        {
          params: {
            staffMember: {
              id: 10300003,
              name: 'Same-month reader, tie at the top of the month',
            },
            recordedFirst: {
              spentOn: '2026-06-14',
              amount: 1414,
              expenseCategoryId: 10000001,
              memo: 'train fare, recorded the earlier of the pair',
            },
            recordedSecond: {
              spentOn: '2026-06-14',
              amount: 2828,
              expenseCategoryId: 10000002,
              memo: 'lunch that same day, recorded the later of the pair',
            },
            recordedThird: {
              spentOn: '2026-06-09',
              amount: 909,
              expenseCategoryId: 10000003,
              memo: null,
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            input: {
              year: 2026,
              month: 6,
            },
          },
          expected: {
            expenses: [
              {
                id: expect.any(Number),
                spentOn: '2026-06-14',
                amount: 2828,
                memo: 'lunch that same day, recorded the later of the pair',
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
              {
                id: expect.any(Number),
                spentOn: '2026-06-14',
                amount: 1414,
                memo: 'train fare, recorded the earlier of the pair',
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
                id: expect.any(Number),
                spentOn: '2026-06-09',
                amount: 909,
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
            totalAmount: 5151,
          },
        },
        {
          params: {
            staffMember: {
              id: 10300004,
              name: 'Same-month reader, tie beneath a newer entry',
            },
            recordedFirst: {
              spentOn: '2026-06-22',
              amount: 2222,
              expenseCategoryId: 10000004,
              memo: 'the newest entry of the month, recorded first of the three',
            },
            recordedSecond: {
              spentOn: '2026-06-07',
              amount: 707,
              expenseCategoryId: 10000002,
              memo: 'breakfast, recorded the earlier of the pair',
            },
            recordedThird: {
              spentOn: '2026-06-07',
              amount: 777,
              expenseCategoryId: 10000001,
              memo: null,
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            input: {
              year: 2026,
              month: 6,
            },
          },
          expected: {
            expenses: [
              {
                id: expect.any(Number),
                spentOn: '2026-06-22',
                amount: 2222,
                memo: 'the newest entry of the month, recorded first of the three',
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
                id: expect.any(Number),
                spentOn: '2026-06-07',
                amount: 777,
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
                id: expect.any(Number),
                spentOn: '2026-06-07',
                amount: 707,
                memo: 'breakfast, recorded the earlier of the pair',
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
            totalAmount: 3706,
          },
        },
      ]

      test.each(cases)('staffMember.id: $params.staffMember.id', async ({
        params,
        expected,
      }) => {
        await StaffMember.create(params.staffMember)
        const recordResolver = RecordExpenseMutationResolver.create()
        await recordResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.recordedFirst,
          },
          context: {
            staffMemberId: params.staffMember.id,
            now: params.presentedAt,
          },
        }))
        await recordResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.recordedSecond,
          },
          context: {
            staffMemberId: params.staffMember.id,
            now: params.presentedAt,
          },
        }))
        await recordResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.recordedThird,
          },
          context: {
            staffMemberId: params.staffMember.id,
            now: params.presentedAt,
          },
        }))
        const readResolver = MonthlyExpensesQueryResolver.create()
        const readArgs = {
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMember.id,
            now: params.presentedAt,
          },
        }

        const actual = await readResolver.resolve(/** @type {*} */ (readArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * **Section 12's fourth acceptance criterion, the `recorded` third of it**: an expense recorded
     * is reflected in the chosen month's entries and in its total on the next read.
     *
     * Each case records two entries into a month that held none, and the read that follows shows
     * both of them and totals them. **The operation stores no total and caches nothing** -- it
     * reads the rows and sums the array it is about to answer with -- so "the next read" is every
     * read, and there is no invalidation anybody has to remember.
     *
     * The second case records an entry whose date is EARLIER than the first's, so a read that
     * appended rather than ordered would answer them the wrong way round.
     */
    describe('should show an entry recorded since the month was empty', () => {
      const cases = [
        {
          params: {
            staffMember: {
              id: 10300005,
              name: 'Recording reader, two entries into an empty month',
            },
            recordedFirst: {
              spentOn: '2026-06-03',
              amount: 1030,
              expenseCategoryId: 10000001,
              memo: 'the first entry this month ever held',
            },
            recordedSecond: {
              spentOn: '2026-06-24',
              amount: 2040,
              expenseCategoryId: 10000004,
              memo: 'the second entry, dated later than the first',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            input: {
              year: 2026,
              month: 6,
            },
          },
          expected: {
            expenses: [
              {
                id: expect.any(Number),
                spentOn: '2026-06-24',
                amount: 2040,
                memo: 'the second entry, dated later than the first',
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
                id: expect.any(Number),
                spentOn: '2026-06-03',
                amount: 1030,
                memo: 'the first entry this month ever held',
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
            totalAmount: 3070,
          },
        },
        {
          params: {
            staffMember: {
              id: 10300006,
              name: 'Recording reader, the second entry dated earlier',
            },
            recordedFirst: {
              spentOn: '2026-08-26',
              amount: 3050,
              expenseCategoryId: 10000002,
              memo: 'recorded first, and dated the later of the two',
            },
            recordedSecond: {
              spentOn: '2026-08-04',
              amount: 4060,
              expenseCategoryId: 10000003,
              memo: 'recorded second, and dated the earlier of the two',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            input: {
              year: 2026,
              month: 8,
            },
          },
          expected: {
            expenses: [
              {
                id: expect.any(Number),
                spentOn: '2026-08-26',
                amount: 3050,
                memo: 'recorded first, and dated the later of the two',
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
              {
                id: expect.any(Number),
                spentOn: '2026-08-04',
                amount: 4060,
                memo: 'recorded second, and dated the earlier of the two',
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
            totalAmount: 7110,
          },
        },
      ]

      test.each(cases)('staffMember.id: $params.staffMember.id', async ({
        params,
        expected,
      }) => {
        await StaffMember.create(params.staffMember)
        const recordResolver = RecordExpenseMutationResolver.create()
        await recordResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.recordedFirst,
          },
          context: {
            staffMemberId: params.staffMember.id,
            now: params.presentedAt,
          },
        }))
        await recordResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.recordedSecond,
          },
          context: {
            staffMemberId: params.staffMember.id,
            now: params.presentedAt,
          },
        }))
        const readResolver = MonthlyExpensesQueryResolver.create()
        const readArgs = {
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMember.id,
            now: params.presentedAt,
          },
        }

        const actual = await readResolver.resolve(/** @type {*} */ (readArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * **Section 12's fourth acceptance criterion, the `corrected` third of it.**
     *
     * The first case corrects an entry's amount, its memo and its category in place, and the read
     * that follows must show the corrected values and a total built from them -- `5444`, not the
     * `3500` the two entries were recorded with.
     *
     * The second case corrects an entry's **date out of the chosen month**, which is the correction
     * a total taken by a second query would be most likely to get wrong: the entry leaves the list
     * and its amount leaves the total together, because the total is summed over the list.
     */
    describe('should show an entry corrected since it was recorded', () => {
      const cases = [
        {
          params: {
            staffMember: {
              id: 10300007,
              name: 'Correcting reader, the amount rewritten in place',
            },
            recordedKept: {
              spentOn: '2026-06-05',
              amount: 1000,
              expenseCategoryId: 10000001,
              memo: 'the entry this case leaves alone',
            },
            recordedCorrected: {
              spentOn: '2026-06-20',
              amount: 2500,
              expenseCategoryId: 10000002,
              memo: 'the entry this case rewrites, as it was recorded',
            },
            correction: {
              spentOn: '2026-06-20',
              amount: 4444,
              expenseCategoryId: 10000004,
              memo: 'the entry this case rewrites, as it was corrected',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            input: {
              year: 2026,
              month: 6,
            },
          },
          expected: {
            expenses: [
              {
                id: expect.any(Number),
                spentOn: '2026-06-20',
                amount: 4444,
                memo: 'the entry this case rewrites, as it was corrected',
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
                id: expect.any(Number),
                spentOn: '2026-06-05',
                amount: 1000,
                memo: 'the entry this case leaves alone',
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
            totalAmount: 5444,
          },
        },
        {
          params: {
            staffMember: {
              id: 10300008,
              name: 'Correcting reader, the date moved out of the month',
            },
            recordedKept: {
              spentOn: '2026-06-11',
              amount: 1111,
              expenseCategoryId: 10000003,
              memo: 'the entry that stays in the chosen month',
            },
            recordedCorrected: {
              spentOn: '2026-06-28',
              amount: 2500,
              expenseCategoryId: 10000002,
              memo: 'the entry that is corrected into the following month',
            },
            correction: {
              spentOn: '2026-07-28',
              amount: 2500,
              expenseCategoryId: 10000002,
              memo: 'the entry that is corrected into the following month',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            input: {
              year: 2026,
              month: 6,
            },
          },
          expected: {
            expenses: [
              {
                id: expect.any(Number),
                spentOn: '2026-06-11',
                amount: 1111,
                memo: 'the entry that stays in the chosen month',
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
            totalAmount: 1111,
          },
        },
      ]

      test.each(cases)('staffMember.id: $params.staffMember.id', async ({
        params,
        expected,
      }) => {
        await StaffMember.create(params.staffMember)
        const recordResolver = RecordExpenseMutationResolver.create()
        await recordResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.recordedKept,
          },
          context: {
            staffMemberId: params.staffMember.id,
            now: params.presentedAt,
          },
        }))
        const recorded = await recordResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.recordedCorrected,
          },
          context: {
            staffMemberId: params.staffMember.id,
            now: params.presentedAt,
          },
        }))
        const correctResolver = CorrectExpenseMutationResolver.create()
        await correctResolver.resolve(/** @type {*} */ ({
          variables: {
            input: {
              expenseId: recorded.expenseId,
              spentOn: params.correction.spentOn,
              amount: params.correction.amount,
              expenseCategoryId: params.correction.expenseCategoryId,
              memo: params.correction.memo,
            },
          },
          context: {
            staffMemberId: params.staffMember.id,
            now: params.presentedAt,
          },
        }))
        const readResolver = MonthlyExpensesQueryResolver.create()
        const readArgs = {
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMember.id,
            now: params.presentedAt,
          },
        }

        const actual = await readResolver.resolve(/** @type {*} */ (readArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * **Section 12's fourth acceptance criterion, the `removed` third of it.** An entry its owner
     * removed is gone from the month's entries and gone from its total, on the next read.
     *
     * Section 7's retention row is why a removal is a removal: an entry its owner removes is
     * deleted outright rather than archived, so nothing here has to reason about a row that still
     * exists and must be hidden.
     *
     * The first case removes the middle of three, the second the newest of three, so a removal that
     * took the wrong row leaves a different list and a different total in each.
     */
    describe('should show an entry removed since it was recorded', () => {
      const cases = [
        {
          params: {
            staffMember: {
              id: 10300009,
              name: 'Removing reader, the middle of three taken away',
            },
            recordedKept: {
              spentOn: '2026-06-25',
              amount: 5656,
              expenseCategoryId: 10000004,
              memo: 'the newest entry of the month',
            },
            recordedRemoved: {
              spentOn: '2026-06-20',
              amount: 3434,
              expenseCategoryId: 10000002,
              memo: 'the entry this case removes, dated between the two it keeps',
            },
            recordedAlsoKept: {
              spentOn: '2026-06-05',
              amount: 1212,
              expenseCategoryId: 10000001,
              memo: 'the oldest entry of the month',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            input: {
              year: 2026,
              month: 6,
            },
          },
          expected: {
            expenses: [
              {
                id: expect.any(Number),
                spentOn: '2026-06-25',
                amount: 5656,
                memo: 'the newest entry of the month',
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
                id: expect.any(Number),
                spentOn: '2026-06-05',
                amount: 1212,
                memo: 'the oldest entry of the month',
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
            totalAmount: 6868,
          },
        },
        {
          params: {
            staffMember: {
              id: 10300010,
              name: 'Removing reader, the newest of three taken away',
            },
            recordedKept: {
              spentOn: '2026-09-08',
              amount: 4040,
              expenseCategoryId: 10000002,
              memo: 'the middle entry of the month',
            },
            recordedRemoved: {
              spentOn: '2026-09-12',
              amount: 9090,
              expenseCategoryId: 10000003,
              memo: 'the entry this case removes, and the newest of the three',
            },
            recordedAlsoKept: {
              spentOn: '2026-09-02',
              amount: 2020,
              expenseCategoryId: 10000001,
              memo: 'the oldest entry of the month',
            },
            presentedAt: new Date('2026-09-15T01:00:00.000Z'),
            input: {
              year: 2026,
              month: 9,
            },
          },
          expected: {
            expenses: [
              {
                id: expect.any(Number),
                spentOn: '2026-09-08',
                amount: 4040,
                memo: 'the middle entry of the month',
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
              {
                id: expect.any(Number),
                spentOn: '2026-09-02',
                amount: 2020,
                memo: 'the oldest entry of the month',
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
            totalAmount: 6060,
          },
        },
      ]

      test.each(cases)('staffMember.id: $params.staffMember.id', async ({
        params,
        expected,
      }) => {
        await StaffMember.create(params.staffMember)
        const recordResolver = RecordExpenseMutationResolver.create()
        await recordResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.recordedKept,
          },
          context: {
            staffMemberId: params.staffMember.id,
            now: params.presentedAt,
          },
        }))
        const recorded = await recordResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.recordedRemoved,
          },
          context: {
            staffMemberId: params.staffMember.id,
            now: params.presentedAt,
          },
        }))
        await recordResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.recordedAlsoKept,
          },
          context: {
            staffMemberId: params.staffMember.id,
            now: params.presentedAt,
          },
        }))
        const removeResolver = RemoveExpenseMutationResolver.create()
        await removeResolver.resolve(/** @type {*} */ ({
          variables: {
            input: {
              expenseId: recorded.expenseId,
            },
          },
          context: {
            staffMemberId: params.staffMember.id,
            now: params.presentedAt,
          },
        }))
        const readResolver = MonthlyExpensesQueryResolver.create()
        const readArgs = {
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMember.id,
            now: params.presentedAt,
          },
        }

        const actual = await readResolver.resolve(/** @type {*} */ (readArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
