import {
  BaseQueryResolver,
} from '@openreachtech/renchan'

import ExpenseCategoriesQueryResolver from '../../../../../../../../server/graphql/resolvers/staff/actual/queries/ExpenseCategoriesQueryResolver.js'

import ExpenseCategory from '../../../../../../../../sequelize/models/ExpenseCategory.js'

/*
 * Every row this file reads comes from the expense-category master,
 * `sequelize/seeders/master/20260908181714-000001-expense_categories.cjs`, mirrored into
 * `dev-master/` and applied by `db:refresh` and by `test.sh`'s own seed step. Nothing here writes
 * a row, and in particular nothing here creates one of `expense_categories`: that table's entire
 * row set is asserted in one `toEqual` by
 * `tests/__tests__/sequelize/seeders/master/expense_categories.js`, so a row left behind by this
 * file would turn a different feature's test red.
 *
 * The four seeded categories, in the display order this operation answers in, are
 *   10000001 transport 1, 10000002 meals 2, 10000003 supplies 3, 10000004 other 4
 * and the order below is asserted by those real values rather than by a count, so a resolver that
 * named no ordering at all would have to be right by accident to pass here.
 *
 * `createdAt` and `updatedAt` exist on each row and appear nowhere in this file, because the
 * contract does not declare them on `ExpenseCategory` and the resolver therefore does not carry
 * them.
 */

describe('ExpenseCategoriesQueryResolver', () => {
  describe('super class', () => {
    test('to be instance of BaseQueryResolver', () => {
      const actual = ExpenseCategoriesQueryResolver.prototype

      expect(actual)
        .toBeInstanceOf(BaseQueryResolver)
    })
  })
})

describe('ExpenseCategoriesQueryResolver', () => {
  describe('.get:schema', () => {
    /*
     * The field name the SDL declares. A misspelling here wires the class to no field at all, and
     * `execute-expense-stub-operations.js` is where that would surface as an unreachable
     * operation.
     */
    test('to be fixed value', () => {
      const expected = 'expenseCategories'

      const actual = ExpenseCategoriesQueryResolver.schema

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('ExpenseCategoriesQueryResolver', () => {
  describe('.get:errorCodeHash', () => {
    /*
     * **Empty, and pinned as empty.** The operation takes no input, so it holds no `203` rule, and
     * it reads a master table nobody owns, so it holds no `204` session guard — the refusal of a
     * caller with no session is the engine's, raised before this resolver is entered. A code
     * appearing here later would mean this operation had grown a refusal of its own, which is a
     * contract change rather than an implementation detail.
     *
     * `Q003` is its stable id all the same, fixed in `server/graphql/resolver-id-hash-staff.js`.
     */
    test('to be fixed value', () => {
      const expected = {}

      const actual = ExpenseCategoriesQueryResolver.errorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('ExpenseCategoriesQueryResolver', () => {
  describe('#get:ExpenseCategoryModel', () => {
    /*
     * The seam answers the same model whatever the instance holds, so what varies case to case is
     * the instance: each is created with a different stand-in error code, and so holds a different
     * `errorHash`.
     */
    describe('should answer the ExpenseCategory model', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.Q003.901',
            },
          },
          expected: ExpenseCategory,
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.Q003.902',
            },
          },
          expected: ExpenseCategory,
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', ({
        factoryParams,
        expected,
      }) => {
        const resolver = ExpenseCategoriesQueryResolver.create(factoryParams)

        const actual = resolver.ExpenseCategoryModel

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('ExpenseCategoriesQueryResolver', () => {
  describe('#findExpenseCategories()', () => {
    /*
     * Against the seeded database, with the ids and the display orders written out rather than
     * counted, so the ordering is asserted by which rows arrive and in which order.
     *
     * The method takes no argument, so what varies case to case is the instance: each is created
     * with a different stand-in error code, and each reads the same four rows in the same order —
     * the answer belongs to the table, not to the caller or to the instance.
     */
    describe('should answer every category, displayOrder ascending', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.Q003.903',
            },
          },
          expected: [
            expect.objectContaining({
              id: 10000001,
              name: 'transport',
              displayOrder: 1,
            }),
            expect.objectContaining({
              id: 10000002,
              name: 'meals',
              displayOrder: 2,
            }),
            expect.objectContaining({
              id: 10000003,
              name: 'supplies',
              displayOrder: 3,
            }),
            expect.objectContaining({
              id: 10000004,
              name: 'other',
              displayOrder: 4,
            }),
          ],
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.Q003.904',
            },
          },
          expected: [
            expect.objectContaining({
              id: 10000001,
              name: 'transport',
              displayOrder: 1,
            }),
            expect.objectContaining({
              id: 10000002,
              name: 'meals',
              displayOrder: 2,
            }),
            expect.objectContaining({
              id: 10000003,
              name: 'supplies',
              displayOrder: 3,
            }),
            expect.objectContaining({
              id: 10000004,
              name: 'other',
              displayOrder: 4,
            }),
          ],
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', async ({
        factoryParams,
        expected,
      }) => {
        const resolver = ExpenseCategoriesQueryResolver.create(factoryParams)

        const actual = await resolver.findExpenseCategories()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('ExpenseCategoriesQueryResolver', () => {
  describe('#formatExpenseCategory()', () => {
    /*
     * The three fields the contract declares, and only those three: the row carries `createdAt`
     * and `updatedAt` as well, and a formatted category must not.
     */
    describe('should answer the three fields the contract declares', () => {
      const cases = [
        {
          params: {
            expenseCategoryAttributes: {
              id: 10000001,
              name: 'transport',
              displayOrder: 1,
              createdAt: new Date('2026-09-08T18:17:14.000Z'),
              updatedAt: new Date('2026-09-08T18:17:14.000Z'),
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
              createdAt: new Date('2026-09-08T18:17:15.000Z'),
              updatedAt: new Date('2026-09-08T18:17:15.000Z'),
            },
          },
          expected: {
            id: 10000004,
            name: 'other',
            displayOrder: 4,
          },
        },
      ]

      test.each(cases)('expenseCategoryAttributes.name: $params.expenseCategoryAttributes.name', ({
        params,
        expected,
      }) => {
        const resolver = ExpenseCategoriesQueryResolver.create()

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

describe('ExpenseCategoriesQueryResolver', () => {
  describe('#formatResponse()', () => {
    /*
     * The result is one key holding the list, and the list keeps the order it was handed in —
     * which is why the second case hands the two categories over the other way round and is
     * answered the other way round. Ordering is the reading's business, not the formatting's.
     */
    describe('should wrap the formatted categories in the result key', () => {
      const cases = [
        {
          params: {
            firstExpenseCategoryAttributes: {
              id: 10000002,
              name: 'meals',
              displayOrder: 2,
              createdAt: new Date('2026-09-08T18:17:16.000Z'),
              updatedAt: new Date('2026-09-08T18:17:16.000Z'),
            },
            secondExpenseCategoryAttributes: {
              id: 10000003,
              name: 'supplies',
              displayOrder: 3,
              createdAt: new Date('2026-09-08T18:17:17.000Z'),
              updatedAt: new Date('2026-09-08T18:17:17.000Z'),
            },
          },
          expected: {
            expenseCategories: [
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
            ],
          },
        },
        {
          params: {
            firstExpenseCategoryAttributes: {
              id: 10000004,
              name: 'other',
              displayOrder: 4,
              createdAt: new Date('2026-09-08T18:17:18.000Z'),
              updatedAt: new Date('2026-09-08T18:17:18.000Z'),
            },
            secondExpenseCategoryAttributes: {
              id: 10000001,
              name: 'transport',
              displayOrder: 1,
              createdAt: new Date('2026-09-08T18:17:19.000Z'),
              updatedAt: new Date('2026-09-08T18:17:19.000Z'),
            },
          },
          expected: {
            expenseCategories: [
              {
                id: 10000004,
                name: 'other',
                displayOrder: 4,
              },
              {
                id: 10000001,
                name: 'transport',
                displayOrder: 1,
              },
            ],
          },
        },
      ]

      test.each(cases)('firstExpenseCategoryAttributes.name: $params.firstExpenseCategoryAttributes.name', ({
        params,
        expected,
      }) => {
        const resolver = ExpenseCategoriesQueryResolver.create()

        const formatArgs = {
          expenseCategoryEntities: [
            ExpenseCategory.build(params.firstExpenseCategoryAttributes),
            ExpenseCategory.build(params.secondExpenseCategoryAttributes),
          ],
        }

        const actual = resolver.formatResponse(/** @type {*} */ (formatArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('ExpenseCategoriesQueryResolver', () => {
  describe('#formatResponse()', () => {
    /*
     * A master that seeded no row is answered with an empty list, not with a refusal — an empty
     * read is a successful read, which is why this resolver declares no error code at all. It is
     * its own describe because an empty array is asserted by its length.
     */
    describe('when no category is handed over', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.Q003.905',
            },
          },
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.Q003.906',
            },
          },
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', ({
        factoryParams,
      }) => {
        const resolver = ExpenseCategoriesQueryResolver.create(factoryParams)

        const formatArgs = {
          expenseCategoryEntities: [],
        }

        const actual = resolver.formatResponse(/** @type {*} */ (formatArgs))

        expect(actual.expenseCategories)
          .toHaveLength(0)
      })
    })
  })
})

describe('ExpenseCategoriesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * The operation end to end against the seeded database, asserted by value rather than by shape
     * and in one `toEqual` over the whole result.
     *
     * It carries the acceptance criterion this operation owes: the four categories of the master
     * come back, each as its three contract fields, **in `displayOrder` order** — transport,
     * meals, supplies, other — and the display orders are asserted as the real values 1, 2, 3, 4
     * rather than merely being present.
     *
     * The operation takes no argument and never reads the context, so what varies case to case is
     * the instance: each is created with a different stand-in error code, and both are answered
     * identically. That is the point of the pair — the category master is the same for everybody,
     * which is why the SDL gives this operation nothing to narrow it by.
     */
    describe('should answer the whole category master in display order', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.Q003.907',
            },
          },
          expected: {
            expenseCategories: [
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
            ],
          },
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.Q003.908',
            },
          },
          expected: {
            expenseCategories: [
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
            ],
          },
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', async ({
        factoryParams,
        expected,
      }) => {
        const resolver = ExpenseCategoriesQueryResolver.create(factoryParams)

        const actual = await resolver.resolve()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
