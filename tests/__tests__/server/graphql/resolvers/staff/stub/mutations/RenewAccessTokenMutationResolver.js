import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

import RenewAccessTokenMutationResolver from '../../../../../../../../server/graphql/resolvers/staff/stub/mutations/RenewAccessTokenMutationResolver.js'

describe('RenewAccessTokenMutationResolver', () => {
  describe('super class', () => {
    test('to be instance of BaseMutationResolver', () => {
      const actual = RenewAccessTokenMutationResolver.prototype

      expect(actual)
        .toBeInstanceOf(BaseMutationResolver)
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('.get:schema', () => {
    test('to be fixed value', () => {
      const expected = 'renewAccessToken'

      const actual = RenewAccessTokenMutationResolver.schema

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('.get:errorCodeHash', () => {
    /*
     * A stub throws nothing, so it owns no error code. The real codes, built on this operation's
     * id `M003`, arrive with the `actual/` resolver at checkpoint 6 — including the one refusal
     * that has to read the same for a refresh token missing, expired, revoked or already spent.
     */
    test('to be empty', () => {
      const expected = {}

      const actual = RenewAccessTokenMutationResolver.errorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The operation takes no argument, so what varies case to case is the instance: each is
     * created with a different stand-in error code, and so holds a different `errorHash`. The
     * token handed back does not move with it, and it is a different literal from the one
     * `SignInMutationResolver` returns, so a reader can tell which of the two minted it.
     */
    describe('to hand back its own hardcoded access token whatever the instance holds', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '203.M003.001',
            },
          },
          expected: {
            accessToken: 'stub-access-token-from-renew-0002',
          },
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M003.001',
            },
          },
          expected: {
            accessToken: 'stub-access-token-from-renew-0002',
          },
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', async ({
        factoryParams,
        expected,
      }) => {
        const resolver = RenewAccessTokenMutationResolver.create(factoryParams)

        const actual = await resolver.resolve()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
