import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

import RecordExpenseMutationResolver from '../../../../../../../../server/graphql/resolvers/staff/stub/mutations/RecordExpenseMutationResolver.js'

describe('RecordExpenseMutationResolver', () => {
  describe('super class', () => {
    test('to be instance of BaseMutationResolver', () => {
      const actual = RecordExpenseMutationResolver.prototype

      expect(actual)
        .toBeInstanceOf(BaseMutationResolver)
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('.get:schema', () => {
    test('to be fixed value', () => {
      const expected = 'recordExpense'

      const actual = RecordExpenseMutationResolver.schema

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('.get:errorCodeHash', () => {
    /*
     * A stub throws nothing, so it owns no error code. The real codes — built on this operation's
     * id `M004` in resolver-id-hash-staff.js, and covering the value checks section 11 makes
     * acceptance criteria of — arrive with the `actual/` resolver at checkpoint 6, and this
     * assertion is what notices one landing here early.
     */
    test('to be empty', () => {
      const expected = {}

      const actual = RecordExpenseMutationResolver.errorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * What is presented differs case to case and the answer does not. That is the whole contract
     * of a stub: hardcoded literals, and no branch on anything the caller sent.
     *
     * The cases are chosen so that the sameness of the answer is worth something. The first is an
     * entry a member of staff would plausibly record, memo and all. The second carries a negative
     * amount and a `spentOn` far in the future, both of which section 11 makes the real operation
     * refuse — **and this one answers it as it answers the first**, which is the honest statement
     * that a stub refuses nothing. The third omits the memo altogether, which the contract allows
     * because the field is nullable.
     */
    describe('to answer with the same hardcoded identifier whatever is presented', () => {
      const cases = [
        {
          params: {
            variables: {
              input: {
                spentOn: '2026-09-14',
                amount: 1200,
                expenseCategoryId: 10000001,
                memo: 'Taxi to the client office',
              },
            },
            context: null, // neutral value; a stub reads no context
          },
          expected: {
            expenseId: 9113,
          },
        },
        {
          params: {
            variables: {
              input: {
                spentOn: '2099-12-31', // a date after today, which the real operation refuses
                amount: -4500, // a negative amount, which the real operation refuses
                expenseCategoryId: 10000002,
                memo: 'Presented to see that a stub refuses nothing',
              },
            },
            context: null, // neutral value; a stub reads no context
          },
          expected: {
            expenseId: 9113,
          },
        },
        {
          params: {
            variables: {
              input: {
                spentOn: '2026-08-30',
                amount: 780,
                expenseCategoryId: 10000004,
                // memo: undefined
              },
            },
            context: null, // neutral value; a stub reads no context
          },
          expected: {
            expenseId: 9113,
          },
        },
      ]

      test.each(cases)('variables.input.spentOn: $params.variables.input.spentOn', async ({
        params,
        expected,
      }) => {
        const resolver = RecordExpenseMutationResolver.create()

        const actual = await resolver.resolve(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
