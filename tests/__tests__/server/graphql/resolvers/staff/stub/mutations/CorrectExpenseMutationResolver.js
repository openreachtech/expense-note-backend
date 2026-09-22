import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

import CorrectExpenseMutationResolver from '../../../../../../../../server/graphql/resolvers/staff/stub/mutations/CorrectExpenseMutationResolver.js'

describe('CorrectExpenseMutationResolver', () => {
  describe('super class', () => {
    test('to be instance of BaseMutationResolver', () => {
      const actual = CorrectExpenseMutationResolver.prototype

      expect(actual)
        .toBeInstanceOf(BaseMutationResolver)
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
  describe('.get:schema', () => {
    test('to be fixed value', () => {
      const expected = 'correctExpense'

      const actual = CorrectExpenseMutationResolver.schema

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
  describe('.get:errorCodeHash', () => {
    /*
     * A stub throws nothing, so it owns no error code. The real codes — built on this operation's
     * id `M005` in resolver-id-hash-staff.js, and covering both the value checks and the not-found
     * answer another member of staff's entry gets — arrive with the `actual/` resolver at
     * checkpoint 6, and this assertion is what notices one landing here early.
     */
    test('to be empty', () => {
      const expected = {}

      const actual = CorrectExpenseMutationResolver.errorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The identifier presented comes back, and nothing else does. It is the one field of this
     * input the result mirrors, so it is the one field a stub may read.
     *
     * The cases move that identifier so the answer has to move with it — an answer hardcoded to
     * one number would pass a single case and fail here. The first corrects an entry
     * `ExpensesQueryResolver` actually answers with; the second names an identifier that appears
     * nowhere in that set, which the real operation answers as not found and **this one corrects
     * just the same**. The third carries no memo, which the contract allows and which clears the
     * memo when the real operation lands, because `correctExpense` replaces rather than patches.
     */
    describe('to answer with the identifier it was given, whosever entry it names', () => {
      const cases = [
        {
          params: {
            variables: {
              input: {
                expenseId: 9105,
                spentOn: '2026-09-05',
                amount: 12000,
                expenseCategoryId: 10000002,
                memo: 'Team dinner after the release',
              },
            },
            context: null, // neutral value; a stub reads no context
          },
          expected: {
            expenseId: 9105,
          },
        },
        {
          params: {
            variables: {
              input: {
                expenseId: 7788, // named by nobody; the real operation answers this as not found
                spentOn: '2026-07-19',
                amount: 3300,
                expenseCategoryId: 10000003,
                memo: 'Presented to see that a stub refuses nothing',
              },
            },
            context: null, // neutral value; a stub reads no context
          },
          expected: {
            expenseId: 7788,
          },
        },
        {
          params: {
            variables: {
              input: {
                expenseId: 9110,
                spentOn: '2026-08-21',
                amount: 7350,
                expenseCategoryId: 10000003,
                // memo: undefined
              },
            },
            context: null, // neutral value; a stub reads no context
          },
          expected: {
            expenseId: 9110,
          },
        },
      ]

      test.each(cases)('variables.input.expenseId: $params.variables.input.expenseId', async ({
        params,
        expected,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()

        const actual = await resolver.resolve(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
