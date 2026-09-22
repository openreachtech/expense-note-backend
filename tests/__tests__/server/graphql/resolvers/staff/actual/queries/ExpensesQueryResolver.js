import {
  BaseQueryResolver,
} from '@openreachtech/renchan'

import {
  RequestPagination,
} from '@openreachtech/renchan-sequelize'

import ExpensesQueryResolver from '../../../../../../../../server/graphql/resolvers/staff/actual/queries/ExpensesQueryResolver.js'

import ExpensesInputValidator from '../../../../../../../../app/tools/validator/resolvers/staff/queries/ExpensesInputValidator.js'

import Expense from '../../../../../../../../sequelize/models/Expense.js'
import ExpenseCategory from '../../../../../../../../sequelize/models/ExpenseCategory.js'

/*
 * Every row this file reads comes from
 * `sequelize/seeders/development/20260914120004-000004-expenses.cjs` and the expense-category
 * master beside it. Nothing here writes a row and nothing here spells an explicit `expenses` id
 * into the table: that seeder is the sole writer of one, and its docblock explains why a test
 * adding a second would manufacture a collision.
 *
 * `createdAt` and `updatedAt` are asserted as `expect.any(Date)` throughout. The seeder stamps
 * them at `db:refresh` time, so their values are the moment the database was last refreshed —
 * real, but not a constant a test may pin. Their being `Date`s rather than strings is what
 * matters here, because that is what the `DateTime` scalar serializes on the way out.
 *
 * The newest-first order of the ten rows of staff member 10110001 is
 *   10200008, 10200004, 10200002, 10200010, 10200006, 10200005, 10200009, 10200001, 10200007,
 *   10200003
 * which matches neither ascending nor descending id and differs at the first row under each. A
 * resolver ordering by `id` or by `createdAt` — every row shares one — therefore fails here
 * rather than passing by luck.
 */

describe('ExpensesQueryResolver', () => {
  describe('super class', () => {
    test('to be instance of BaseQueryResolver', () => {
      const actual = ExpensesQueryResolver.prototype

      expect(actual)
        .toBeInstanceOf(BaseQueryResolver)
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('.get:schema', () => {
    test('to be fixed value', () => {
      const expected = 'expenses'

      const actual = ExpensesQueryResolver.schema

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('.get:errorCodeHash', () => {
    /*
     * `Q002` is this operation's stable id, fixed in `server/graphql/resolver-id-hash-staff.js`.
     * The literals are pinned here because a renumbered code is a silently changed contract: the
     * frontend reads the code, not the message. The two `203` names are the ones
     * `ExpensesInputValidator` reads off `this.errorHash`, so a rename here would refuse nothing
     * and throw on an undefined constructor instead.
     *
     * `ExcessiveLimit` is Q50's cap. It is pinned here like the rest, and the rule it belongs to
     * is the THIRD entry rather than the second -- see the validator's own test for why the order
     * is part of the contract.
     */
    test('to be fixed value', () => {
      const expected = {
        InvalidLimit: '203.Q002.001',
        InvalidOffset: '203.Q002.002',
        ExcessiveLimit: '203.Q002.003',
        StaffMemberNotFound: '204.Q002.001',
      }

      const actual = ExpensesQueryResolver.errorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('.get:ExpensesInputValidatorCtor', () => {
    test('to be the validator holding this operation input rules', () => {
      const expected = ExpensesInputValidator

      const actual = ExpensesQueryResolver.ExpensesInputValidatorCtor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('.get:RequestPaginationCtor', () => {
    test('to be the framework request pagination', () => {
      const expected = RequestPagination

      const actual = ExpensesQueryResolver.RequestPaginationCtor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('#get:ExpenseModel', () => {
    /*
     * The seam answers the same model whatever the instance holds, so what varies case to case is
     * the instance: each is created with a different stand-in error code, and so holds a different
     * `errorHash`.
     */
    describe('should answer the Expense model', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.Q002.901',
            },
          },
          expected: Expense,
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.Q002.902',
            },
          },
          expected: Expense,
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', ({
        factoryParams,
        expected,
      }) => {
        const resolver = ExpensesQueryResolver.create(factoryParams)

        const actual = resolver.ExpenseModel

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('#get:ExpenseCategoryModel', () => {
    describe('should answer the ExpenseCategory model', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.Q002.903',
            },
          },
          expected: ExpenseCategory,
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.Q002.904',
            },
          },
          expected: ExpenseCategory,
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', ({
        factoryParams,
        expected,
      }) => {
        const resolver = ExpensesQueryResolver.create(factoryParams)

        const actual = resolver.ExpenseCategoryModel

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('#createInputValidator()', () => {
    describe('should hand this resolver own error hash to the validator', () => {
      const cases = [
        {
          params: {
            input: {
              pagination: {
                limit: 10,
                offset: 0,
              },
            },
          },
        },
        {
          params: {
            input: {
              pagination: {
                limit: 5,
                offset: 20,
              },
            },
          },
        },
      ]

      test.each(cases)('input.pagination.offset: $params.input.pagination.offset', ({
        params,
      }) => {
        const resolver = ExpensesQueryResolver.create()

        const actual = resolver.createInputValidator(/** @type {*} */ (params))

        expect(actual)
          .toBeInstanceOf(ExpensesInputValidator)
      })
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('#validateInput()', () => {
    /*
     * The validator returns the error rather than throwing it, so what comes back here is an
     * already-created error whose message is the code a caller sees.
     */
    describe('should refuse a page nobody could be served', () => {
      const cases = [
        {
          params: {
            input: {
              pagination: {
                limit: 0,
                offset: 0,
              },
            },
          },
          expected: '203.Q002.001',
        },
        {
          params: {
            input: {
              pagination: {
                limit: 10,
                offset: -5,
              },
            },
          },
          expected: '203.Q002.002',
        },
      ]

      test.each(cases)('input.pagination.limit: $params.input.pagination.limit', ({
        params,
        expected,
      }) => {
        const resolver = ExpensesQueryResolver.create()

        const actual = resolver.validateInput(/** @type {*} */ (params))

        expect(actual)
          .toHaveProperty('message', expected)
      })
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('#validateInput()', () => {
    /*
     * A presented sort is not a reason to refuse: the contract declares the field, this operation
     * never reads it, and no rule exists for it.
     */
    describe('when the presented page satisfies every rule', () => {
      const cases = [
        {
          params: {
            input: {
              pagination: {
                limit: 10,
                offset: 0,
              },
            },
          },
        },
        {
          params: {
            input: {
              pagination: {
                limit: 3,
                offset: 9,
                sort: {
                  key: 'amount',
                  direction: 'ASC',
                },
              },
            },
          },
        },
      ]

      test.each(cases)('input.pagination.offset: $params.input.pagination.offset', ({
        params,
      }) => {
        const resolver = ExpensesQueryResolver.create()

        const actual = resolver.validateInput(/** @type {*} */ (params))

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('#createRequestPagination()', () => {
    /*
     * The limit and the offset reach it, and **nothing else does**. `orderOption` being empty is
     * the mechanism by which a caller's sort cannot reach the query: it is what the mixin scope's
     * `createFindOptions()` contributes as `order`, so an empty one leaves the resolver's own
     * `spentOn DESC` as the only ordering there is.
     */
    describe('should carry the presented limit and offset, and contribute no ordering', () => {
      const cases = [
        {
          params: {
            limit: 5,
            offset: 10,
          },
          expected: expect.objectContaining({
            params: {
              limit: 5,
              offset: 10,
              sort: expect.objectContaining({
                orderOption: [],
              }),
            },
          }),
        },
        {
          params: {
            limit: 20,
            offset: 0,
          },
          expected: expect.objectContaining({
            params: {
              limit: 20,
              offset: 0,
              sort: expect.objectContaining({
                orderOption: [],
              }),
            },
          }),
        },
      ]

      test.each(cases)('limit: $params.limit', ({
        params,
        expected,
      }) => {
        const resolver = ExpensesQueryResolver.create()

        const actual = resolver.createRequestPagination(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('#createRequestPagination()', () => {
    describe('should be a request pagination of the framework', () => {
      const cases = [
        {
          params: {
            limit: 4,
            offset: 4,
          },
        },
        {
          params: {
            limit: 7,
            offset: 14,
          },
        },
      ]

      test.each(cases)('limit: $params.limit', ({
        params,
      }) => {
        const resolver = ExpensesQueryResolver.create()

        const actual = resolver.createRequestPagination(params)

        expect(actual)
          .toBeInstanceOf(RequestPagination)
      })
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('#findExpensesPage()', () => {
    /*
     * Against the seeded database, with the ids written out rather than counted, so the ordering
     * is asserted by which rows arrive and in which order — not merely by how many.
     *
     * The first case is the top of the first page and pins the order. The second is the last page
     * of the same owner, where the page holds one row and the total still reports ten. The third
     * is the other owner, whose four rows are the whole of what that `where` can reach.
     */
    describe('should page the owner own entries, newest spentOn first', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            limit: 3,
            offset: 0,
          },
          label: 'the first page of the owner who has ten',
          expected: {
            pagination: expect.objectContaining({
              limit: 3,
              offset: 0,
              totalNumber: 10,
            }),
            records: [
              expect.objectContaining({
                id: 10200008,
                spentOn: '2026-09-09',
              }),
              expect.objectContaining({
                id: 10200004,
                spentOn: '2026-09-02',
              }),
              expect.objectContaining({
                id: 10200002,
                spentOn: '2026-08-21',
              }),
            ],
          },
        },
        {
          params: {
            staffMemberId: 10110001,
            limit: 3,
            offset: 9,
          },
          label: 'the last page of the owner who has ten',
          expected: {
            pagination: expect.objectContaining({
              limit: 3,
              offset: 9,
              totalNumber: 10,
            }),
            records: [
              expect.objectContaining({
                id: 10200003,
                spentOn: '2026-06-01',
              }),
            ],
          },
        },
        {
          params: {
            staffMemberId: 10110002,
            limit: 10,
            offset: 0,
          },
          label: 'the whole set of the owner who has four',
          expected: {
            pagination: expect.objectContaining({
              limit: 10,
              offset: 0,
              totalNumber: 4,
            }),
            records: [
              expect.objectContaining({
                id: 10200013,
                spentOn: '2026-09-05',
              }),
              expect.objectContaining({
                id: 10200011,
                spentOn: '2026-08-27',
              }),
              expect.objectContaining({
                id: 10200012,
                spentOn: '2026-07-09',
              }),
              expect.objectContaining({
                id: 10200014,
                spentOn: '2026-06-18',
              }),
            ],
          },
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
        expected,
      }) => {
        const resolver = ExpensesQueryResolver.create()

        const actual = await resolver.findExpensesPage(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('#findExpensesPage()', () => {
    /*
     * The eager-loaded category, asserted on the association as it arrives on the row rather than
     * on the formatted output — this is the read that keeps one page one pair of queries instead
     * of one query per row.
     */
    describe('should eager-load the category of each entry', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            limit: 2,
            offset: 0,
          },
          expected: [
            expect.objectContaining({
              id: 10200008,
              ExpenseCategory: expect.objectContaining({
                id: 10000004,
                name: 'other',
                displayOrder: 4,
              }),
            }),
            expect.objectContaining({
              id: 10200004,
              ExpenseCategory: expect.objectContaining({
                id: 10000004,
                name: 'other',
                displayOrder: 4,
              }),
            }),
          ],
        },
        {
          params: {
            staffMemberId: 10110002,
            limit: 2,
            offset: 0,
          },
          expected: [
            expect.objectContaining({
              id: 10200013,
              ExpenseCategory: expect.objectContaining({
                id: 10000001,
                name: 'transport',
                displayOrder: 1,
              }),
            }),
            expect.objectContaining({
              id: 10200011,
              ExpenseCategory: expect.objectContaining({
                id: 10000003,
                name: 'supplies',
                displayOrder: 3,
              }),
            }),
          ],
        },
      ]

      test.each(cases)('staffMemberId: $params.staffMemberId', async ({
        params,
        expected,
      }) => {
        const resolver = ExpensesQueryResolver.create()

        const expensesPage = await resolver.findExpensesPage(params)

        expect(expensesPage.records)
          .toEqual(expected)
      })
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('#findExpensesPage()', () => {
    /*
     * Three of the eight seeded members of staff who have recorded nothing. An empty page is a
     * successful read, not a refusal.
     */
    describe('when the member of staff has recorded nothing', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110003,
            limit: 10,
            offset: 0,
          },
        },
        {
          params: {
            staffMemberId: 10110007,
            limit: 10,
            offset: 0,
          },
        },
        {
          params: {
            staffMemberId: 10110010,
            limit: 10,
            offset: 0,
          },
        },
      ]

      test.each(cases)('staffMemberId: $params.staffMemberId', async ({
        params,
      }) => {
        const resolver = ExpensesQueryResolver.create()

        const expensesPage = await resolver.findExpensesPage(params)

        expect(expensesPage.records)
          .toHaveLength(0)
      })
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('#formatExpenseCategory()', () => {
    describe('should answer the three fields the contract declares', () => {
      const cases = [
        {
          params: {
            expenseCategoryAttributes: {
              id: 10000001,
              name: 'transport',
              displayOrder: 1,
            },
          },
          expected: {
            id: 10000001,
            name: 'transport',
            displayOrder: 1,
          },
        },
        {
          params: {
            expenseCategoryAttributes: {
              id: 10000004,
              name: 'other',
              displayOrder: 4,
            },
          },
          expected: {
            id: 10000004,
            name: 'other',
            displayOrder: 4,
          },
        },
      ]

      test.each(cases)('expenseCategoryAttributes.id: $params.expenseCategoryAttributes.id', ({
        params,
        expected,
      }) => {
        const resolver = ExpensesQueryResolver.create()

        const formatArgs = {
          expenseCategoryEntity: ExpenseCategory.build(params.expenseCategoryAttributes),
        }

        const actual = resolver.formatExpenseCategory(/** @type {*} */ (formatArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('#formatExpense()', () => {
    /*
     * The entities are built rather than fetched: this method reads properties and touches no
     * table, so the timestamps can be pinned here where the seeded ones cannot.
     *
     * The second case carries a **null memo**, which is section 11's criterion that the memo is
     * genuinely optional: it must read back empty rather than fail. The foreign keys are dropped
     * on the way out — the contract exposes the category as a nested object, never as an id.
     */
    describe('should answer the row in the shape the contract declares', () => {
      const cases = [
        {
          params: {
            expenseAttributes: {
              id: 10200001,
              StaffMemberId: 10110001,
              ExpenseCategoryId: 10000001,
              spentOn: '2026-07-03',
              amount: 1200,
              memo: 'train fare to the client in Shinagawa',
              status: 'recorded',
              createdAt: new Date('2026-07-04T01:02:03.000Z'),
              updatedAt: new Date('2026-07-04T01:02:03.000Z'),
              ExpenseCategory: {
                id: 10000001,
                name: 'transport',
                displayOrder: 1,
              },
            },
          },
          expected: {
            id: 10200001,
            spentOn: '2026-07-03',
            amount: 1200,
            memo: 'train fare to the client in Shinagawa',
            status: 'recorded',
            expenseCategory: {
              id: 10000001,
              name: 'transport',
              displayOrder: 1,
            },
            createdAt: new Date('2026-07-04T01:02:03.000Z'),
            updatedAt: new Date('2026-07-04T01:02:03.000Z'),
          },
        },
        {
          params: {
            expenseAttributes: {
              id: 10200006,
              StaffMemberId: 10110001,
              ExpenseCategoryId: 10000002,
              spentOn: '2026-08-05',
              amount: 5730,
              memo: null,
              status: 'recorded',
              createdAt: new Date('2026-08-06T04:05:06.000Z'),
              updatedAt: new Date('2026-08-07T07:08:09.000Z'),
              ExpenseCategory: {
                id: 10000002,
                name: 'meals',
                displayOrder: 2,
              },
            },
          },
          expected: {
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
            createdAt: new Date('2026-08-06T04:05:06.000Z'),
            updatedAt: new Date('2026-08-07T07:08:09.000Z'),
          },
        },
      ]

      test.each(cases)('expenseAttributes.id: $params.expenseAttributes.id', ({
        params,
        expected,
      }) => {
        const resolver = ExpensesQueryResolver.create()

        const formatArgs = {
          expenseEntity: Expense.build(
            params.expenseAttributes,
            {
              include: [
                ExpenseCategory,
              ],
            }
          ),
        }

        const actual = resolver.formatExpense(/** @type {*} */ (formatArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('#formatPagination()', () => {
    /*
     * **This is where `totalNumber` becomes `totalRecords`.** The mixin's value object names it
     * one way and the contract the other, so a stand-in carrying both a `totalNumber` and a wrong
     * `totalRecords` would be caught here rather than reported as a plausible number.
     *
     * The presented sort is handed straight back — reading a field, not applying it — and the
     * absence of one comes back as null, which the contract permits.
     */
    describe('should rename the mixin total into the contract field', () => {
      const cases = [
        {
          params: {
            responsePagination: {
              limit: 10,
              offset: 0,
              totalNumber: 10,
              totalRecords: 999,
            },
            sort: null,
          },
          expected: {
            limit: 10,
            offset: 0,
            sort: null,
            totalRecords: 10,
          },
        },
        {
          params: {
            responsePagination: {
              limit: 3,
              offset: 6,
              totalNumber: 4,
              totalRecords: 888,
            },
            sort: {
              key: 'amount',
              direction: 'ASC',
            },
          },
          expected: {
            limit: 3,
            offset: 6,
            sort: {
              key: 'amount',
              direction: 'ASC',
            },
            totalRecords: 4,
          },
        },
      ]

      test.each(cases)('responsePagination.offset: $params.responsePagination.offset', ({
        params,
        expected,
      }) => {
        const resolver = ExpensesQueryResolver.create()

        const actual = resolver.formatPagination(/** @type {*} */ (params))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('#formatResponse()', () => {
    describe('should assemble the page and its pagination', () => {
      const cases = [
        {
          params: {
            expenseAttributes: {
              id: 10200002,
              StaffMemberId: 10110001,
              ExpenseCategoryId: 10000002,
              spentOn: '2026-08-21',
              amount: 880,
              memo: 'lunch while on site',
              status: 'recorded',
              createdAt: new Date('2026-08-22T01:02:03.000Z'),
              updatedAt: new Date('2026-08-22T01:02:03.000Z'),
              ExpenseCategory: {
                id: 10000002,
                name: 'meals',
                displayOrder: 2,
              },
            },
            responsePagination: {
              limit: 1,
              offset: 2,
              totalNumber: 10,
            },
            sort: null,
          },
          expected: {
            expenses: [
              {
                id: 10200002,
                spentOn: '2026-08-21',
                amount: 880,
                memo: 'lunch while on site',
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: new Date('2026-08-22T01:02:03.000Z'),
                updatedAt: new Date('2026-08-22T01:02:03.000Z'),
              },
            ],
            pagination: {
              limit: 1,
              offset: 2,
              sort: null,
              totalRecords: 10,
            },
          },
        },
        {
          params: {
            expenseAttributes: {
              id: 10200013,
              StaffMemberId: 10110002,
              ExpenseCategoryId: 10000001,
              spentOn: '2026-09-05',
              amount: 33500,
              memo: null,
              status: 'recorded',
              createdAt: new Date('2026-09-06T09:08:07.000Z'),
              updatedAt: new Date('2026-09-06T09:08:07.000Z'),
              ExpenseCategory: {
                id: 10000001,
                name: 'transport',
                displayOrder: 1,
              },
            },
            responsePagination: {
              limit: 5,
              offset: 0,
              totalNumber: 4,
            },
            sort: {
              key: 'spentOn',
              direction: 'DESC',
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
                createdAt: new Date('2026-09-06T09:08:07.000Z'),
                updatedAt: new Date('2026-09-06T09:08:07.000Z'),
              },
            ],
            pagination: {
              limit: 5,
              offset: 0,
              sort: {
                key: 'spentOn',
                direction: 'DESC',
              },
              totalRecords: 4,
            },
          },
        },
      ]

      test.each(cases)('expenseAttributes.id: $params.expenseAttributes.id', ({
        params,
        expected,
      }) => {
        const resolver = ExpensesQueryResolver.create()

        const formatArgs = {
          expenseEntities: [
            Expense.build(
              params.expenseAttributes,
              {
                include: [
                  ExpenseCategory,
                ],
              }
            ),
          ],
          responsePagination: params.responsePagination,
          sort: params.sort,
        }

        const actual = resolver.formatResponse(/** @type {*} */ (formatArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * The operation end to end against the seeded database, asserted by value rather than by
     * shape, and in one `toEqual` over the whole result.
     *
     * The first case is the first page of the owner who has ten. It carries, in one assertion,
     * four of this feature's acceptance criteria: the order is newest `spentOn` first (the ids are
     * scrambled against it), the fifth row's **memo is null and reads back null**, the category
     * arrives as a nested object of its own three fields, and `totalRecords` is **ten** where the
     * page holds five — the total of the whole set, not of the page.
     *
     * The second case is the other owner's whole set, four rows in their own newest-first order.
     * Neither answer holds a single row of the other, which is the criterion that nobody sees
     * anybody else's entries: they are not filtered out of the result, they are outside the query.
     */
    describe('should answer one page of the caller own entries', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            pagination: {
              limit: 5,
              offset: 0,
            },
          },
          expected: {
            expenses: [
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
              {
                id: 10200004,
                spentOn: '2026-09-02',
                amount: 12000,
                memo: 'conference ticket',
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
                id: 10200002,
                spentOn: '2026-08-21',
                amount: 880,
                memo: 'lunch while on site',
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
              {
                id: 10200006,
                spentOn: '2026-08-05',
                amount: 5730,
                memo: null, // the optional memo, seeded empty and read back empty
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
              limit: 5,
              offset: 0,
              sort: null, // not presented, and nullable in the contract
              totalRecords: 10, // the whole set, where the page holds five
            },
          },
        },
        {
          params: {
            staffMemberId: 10110002,
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
                memo: null, // the other owner optional memo, likewise empty
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
              totalRecords: 4, // four rows, and not one of the other owner ten
            },
          },
        },
      ]

      test.each(cases)('staffMemberId: $params.staffMemberId', async ({
        params,
        expected,
      }) => {
        const resolver = ExpensesQueryResolver.create()

        const resolveArgs = {
          variables: {
            input: {
              pagination: params.pagination,
            },
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

describe('ExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * **The sort clause is read back and never honoured**, which the pinned contract states in
     * writing: no operation of 1.0.0 lets the caller choose a sort.
     *
     * Every clause presented below would visibly reorder the answer if it were applied — the ten
     * rows of 10110001 run 1, 260, 640, 880, 1200, 2175, 3450, 5730, 12000, 98000 by amount, and
     * their ids ascend in a third order again — and each is answered with the same three rows,
     * newest `spentOn` first. The clause comes back unchanged beside them, which is reading a
     * field rather than applying it.
     */
    describe('should not let a presented sort reach the ordering', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            pagination: {
              limit: 3,
              offset: 0,
              sort: {
                key: 'amount',
                direction: 'ASC',
              },
            },
          },
          expected: {
            expenses: [
              expect.objectContaining({
                id: 10200008,
                spentOn: '2026-09-09',
                amount: 98000,
              }),
              expect.objectContaining({
                id: 10200004,
                spentOn: '2026-09-02',
                amount: 12000,
              }),
              expect.objectContaining({
                id: 10200002,
                spentOn: '2026-08-21',
                amount: 880,
              }),
            ],
            pagination: {
              limit: 3,
              offset: 0,
              sort: {
                key: 'amount',
                direction: 'ASC',
              },
              totalRecords: 10,
            },
          },
        },
        {
          params: {
            staffMemberId: 10110001,
            pagination: {
              limit: 3,
              offset: 0,
              sort: {
                key: 'id',
                direction: 'ASC',
              },
            },
          },
          expected: {
            expenses: [
              expect.objectContaining({
                id: 10200008,
                spentOn: '2026-09-09',
                amount: 98000,
              }),
              expect.objectContaining({
                id: 10200004,
                spentOn: '2026-09-02',
                amount: 12000,
              }),
              expect.objectContaining({
                id: 10200002,
                spentOn: '2026-08-21',
                amount: 880,
              }),
            ],
            pagination: {
              limit: 3,
              offset: 0,
              sort: {
                key: 'id',
                direction: 'ASC',
              },
              totalRecords: 10,
            },
          },
        },
        {
          params: {
            staffMemberId: 10110001,
            pagination: {
              limit: 3,
              offset: 0,
              sort: {
                key: 'spentOn',
                direction: 'ASC',
              },
            },
          },
          expected: {
            expenses: [
              expect.objectContaining({
                id: 10200008,
                spentOn: '2026-09-09',
                amount: 98000,
              }),
              expect.objectContaining({
                id: 10200004,
                spentOn: '2026-09-02',
                amount: 12000,
              }),
              expect.objectContaining({
                id: 10200002,
                spentOn: '2026-08-21',
                amount: 880,
              }),
            ],
            pagination: {
              limit: 3,
              offset: 0,
              sort: {
                key: 'spentOn',
                direction: 'ASC',
              },
              totalRecords: 10,
            },
          },
        },
      ]

      test.each(cases)('pagination.sort.key: $params.pagination.sort.key', async ({
        params,
        expected,
      }) => {
        const resolver = ExpensesQueryResolver.create()

        const resolveArgs = {
          variables: {
            input: {
              pagination: params.pagination,
            },
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

describe('ExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * A member of staff who has recorded nothing, and a page past the end of one who has. Both are
     * an empty list rather than a refusal — an empty page is a successful read.
     */
    describe('when the page holds no entry at all', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110003,
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
        },
        {
          params: {
            staffMemberId: 10110009,
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
        },
        {
          params: {
            staffMemberId: 10110001,
            pagination: {
              limit: 10,
              offset: 10,
            },
          },
        },
      ]

      test.each(cases)('staffMemberId: $params.staffMemberId', async ({
        params,
      }) => {
        const resolver = ExpensesQueryResolver.create()

        const resolveArgs = {
          variables: {
            input: {
              pagination: params.pagination,
            },
          },
          context: {
            staffMemberId: params.staffMemberId,
          },
        }

        const resolved = await resolver.resolve(/** @type {*} */ (resolveArgs))

        expect(resolved.expenses)
          .toHaveLength(0)
      })
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * The operation refuses before it reads anything when the context carries no member of staff.
     *
     * The engine is where that is guaranteed — `expenses` is absent from
     * `schemasToSkipFiltering`, so the authentication filter refuses a tokenless caller before a
     * resolver is reached, and the sibling `execute-expense-stub-operations.js` drives that
     * through the built schema. What is asserted here is the resolver own second line, for the
     * case where that hand-maintained list is wrong: the refusal is a bare error code, and nothing
     * about a caller or a row comes back with it.
     *
     * The three cases differ in what else the context carries, and in what was asked for: a
     * perfectly good page request, and a malformed one. The session guard answers first in both,
     * so a caller with no session is never told whether their input was also wrong.
     */
    describe('when the context carries no member of staff', () => {
      const cases = [
        {
          params: {
            context: {
              staffMemberId: null,
            },
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          label: 'staffMemberId alone, with a valid page',
          expected: '204.Q002.001',
        },
        {
          params: {
            context: {
              staffMemberId: null,
              staffMember: null,
              now: new Date('2026-09-15T09:00:00.000Z'),
            },
            pagination: {
              limit: 10,
              offset: 0,
            },
          },
          label: 'staffMemberId among the rest of the context',
          expected: '204.Q002.001',
        },
        {
          params: {
            context: {
              staffMemberId: null,
            },
            pagination: {
              limit: 0,
              offset: -1,
            },
          },
          label: 'staffMemberId alone, with a malformed page',
          expected: '204.Q002.001',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
        expected,
      }) => {
        const resolver = ExpensesQueryResolver.create()

        const resolveArgs = {
          variables: {
            input: {
              pagination: params.pagination,
            },
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

describe('ExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * A page nobody could be served, refused with the validator own code rather than answered with
     * whatever `RequestPagination` would have quietly substituted — `resolveLimit()` answers 20
     * for a limit of 0, and `resolveOffset()` answers 0 for a negative offset, so left unrefused
     * each of these would have come back looking like a successful read of a page the caller never
     * asked for.
     */
    describe('when the presented page is one nobody could be served', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            pagination: {
              limit: 0,
              offset: 0,
            },
          },
          label: 'a page of no rows at all',
          expected: '203.Q002.001',
        },
        {
          params: {
            staffMemberId: 10110001,
            pagination: {
              limit: -4,
              offset: 0,
            },
          },
          label: 'a page of a negative number of rows',
          expected: '203.Q002.001',
        },
        {
          params: {
            staffMemberId: 10110001,
            pagination: {
              limit: 10,
              offset: -1,
            },
          },
          label: 'a page starting one row before the first',
          expected: '203.Q002.002',
        },
        {
          params: {
            staffMemberId: 10110002,
            pagination: {
              limit: 10,
              offset: -30,
            },
          },
          label: 'a page starting thirty rows before the first',
          expected: '203.Q002.002',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
        expected,
      }) => {
        const resolver = ExpensesQueryResolver.create()

        const resolveArgs = {
          variables: {
            input: {
              pagination: params.pagination,
            },
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
