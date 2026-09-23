import RecordExpenseMutationResolver from '../../../server/graphql/resolvers/staff/actual/mutations/RecordExpenseMutationResolver.js'

import ExpensesQueryResolver from '../../../server/graphql/resolvers/staff/actual/queries/ExpensesQueryResolver.js'

import StaffMember from '../../../sequelize/models/StaffMember.js'

/*
 * **Section 6's `entry order`, the half of it the seeded fixtures cannot reach.**
 *
 * The clause reads: wherever a member of staff's entries are listed, newest `spent_on` first, and
 * where two share a date, the more recently recorded first. `EXPENSES_ORDER` in
 * `server/graphql/resolvers/staff/actual/queries/ExpensesQueryResolver.js` is the two keys that
 * answer it, and its own comment carries why the second one exists and what it reverses.
 *
 * -------------------------------------------------------------------------------------------
 * Why this suite writes, and therefore why it is here rather than beside its siblings
 * -------------------------------------------------------------------------------------------
 *
 * `#resolve()` writes nothing, so every other test of it lives in
 * `tests/__tests__/server/graphql/resolvers/staff/actual/queries/ExpensesQueryResolver.js` — and
 * that is where a reader looks first. **None of them can check the tie**, because the development
 * seeder gives no member of staff two rows on one date, deliberately and for a reason its own
 * docblock states. Reading a tie requires making one; making one means recording rows; recording
 * rows writes. Placement is by what the test's own path does, so the whole thing — the writes and
 * the read they exist for — belongs in `tests/_orders/`, in the `Expense/` folder its rows belong
 * to, and the `__tests__` file carries a line pointing here.
 *
 * Splitting it — the writes here, the assertion there — would put the assertion in a file that may
 * not assume the rows exist, in a phase that runs **before** this one against a database of its
 * own. It would assert nothing.
 *
 * -------------------------------------------------------------------------------------------
 * How the tie is made, and how it is kept out of everybody else's fixtures
 * -------------------------------------------------------------------------------------------
 *
 * **Through `recordExpense`, the product's own write path, with the ids left to the database.** No
 * row of `expenses` is given an explicit id here: `../README.md` and the development seeder both
 * spell out why one written into a product-written table manufactures its own collision. Nothing
 * below states an `expenses` id, and nothing below needs to — the rows are told apart by the
 * values they were recorded with.
 *
 * **Each case records for a member of staff of its own, created by this file.** `staff_members` is
 * the one table nothing but tests and seeders write, which is what makes an explicit id safe there;
 * `10209001` and `10209002` sit in block `102`, `#expense-entry`'s own, well clear of the
 * `1020000x` rows its seeder writes into a different table. No seeded member of staff is written
 * for at all, so:
 *
 *   - `10110001` and `10110002` keep exactly the entries the seeder gave them, which
 *     `ExpensesQueryResolver`'s `__tests__` suite pages through by value and
 *     `CorrectExpenseMutationResolver` and `RemoveExpenseMutationResolver` read back by id;
 *   - `10110003`, `10110007`, `10110009` and `10110010` stay empty, which that same `__tests__`
 *     suite asserts;
 *   - `10110004`, `10110005`, `10110006` and `10110008` keep exactly the rows
 *     `RecordExpenseMutationResolver` wrote for them, including the two whose page is asserted to
 *     hold one row.
 *
 * A member of staff of this suite's own also makes the assertion **absolute**: the page holds the
 * three rows the case recorded and nothing else, and `totalRecords` is 3 because 3 is the whole of
 * what that `where` can reach.
 *
 * -------------------------------------------------------------------------------------------
 * What the assertion pins, and what it would let through if it were written differently
 * -------------------------------------------------------------------------------------------
 *
 * Each case records **three** entries: two sharing one date, and one on a date of its own. The two
 * that share a date differ in every other field, so naming them in the expected array — by amount,
 * by memo, by category — states which of the two came back first without stating an id. **Their
 * order can be decided by nothing but the tie-break**, because the only other thing the ordering
 * can read off them is the date they share.
 *
 * The third entry is what keeps the date key honest, and the **order it is recorded in** is chosen
 * against the wrong answers rather than for readability:
 *
 *   - `10209001` records its older entry **last**, so that entry holds the highest id of the three.
 *     A resolver ordering by `id` alone puts it first, and this case fails.
 *   - `10209002` records its newer entry **first**, so that entry holds the lowest id. The same
 *     resolver puts it last, and this case fails.
 *
 * So neither case can pass by ordering on one key: the date decides between the distinct dates and
 * the tie-break decides within the date, and swapping either for the other is visible here.
 *
 * `id` is asserted as `expect.any(Number)` throughout — the database mints it and no test may state
 * it — and the timestamps by kind, for the same reason `__tests__` gives. Every other field is the
 * value the case presented.
 *
 * -------------------------------------------------------------------------------------------
 * What this suite proves, and the one thing it cannot prove on this engine
 * -------------------------------------------------------------------------------------------
 *
 * **It states the criterion, and on SQLite it does not fail when the tie-break is deleted.** That
 * was measured, not assumed: with `['id', 'DESC']` removed from `EXPENSES_ORDER` both cases below
 * still pass. Section 9.3's index is `(staff_member_id, spent_on)`, SQLite keys its entries by the
 * rowid beneath that, and `EXPLAIN QUERY PLAN` answers
 * `SEARCH expenses USING COVERING INDEX expenses_smi_so_index` — so `spent_on DESC` is served by
 * walking that index backwards, and tied rows arrive rowid descending, which is already the order
 * section 6 asks for. No arrangement of rows written through `recordExpense` can separate the two:
 * the id ascends with the recording, and the backwards walk hands them back in exactly that
 * reversed order.
 *
 * **So the describe that fails when the second key is deleted is in the sibling suite** —
 * `tests/__tests__/server/graphql/resolvers/staff/actual/queries/ExpensesQueryResolver.js`, which
 * asserts the `order` handed to the model and carries the measurement in full.
 *
 * This suite is not thereby redundant, and it is not an assertion of something already guaranteed.
 * SQL promises nothing about tied rows; the coincidence above is this engine's and this plan's.
 * Section 8 declares **MariaDB** as the store, where a planner that filesorts a small table answers
 * in scan order instead — ascending id, the opposite of what section 6 requires. Then this is the
 * suite that fails, and it is the only one written in the terms a member of staff would recognise:
 * two entries on one day, in the order they were recorded.
 *
 * The instant each case presents as `context.now` is `2026-09-15T01:00:00.000Z`, one of the two
 * `RecordExpenseMutationResolver`'s suite uses, so no date below is read against the day this suite
 * happens to run on. Every `spentOn` here is before it, so nothing here is near the future-dated
 * refusal.
 *
 * No `expense_categories` row is created: the four seeded ones are the only categories named.
 */

describe('ExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * Two entries recorded on one date come back with the more recently recorded of them first,
     * and the entry on a date of its own keeps its place by that date.
     */
    describe('should answer two entries of one date with the more recently recorded first', () => {
      const cases = [
        {
          params: {
            staffMember: {
              id: 10209001,
              name: 'Same-day reader, tie at the top',
            },
            recordedFirst: {
              spentOn: '2026-09-11',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare to the client in Kawasaki',
            },
            recordedSecond: {
              spentOn: '2026-09-11',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: 'lunch on that same working day',
            },
            recordedThird: {
              spentOn: '2026-09-08',
              amount: 3450,
              expenseCategoryId: 10000003,
              memo: 'paper for the review pack, bought the week before',
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
                spentOn: '2026-09-11',
                amount: 880,
                memo: 'lunch on that same working day',
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
                spentOn: '2026-09-11',
                amount: 1200,
                memo: 'train fare to the client in Kawasaki',
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
                spentOn: '2026-09-08',
                amount: 3450,
                memo: 'paper for the review pack, bought the week before',
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
              totalRecords: 3,
            },
          },
        },
        {
          params: {
            staffMember: {
              id: 10209002,
              name: 'Same-day reader, tie beneath a newer entry',
            },
            recordedFirst: {
              spentOn: '2026-09-14',
              amount: 720,
              expenseCategoryId: 10000004,
              memo: 'stamp for the claim form, sent the following Monday',
            },
            recordedSecond: {
              spentOn: '2026-09-13',
              amount: 2100,
              expenseCategoryId: 10000002,
              memo: 'dinner with the visiting auditor',
            },
            recordedThird: {
              spentOn: '2026-09-13',
              amount: 430,
              expenseCategoryId: 10000001,
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
                spentOn: '2026-09-14',
                amount: 720,
                memo: 'stamp for the claim form, sent the following Monday',
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
                spentOn: '2026-09-13',
                amount: 430,
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
                spentOn: '2026-09-13',
                amount: 2100,
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
              totalRecords: 3,
            },
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
        const readResolver = ExpensesQueryResolver.create()
        const readArgs = {
          variables: {
            input: {
              pagination: params.pagination,
            },
          },
          context: {
            staffMemberId: params.staffMember.id,
          },
        }

        const actual = await readResolver.resolve(/** @type {*} */ (readArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
