import {
  BaseQueryResolver,
} from '@openreachtech/renchan'

import ExpenseCategoriesQueryResolver from '../../../../../../../../server/graphql/resolvers/staff/stub/queries/ExpenseCategoriesQueryResolver.js'

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
     * A stub throws nothing, so it owns no error code. The real codes, built on this operation's
     * id `Q003`, arrive with the `actual/` resolver at checkpoint 6 — as does the refusal without
     * a session, which no stub can stand in for.
     */
    test('to be empty', () => {
      const expected = {}

      const actual = ExpenseCategoriesQueryResolver.errorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('ExpenseCategoriesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * The operation takes no argument, so what varies case to case is the instance: each is
     * created with a different stand-in error code, and so holds a different `errorHash`. The
     * category master answered does not move with it.
     *
     * The four asserted here are the rows
     * `sequelize/seeders/master/20260908181714-000001-expense_categories.cjs` seeds — same ids,
     * same names, same display order — and they are asserted in that order, because the order is
     * the order a screen offers them in. They are also the four `ExpensesQueryResolver` hangs its
     * entries off, which is what makes the two operations agree.
     */
    describe('to answer with the same hardcoded category master whatever the instance holds', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '203.Q003.001',
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
              StandInError: '204.Q003.001',
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
