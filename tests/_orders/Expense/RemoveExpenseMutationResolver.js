import RemoveExpenseMutationResolver from '../../../server/graphql/resolvers/staff/actual/mutations/RemoveExpenseMutationResolver.js'

import ExpensesQueryResolver from '../../../server/graphql/resolvers/staff/actual/queries/ExpensesQueryResolver.js'

/*
 * The three methods of `removeExpense` that **write** — `#resolve()`, `#removeExpense()` and
 * `#destroyExpense()` — against the real tables. Everything else this resolver has is in
 * `tests/__tests__/server/graphql/resolvers/staff/actual/mutations/RemoveExpenseMutationResolver.js`,
 * because placement is per method and not per class.
 *
 * -------------------------------------------------------------------------------------------
 * No row of `expenses` is created here, and none is given an explicit id
 * -------------------------------------------------------------------------------------------
 *
 * A removal deletes a row that already exists, so like `correctExpense` and unlike `recordExpense`
 * this file needs no row of its own: **every entry it removes is one the development seeder wrote**
 * (`sequelize/seeders/development/20260914120004-000004-expenses.cjs`), and their ids are the ones
 * that seeder states. Nothing here inserts into `expenses` at all, so the collision its docblock
 * warns about — an explicit id written at or above the table's high-water mark — is not merely
 * avoided but unreachable.
 *
 * `expense_categories` is likewise never written, and this operation reads none: a removal names no
 * category.
 *
 * -------------------------------------------------------------------------------------------
 * The row allocation, checked against the two sibling files that also claim rows
 * -------------------------------------------------------------------------------------------
 *
 * The seeder gives `10110001` ten entries (`10200001`–`10200010`) and `10110002` four
 * (`10200011`–`10200014`). Two files here already claim rows, and the barrel
 * (`tests/_orders/Expense/_.test.js`) runs them **before** this one — `Expense.js`,
 * `RecordExpenseMutationResolver.js`, `CorrectExpenseMutationResolver.js`, then this file — so a
 * row either of them asserts is not this file's to delete:
 *
 *   - `RecordExpenseMutationResolver.js` writes only for `10110004`, `10110005`, `10110006` and
 *     `10110008`, and touches no row of `10110001` or `10110002` at all.
 *   - `CorrectExpenseMutationResolver.js` corrects `10200001`–`10200005`, `10200007` and
 *     `10200009` of `10110001`, and deliberately leaves `10200006`, `10200008` and `10200010`
 *     untouched so that it can read them back **unchanged**. It never corrects any of
 *     `10110002`'s four, and reads that member of staff's whole page back to prove a refused
 *     correction wrote nothing.
 *
 * **So this file removes exactly the seven rows of `10110001` that `correctExpense` corrected** —
 * `10200001`, `10200002`, `10200003`, `10200004`, `10200005`, `10200007` and `10200009`. Every one
 * of them has already served its purpose in the file before this one and is read back by nobody
 * afterwards. `10200006`, `10200008` and `10200010` are **never removed here**, because another
 * file asserts them unchanged; `10110002`'s four are never removed either, for the same reason —
 * they are instead the rows that exist and are not the caller's.
 *
 * Each of the seven is removed by exactly one case, and all seven are spent: two prove the entry is
 * gone from every later read, two prove the answer is the identifier alone, two exercise
 * `#removeExpense()` and the last exercises `#destroyExpense()`.
 *
 * `10110003`, `10110007`, `10110009` and `10110010` are asserted to have recorded nothing by
 * `tests/__tests__/server/graphql/resolvers/staff/actual/queries/ExpensesQueryResolver.js`, and
 * nothing here writes or removes for them.
 *
 * -------------------------------------------------------------------------------------------
 * What a page read back here asserts, and what it deliberately leaves to another suite
 * -------------------------------------------------------------------------------------------
 *
 * Every read-back of `10110001`'s page names its rows as `expect.objectContaining({ id })` in
 * `spentOn`-descending order rather than by value, and that is a decision rather than a shortcut.
 * **What this operation is answerable for is which rows are there and how many** — a removal
 * changes nothing else — and the field values those rows hold are `correctExpense`'s, asserted
 * whole in its own suite one file earlier. Restating them here would assert another operation's
 * work twice and break this file the first time that one presented a different amount.
 *
 * The ids are absolute, the count is absolute, and the order is the product's own
 * (`spentOn DESC`): the page is asserted as an exact ordered array, so a row that failed to be
 * deleted appears in it and a row deleted by mistake goes missing from it. `README.md` in this
 * directory explains why an absolute assertion against the freshly seeded state is the only
 * acceptable kind.
 *
 * **`10110002`'s page is asserted by value, in full**, because no file touches those four rows: the
 * seeder's own values are what must still be there, and every field of every row is checked.
 *
 * -------------------------------------------------------------------------------------------
 * How "the number of entries dropped by exactly one" is proved
 * -------------------------------------------------------------------------------------------
 *
 * By `pagination.totalRecords`, which is the count of the **whole set** and not of the page.
 * `10110001` holds ten entries when this file begins, so the first removal is read back as `9` and
 * the second as `8` — one fewer each time, stated absolutely rather than as a difference. A
 * removal that deleted two rows, or none, fails on that number alone; a removal that deleted the
 * wrong row fails on the list of ids beside it.
 *
 * Nothing is mocked. Every refusal here is reachable from the input alone, from an id belonging to
 * somebody else, from an id no row ever held, or from an id this very caller removed a moment ago,
 * so there is no branch that needs steering.
 *
 * -------------------------------------------------------------------------------------------
 * No clock, and no instant in any case below
 * -------------------------------------------------------------------------------------------
 *
 * `recordExpense` and `correctExpense` both hand the validator `context.now`, because both decide
 * "dated after today". A removal presents no date, so `context` here carries `staffMemberId` and
 * nothing else, and no case states an instant.
 */

describe('RemoveExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **"A removed entry is gone from every later read"** (spec section 11), and the count is read
     * back in the same breath.
     *
     * The removal is the Arrange and the owner's own page is the Act, read through the product's
     * own `expenses` query — never `Model.findAll()`, so what is asserted is what a screen would
     * actually see. What comes back carries:
     *
     *   - the remaining entries, by id, in `spentOn`-descending order, **with the removed one
     *     absent**; and
     *   - `totalRecords` one lower than before, absolutely: `9` after the first removal and `8`
     *     after the second, against the ten this member of staff held when the file began.
     *
     * The two together are what a soft delete fails. `Expense` declares no `deletedAt` and is not
     * paranoid, so there is no flagged row to be filtered out of a later read by some read that
     * remembered to and left in by one that did not: the row is gone from the table, and every
     * later read is answered by its absence rather than by a condition.
     *
     * Case 2 reads the page after two removals, so it also shows the first one stayed gone.
     */
    describe('should leave the entry gone from every later read and the count one lower', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200001,
            },
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: [
              expect.objectContaining({
                id: 10200005,
              }),
              expect.objectContaining({
                id: 10200008,
              }),
              expect.objectContaining({
                id: 10200010,
              }),
              expect.objectContaining({
                id: 10200006,
              }),
              expect.objectContaining({
                id: 10200004,
              }),
              expect.objectContaining({
                id: 10200009,
              }),
              expect.objectContaining({
                id: 10200007,
              }),
              expect.objectContaining({
                id: 10200002,
              }),
              expect.objectContaining({
                id: 10200003,
              }),
              // 10200001 is absent: it is the entry this case removed
            ],
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 9, // ten, less the one removed
            },
          },
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200002,
            },
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: [
              expect.objectContaining({
                id: 10200005,
              }),
              expect.objectContaining({
                id: 10200008,
              }),
              expect.objectContaining({
                id: 10200010,
              }),
              expect.objectContaining({
                id: 10200006,
              }),
              expect.objectContaining({
                id: 10200004,
              }),
              expect.objectContaining({
                id: 10200009,
              }),
              expect.objectContaining({
                id: 10200007,
              }),
              expect.objectContaining({
                id: 10200003,
              }),
              // 10200002 is absent: it is the entry this case removed
              // 10200001 is absent still: the case above removed it and it has not come back
            ],
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 8, // one lower again
            },
          },
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', async ({
        params,
        expected,
      }) => {
        const removeResolver = RemoveExpenseMutationResolver.create()
        await removeResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
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

describe('RemoveExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The operation end to end: one row deleted, and **only the identifier of it answered**.
     *
     * The assertion is a whole-object `toEqual` over a one-field object, which is what makes it the
     * CQRS criterion rather than a shape check — a resolver that helpfully answered with the row it
     * had just deleted, or with a count, or with what is left, fails here.
     *
     * **The identifier is asserted by value**, as `correctExpense`'s is and unlike
     * `recordExpense`'s: the id of a removal is the caller's to name, not the database's to mint.
     * It is nonetheless read off the row rather than echoed from the input — the row is gone by the
     * time it is read, and the in-memory instance is what still carries it.
     */
    describe('should answer with the identifier of the entry removed and nothing else', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200003,
            },
          },
          expected: {
            expenseId: 10200003,
          },
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200004,
            },
          },
          expected: {
            expenseId: 10200004,
          },
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', async ({
        params,
        expected,
      }) => {
        const resolver = RemoveExpenseMutationResolver.create()
        const resolveArgs = {
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
          },
        }

        const actual = await resolver.resolve(/** @type {*} */ (resolveArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RemoveExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **This describe is the operation's whole point, and it asserts three situations against one
     * literal rather than two situations pairwise.**
     *
     * Spec section 11 asks for two things that meet here:
     *
     *   - *"removing it a second time is answered as not found — the same answer somebody else's
     *     expense gets, so a removed entry and another member of staff's are indistinguishable"*;
     *   - *"reading, correcting or removing an expense belonging to somebody else is answered as
     *     not found, and the answer says nothing about whether it exists"*.
     *
     * Section 7 deletes a removed entry outright rather than archiving it, so after a removal the
     * row does not exist — which is the same state as an id nobody ever held, which must read the
     * same as an id somebody else holds. **Three situations, one answer, no way to tell them
     * apart**, and the six cases below are two of each kind with the same `expected` written
     * against every one:
     *
     *   - `10200001` and `10200003` were removed by **this very caller**, two describes above;
     *   - `10200011` and `10200013` are seeded rows of `10110002`. They genuinely exist, and they
     *     genuinely are not the caller's;
     *   - `10200091` and `10200092` are ids no row of the table has ever held.
     *
     * All six come back `204.M006.002`, from the one line of `#removeExpense()` that turns a `null`
     * read into a refusal. There is no second code to come back instead, because
     * `RemoveExpenseMutationResolver.errorCodeHash` declares none — and that absence is pinned by
     * one whole-hash `toEqual` in this resolver's `__tests__` file, so an `ExpenseAlreadyRemoved`
     * added later turns that test red rather than quietly telling a caller that an id they cannot
     * read once belonged to a row.
     *
     * A test that only asserted "it throws", or that compared two of the three kinds to each other,
     * would pass while the third differed. Asserting the identical literal across all three is what
     * makes them indistinguishable to a caller, and it is the only thing a caller can see: the
     * error carries the code as its whole message and nothing else — no id, no owner, no count, and
     * nothing about whether anything was ever there.
     */
    describe('should answer the identical not-found code for an entry already removed, for another member of staff entry and for an id no row ever held', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200001, // this caller removed it two describes above
            },
          },
          expected: '204.M006.002',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200003, // and this one, one describe above
            },
          },
          expected: '204.M006.002',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200011, // exists, and belongs to 10110002
            },
          },
          expected: '204.M006.002',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200013, // exists, and belongs to 10110002
            },
          },
          expected: '204.M006.002',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200091, // no row of the table has ever held it
            },
          },
          expected: '204.M006.002',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200092, // nor this one
            },
          },
          expected: '204.M006.002',
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', async ({
        params,
        expected,
      }) => {
        const resolver = RemoveExpenseMutationResolver.create()
        const resolveArgs = {
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
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

describe('RemoveExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The other half of that criterion: **an attempt against somebody else's entry removes
     * nothing.** A refusal that had already deleted would satisfy the describe above and lose
     * somebody's record for good — there is no archived copy to restore, because the delete is
     * outright.
     *
     * The refused removal is the Arrange, and the Act is a read of the **owner's** own page —
     * `10110002`'s, through the product's own `expenses` query. What is asserted is that whole page
     * by value: all four seeded rows, every field of every one of them, and `totalRecords: 4`. No
     * case of this file removes a row of `10110002`, and no earlier file corrects one, so the page
     * is still the seeder's own and any difference at all is the refusal having written.
     */
    describe('should remove nothing when the entry belongs to somebody else', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200012, // belongs to 10110002
            },
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
            },
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
        const removeResolver = RemoveExpenseMutationResolver.create()
        const refusedRemoval = () => removeResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
          },
        }))
        await expect(refusedRemoval)
          .rejects
          .toThrow('204.M006.002')
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

describe('RemoveExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **A second removal of the same entry takes nothing else with it.** The refusal is the Arrange
     * and the caller's own page is the Act.
     *
     * The describe two above showed the second attempt is refused with the same code somebody
     * else's entry earns. This one shows that the refusal is inert: four rows of this member of
     * staff have been removed by the describes above and the page holds the remaining six, both
     * before the second attempt and after it.
     *
     * A resolver that deleted by id without narrowing by owner, or that treated an unfound row as
     * "delete whatever is nearest", would be caught here rather than by an error code.
     */
    describe('should remove nothing more when the entry was already removed', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200001, // removed by the first describe of this file
            },
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: [
              expect.objectContaining({
                id: 10200005,
              }),
              expect.objectContaining({
                id: 10200008,
              }),
              expect.objectContaining({
                id: 10200010,
              }),
              expect.objectContaining({
                id: 10200006,
              }),
              expect.objectContaining({
                id: 10200009,
              }),
              expect.objectContaining({
                id: 10200007,
              }),
            ],
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 6, // ten, less the four this file has removed so far
            },
          },
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200004, // removed by the second describe of this file
            },
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: [
              expect.objectContaining({
                id: 10200005,
              }),
              expect.objectContaining({
                id: 10200008,
              }),
              expect.objectContaining({
                id: 10200010,
              }),
              expect.objectContaining({
                id: 10200006,
              }),
              expect.objectContaining({
                id: 10200009,
              }),
              expect.objectContaining({
                id: 10200007,
              }),
            ],
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 6,
            },
          },
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', async ({
        params,
        expected,
      }) => {
        const removeResolver = RemoveExpenseMutationResolver.create()
        const refusedRemoval = () => removeResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
          },
        }))
        await expect(refusedRemoval)
          .rejects
          .toThrow('204.M006.002')
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

describe('RemoveExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The input refusals, which are the validator's two rules reached through the operation:
     * `203.M006.001` for a removal naming no entry at all, and `203.M006.002` for one whose named
     * entry is a value no identifier could take.
     *
     * Both spellings of "no entry" are presented — the field sent as null, and the field not sent
     * at all. GraphQL types `expenseId` as `Int!` and would refuse both before a resolver ran, so
     * these are the resolver being asked directly, which is how a caller reaching it any other way
     * would arrive.
     *
     * **Neither code says anything about any row**, which is why they are safe to tell apart: they
     * describe what the caller sent, not what the table holds.
     */
    describe('should refuse a removal naming no entry or an entry no identifier could name', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: null,
            },
          },
          expected: '203.M006.001',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              // expenseId: undefined -- no entry named at all
            },
          },
          expected: '203.M006.001',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 0,
            },
          },
          expected: '203.M006.002',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: -10200005,
            },
          },
          expected: '203.M006.002',
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', async ({
        params,
        expected,
      }) => {
        const resolver = RemoveExpenseMutationResolver.create()
        const resolveArgs = {
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
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

describe('RemoveExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The other half of those two refusals: **an input the operation refuses removes nothing.** The
     * refusal is raised before a transaction is even opened, so there is nothing to roll back, and
     * the caller's page is exactly what it was.
     */
    describe('should remove nothing when the input is refused', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: null,
            },
            refusalCode: '203.M006.001',
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: [
              expect.objectContaining({
                id: 10200005,
              }),
              expect.objectContaining({
                id: 10200008,
              }),
              expect.objectContaining({
                id: 10200010,
              }),
              expect.objectContaining({
                id: 10200006,
              }),
              expect.objectContaining({
                id: 10200009,
              }),
              expect.objectContaining({
                id: 10200007,
              }),
            ],
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 6,
            },
          },
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 0,
            },
            refusalCode: '203.M006.002',
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          expected: {
            expenses: [
              expect.objectContaining({
                id: 10200005,
              }),
              expect.objectContaining({
                id: 10200008,
              }),
              expect.objectContaining({
                id: 10200010,
              }),
              expect.objectContaining({
                id: 10200006,
              }),
              expect.objectContaining({
                id: 10200009,
              }),
              expect.objectContaining({
                id: 10200007,
              }),
            ],
            pagination: {
              limit: 10,
              offset: 0,
              sort: null,
              totalRecords: 6,
            },
          },
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', async ({
        params,
        expected,
      }) => {
        const removeResolver = RemoveExpenseMutationResolver.create()
        const refusedRemoval = () => removeResolver.resolve(/** @type {*} */ ({
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
          },
        }))
        await expect(refusedRemoval)
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

describe('RemoveExpenseMutationResolver', () => {
  describe('#removeExpense()', () => {
    /*
     * The write on its own, outside `#resolve()`: it opens the transaction, refuses an entry the
     * caller does not hold and answers the row it deleted.
     *
     * It reads no input rule, so the removals below are not validated on the way past — that is
     * `#validateInput()`'s work and `#resolve()`'s order of business, both asserted elsewhere.
     * What is asserted here is the row that comes back: the id it had, the owner it had, and the
     * `status` it had. Its other fields are `correctExpense`'s and are not restated.
     *
     * The rows named are `10200005` and `10200007`, the last two of this file's allocation that no
     * page read-back above or below names.
     */
    describe('should delete the entry and answer with the row', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200005,
            },
          },
          expected: expect.objectContaining({
            id: 10200005,
            StaffMemberId: 10110001,
            status: 'recorded',
          }),
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200007,
            },
          },
          expected: expect.objectContaining({
            id: 10200007,
            StaffMemberId: 10110001,
            status: 'recorded',
          }),
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', async ({
        params,
        expected,
      }) => {
        const resolver = RemoveExpenseMutationResolver.create()

        const actual = await resolver.removeExpense(/** @type {*} */ (params))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RemoveExpenseMutationResolver', () => {
  describe('#removeExpense()', () => {
    /*
     * The not-found refusal this method owns, raised inside the transaction it opened so the delete
     * beside it never runs — and raised from one read that narrowed by owner and identifier
     * together, so all three situations arrive as the same `null` and leave as the same
     * `204.M006.002`.
     *
     * The six cases are two of each kind and declare the same expected code, exactly as the
     * `#resolve()` describe above does, because the property belongs to this method and is merely
     * visible through that one. The first two were deleted by the describe directly above, which is
     * what makes them the "already removed" kind here.
     */
    describe('should answer the identical not-found code whether the entry was removed, is another member of staff or is nobody', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200005, // deleted by the describe above
            },
          },
          expected: '204.M006.002',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200007, // and this one
            },
          },
          expected: '204.M006.002',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200011, // exists, and belongs to 10110002
            },
          },
          expected: '204.M006.002',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200012, // exists, and belongs to 10110002
            },
          },
          expected: '204.M006.002',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200093, // no row of the table has ever held it
            },
          },
          expected: '204.M006.002',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              expenseId: 10200094, // nor this one
            },
          },
          expected: '204.M006.002',
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', async ({
        params,
        expected,
      }) => {
        const resolver = RemoveExpenseMutationResolver.create()

        const actual = () => resolver.removeExpense(/** @type {*} */ (params))

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('RemoveExpenseMutationResolver', () => {
  describe('#destroyExpense()', () => {
    /*
     * The delete itself, handed the row it is to remove — which is how `#removeExpense()` calls it,
     * having just read that row inside the transaction.
     *
     * **What this method is really asserted on is what it answers.** `Sequelize`'s
     * `instance.destroy()` resolves with nothing, so a method that returned its result would hand
     * `#formatResponse()` an undefined row and the operation would answer with no identifier at
     * all. This method answers the instance instead — the row is gone from the table and the
     * in-memory instance is the only thing left carrying the id the caller is owed — and the
     * assertion below is on that id.
     *
     * The entry is fetched through the resolver's own `#findExpense()` rather than through the
     * model, so the test exercises no read path the product does not have. No transaction is opened
     * around either step: this method is being exercised on its own, outside the one
     * `#removeExpense()` opens.
     *
     * **One case, because the allocation is spent.** This file removes the seven rows of `10110001`
     * that no other file asserts, six of them above, and `10200009` is the seventh and last.
     * Removing one of the three rows `correctExpense`'s suite reads back unchanged to gain a second
     * case would break that file rather than strengthen this one.
     */
    describe('should delete the entry and answer the row that carried the identifier', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            expenseId: 10200009,
          },
          expected: expect.objectContaining({
            id: 10200009,
            StaffMemberId: 10110001,
            status: 'recorded',
          }),
        },
      ]

      test.each(cases)('expenseId: $params.expenseId', async ({
        params,
        expected,
      }) => {
        const resolver = RemoveExpenseMutationResolver.create()
        const expenseEntity = await resolver.findExpense(/** @type {*} */ ({
          expenseId: params.expenseId,
          staffMemberId: params.staffMemberId,
          transaction: null,
        }))

        const actual = await resolver.destroyExpense(/** @type {*} */ ({
          expenseEntity,
          transaction: null,
        }))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
