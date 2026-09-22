import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

import RemoveExpenseMutationResolver from '../../../../../../../../server/graphql/resolvers/staff/stub/mutations/RemoveExpenseMutationResolver.js'

describe('RemoveExpenseMutationResolver', () => {
  describe('super class', () => {
    test('to be instance of BaseMutationResolver', () => {
      const actual = RemoveExpenseMutationResolver.prototype

      expect(actual)
        .toBeInstanceOf(BaseMutationResolver)
    })
  })
})

describe('RemoveExpenseMutationResolver', () => {
  describe('.get:schema', () => {
    test('to be fixed value', () => {
      const expected = 'removeExpense'

      const actual = RemoveExpenseMutationResolver.schema

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('RemoveExpenseMutationResolver', () => {
  describe('.get:errorCodeHash', () => {
    /*
     * A stub throws nothing, so it owns no error code. The real codes — built on this operation's
     * id `M006` in resolver-id-hash-staff.js, and covering the one not-found answer that a removed
     * entry and another member of staff's entry both get — arrive with the `actual/` resolver at
     * checkpoint 6, and this assertion is what notices one landing here early.
     */
    test('to be empty', () => {
      const expected = {}

      const actual = RemoveExpenseMutationResolver.errorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('RemoveExpenseMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The identifier presented comes back, and nothing else does. It is the only field of this
     * input, and the result mirrors it, so it is the one field a stub may read.
     *
     * The cases move that identifier so the answer has to move with it — an answer hardcoded to
     * one number would pass a single case and fail here. The first removes an entry
     * `ExpensesQueryResolver` actually answers with. The second names an identifier that appears
     * nowhere in that set, standing for both the entry belonging to somebody else and the entry
     * already removed: the two were settled as one answer, not-found, and **this one removes it
     * just the same**. A stub refuses nothing, and the refusal arrives with the `actual/` resolver
     * at checkpoint 6.
     */
    describe('to answer with the identifier it was given, whosever entry it names', () => {
      const cases = [
        {
          params: {
            variables: {
              input: {
                expenseId: 9109,
              },
            },
            context: null, // neutral value; a stub reads no context
          },
          expected: {
            expenseId: 9109,
          },
        },
        {
          params: {
            variables: {
              input: {
                expenseId: 6402, // named by nobody; the real operation answers this as not found
              },
            },
            context: null, // neutral value; a stub reads no context
          },
          expected: {
            expenseId: 6402,
          },
        },
      ]

      test.each(cases)('variables.input.expenseId: $params.variables.input.expenseId', async ({
        params,
        expected,
      }) => {
        const resolver = RemoveExpenseMutationResolver.create()

        const actual = await resolver.resolve(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
