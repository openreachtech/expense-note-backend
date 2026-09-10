import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

import SignInMutationResolver from '../../../../../../../../server/graphql/resolvers/staff/stub/mutations/SignInMutationResolver.js'

describe('SignInMutationResolver', () => {
  describe('super class', () => {
    test('to be instance of BaseMutationResolver', () => {
      const actual = SignInMutationResolver.prototype

      expect(actual)
        .toBeInstanceOf(BaseMutationResolver)
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('.get:schema', () => {
    test('to be fixed value', () => {
      const expected = 'signIn'

      const actual = SignInMutationResolver.schema

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('.get:errorCodeHash', () => {
    /*
     * A stub throws nothing, so it owns no error code. The real codes — `203.M001.001` and the
     * rest, built on this operation's id in resolver-id-hash-staff.js — arrive with the `actual/`
     * resolver at checkpoint 6, and this assertion is what notices one landing here early.
     */
    test('to be empty', () => {
      const expected = {}

      const actual = SignInMutationResolver.errorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The credentials presented differ case to case — a plausible address with a plausible
     * password, then an address of a shape no account could have with an empty password — and the
     * answer does not. That is the whole contract of a stub: hardcoded literals, and no branch on
     * anything the caller sent.
     */
    describe('to answer with the same hardcoded staff member whatever credentials are presented', () => {
      const cases = [
        {
          params: {
            variables: {
              input: {
                email: 'first.caller@example.invalid',
                password: 'first-caller-password',
              },
            },
            context: null, // neutral value; a stub reads no context
          },
          expected: {
            staffMemberId: 9001,
            accessToken: 'stub-access-token-from-sign-in-0001',
          },
        },
        {
          params: {
            variables: {
              input: {
                email: 'second-caller-with-no-account',
                password: '',
              },
            },
            context: null, // neutral value; a stub reads no context
          },
          expected: {
            staffMemberId: 9001,
            accessToken: 'stub-access-token-from-sign-in-0001',
          },
        },
      ]

      test.each(cases)('variables.input.email: $params.variables.input.email', async ({
        params,
        expected,
      }) => {
        const resolver = SignInMutationResolver.create()

        const actual = await resolver.resolve(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
