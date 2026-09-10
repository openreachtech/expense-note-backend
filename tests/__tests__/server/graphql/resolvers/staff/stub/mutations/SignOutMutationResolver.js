import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

import SignOutMutationResolver from '../../../../../../../../server/graphql/resolvers/staff/stub/mutations/SignOutMutationResolver.js'

describe('SignOutMutationResolver', () => {
  describe('super class', () => {
    test('to be instance of BaseMutationResolver', () => {
      const actual = SignOutMutationResolver.prototype

      expect(actual)
        .toBeInstanceOf(BaseMutationResolver)
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('.get:schema', () => {
    test('to be fixed value', () => {
      const expected = 'signOut'

      const actual = SignOutMutationResolver.schema

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('.get:errorCodeHash', () => {
    /*
     * A stub throws nothing, so it owns no error code. The real codes, built on this operation's
     * id `M002`, arrive with the `actual/` resolver at checkpoint 6.
     */
    test('to be empty', () => {
      const expected = {}

      const actual = SignOutMutationResolver.errorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The operation takes no argument, so what varies case to case is the instance: each is
     * created with a different stand-in error code, and so holds a different `errorHash`. The
     * answer does not move with it, which is what says the literal is a literal and not something
     * read off the resolver's own state.
     */
    describe('to report the sign-out as done whatever the instance holds', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '203.M002.001',
            },
          },
          expected: {
            signedOut: true,
          },
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M002.001',
            },
          },
          expected: {
            signedOut: true,
          },
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', async ({
        factoryParams,
        expected,
      }) => {
        const resolver = SignOutMutationResolver.create(factoryParams)

        const actual = await resolver.resolve()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
