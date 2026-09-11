import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

import SessionClerk from '../../../../../../../../app/session/SessionClerk.js'

import StaffMemberAccessToken from '../../../../../../../../sequelize/models/StaffMemberAccessToken.js'
import StaffMemberRefreshToken from '../../../../../../../../sequelize/models/StaffMemberRefreshToken.js'

import RefreshTokenExpressCookieClerk from '../../../../../../../../server/graphql/contexts/tools/RefreshTokenExpressCookieClerk.js'

import SignOutMutationResolver from '../../../../../../../../server/graphql/resolvers/staff/actual/mutations/SignOutMutationResolver.js'

/*
 * The non-writing members of the resolver live here; `#resolve()` and `#revokeSession()` write to
 * the session tables, directly or through the clerk, and live in
 * `tests/_orders/StaffMemberRefreshToken/mutations/SignOutMutationResolver.js`.
 */

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
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#sessionClerk', () => {
        const cases = [
          {
            params: {
              sessionClerk: /** @type {*} */ ({ label: 'session clerk alpha' }),
              errorHash: /** @type {*} */ ({ label: 'error hash alpha' }),
            },
          },
          {
            params: {
              sessionClerk: /** @type {*} */ ({ label: 'session clerk beta' }),
              errorHash: /** @type {*} */ ({ label: 'error hash beta' }),
            },
          },
        ]

        test.each(cases)('sessionClerk.label: $params.sessionClerk.label', ({ params }) => {
          const resolver = new SignOutMutationResolver(params)

          expect(resolver)
            .toHaveProperty('sessionClerk', params.sessionClerk)
        })
      })

      describe('#errorHash', () => {
        /*
         * `errorHash` reaches the base through `...remainingParams`. Asserting it here is what
         * says the rest of the constructor's parameters are not swallowed on the way up.
         */
        const cases = [
          {
            params: {
              sessionClerk: /** @type {*} */ ({ label: 'session clerk gamma' }),
              errorHash: /** @type {*} */ ({ label: 'error hash gamma' }),
            },
          },
          {
            params: {
              sessionClerk: /** @type {*} */ ({ label: 'session clerk delta' }),
              errorHash: /** @type {*} */ ({ label: 'error hash delta' }),
            },
          },
        ]

        test.each(cases)('errorHash.label: $params.errorHash.label', ({ params }) => {
          const resolver = new SignOutMutationResolver(params)

          expect(resolver)
            .toHaveProperty('errorHash', params.errorHash)
        })
      })
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('.create()', () => {
    describe('should be instance of own class', () => {
      const cases = [
        {
          params: {
            sessionClerk: /** @type {*} */ ({ label: 'session clerk alpha' }),
          },
        },
        {
          params: {
            sessionClerk: /** @type {*} */ ({ label: 'session clerk beta' }),
          },
        },
      ]

      test.each(cases)('sessionClerk.label: $params.sessionClerk.label', ({ params }) => {
        const actual = SignOutMutationResolver.create(params)

        expect(actual)
          .toBeInstanceOf(SignOutMutationResolver)
      })
    })

    describe('should be called by constructor', () => {
      /*
       * `.create()` derives `errorHash` from the error code hash, so the constructor is called
       * with the transformed object rather than with the case's own parameters. The derived half
       * is asserted by `.get:errorCodeHash` and by the throwing branches in `_orders`; what is
       * asserted here is that the injected clerk is handed through untouched.
       */
      const cases = [
        {
          params: {
            sessionClerk: /** @type {*} */ ({ label: 'session clerk gamma' }),
          },
          expected: expect.objectContaining({
            sessionClerk: /** @type {*} */ ({ label: 'session clerk gamma' }),
          }),
        },
        {
          params: {
            sessionClerk: /** @type {*} */ ({ label: 'session clerk delta' }),
          },
          expected: expect.objectContaining({
            sessionClerk: /** @type {*} */ ({ label: 'session clerk delta' }),
          }),
        },
      ]

      test.each(cases)('sessionClerk.label: $params.sessionClerk.label', ({
        params,
        expected,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(SignOutMutationResolver)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should use default sessionClerk value', () => {
      const cases = [
        {
          mockSessionClerk: /** @type {*} */ ({ label: 'defaulted session clerk alpha' }),
        },
        {
          mockSessionClerk: /** @type {*} */ ({ label: 'defaulted session clerk beta' }),
        },
      ]

      test.each(cases)('mockSessionClerk.label: $mockSessionClerk.label', ({ mockSessionClerk }) => {
        const createSessionClerkSpy = jest.spyOn(SignOutMutationResolver, 'createSessionClerk')
          .mockReturnValue(mockSessionClerk)

        const actual = SignOutMutationResolver.create()

        expect(actual)
          .toHaveProperty('sessionClerk', mockSessionClerk)
        expect(createSessionClerkSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('.get:RefreshTokenExpressCookieClerkCtor', () => {
    test('to be the cookie clerk class', () => {
      const actual = SignOutMutationResolver.RefreshTokenExpressCookieClerkCtor

      expect(actual)
        .toBe(RefreshTokenExpressCookieClerk) // same reference
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('.get:SessionClerkCtor', () => {
    test('to be the session clerk class', () => {
      const actual = SignOutMutationResolver.SessionClerkCtor

      expect(actual)
        .toBe(SessionClerk) // same reference
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('.get:StaffMemberAccessTokenCtor', () => {
    test('to be the staff member access token model', () => {
      const actual = SignOutMutationResolver.StaffMemberAccessTokenCtor

      expect(actual)
        .toBe(StaffMemberAccessToken) // same reference
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('.get:StaffMemberRefreshTokenCtor', () => {
    test('to be the staff member refresh token model', () => {
      const actual = SignOutMutationResolver.StaffMemberRefreshTokenCtor

      expect(actual)
        .toBe(StaffMemberRefreshToken) // same reference
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
     * One code for every way the presented credential can fail, because section 10 requires the
     * refusals indistinguishable; the second code is the revocation that did not land, which no
     * credential state can reach. `M002` is this operation's id.
     */
    test('to carry this operation own codes', () => {
      const expected = {
        SessionNotFound: '204.M002.001',
        FailedToRevokeSession: '204.M002.002',
      }

      const actual = SignOutMutationResolver.errorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('.createSessionClerk()', () => {
    describe('should be instance of SessionClerk', () => {
      test('to be a session clerk', () => {
        const actual = SignOutMutationResolver.createSessionClerk()

        expect(actual)
          .toBeInstanceOf(SessionClerk)
      })
    })

    describe('should hand the staff token models to the clerk', () => {
      test('to be called with both staff token models', () => {
        const createSpy = jest.spyOn(SessionClerk, 'create')
        const expected = {
          AccessTokenModel: StaffMemberAccessToken,
          RefreshTokenModel: StaffMemberRefreshToken,
        }

        SignOutMutationResolver.createSessionClerk()

        expect(createSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        factoryParams: {
          sessionClerk: /** @type {*} */ ({ label: 'session clerk alpha' }),
        },
      },
      {
        factoryParams: {
          sessionClerk: /** @type {*} */ ({ label: 'session clerk beta' }),
        },
      },
    ]

    test.each(cases)('sessionClerk.label: $factoryParams.sessionClerk.label', ({ factoryParams }) => {
      const resolver = SignOutMutationResolver.create(factoryParams)

      const actual = resolver.Ctor

      expect(actual)
        .toBe(SignOutMutationResolver) // same reference
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('#createRefreshTokenCookieClerk()', () => {
    describe('should be instance of RefreshTokenExpressCookieClerk', () => {
      const cases = [
        {
          factoryParams: {
            sessionClerk: /** @type {*} */ ({ label: 'session clerk alpha' }),
          },
          params: {
            context: /** @type {*} */ ({ label: 'context alpha' }),
          },
        },
        {
          factoryParams: {
            sessionClerk: /** @type {*} */ ({ label: 'session clerk beta' }),
          },
          params: {
            context: /** @type {*} */ ({ label: 'context beta' }),
          },
        },
      ]

      test.each(cases)('context.label: $params.context.label', ({
        factoryParams,
        params,
      }) => {
        const resolver = SignOutMutationResolver.create(factoryParams)

        const actual = resolver.createRefreshTokenCookieClerk(params)

        expect(actual)
          .toBeInstanceOf(RefreshTokenExpressCookieClerk)
      })
    })

    describe('should build the clerk from the context it was handed', () => {
      const cases = [
        {
          factoryParams: {
            sessionClerk: /** @type {*} */ ({ label: 'session clerk gamma' }),
          },
          params: {
            context: /** @type {*} */ ({ label: 'context gamma' }),
          },
        },
        {
          factoryParams: {
            sessionClerk: /** @type {*} */ ({ label: 'session clerk delta' }),
          },
          params: {
            context: /** @type {*} */ ({ label: 'context delta' }),
          },
        },
      ]

      test.each(cases)('context.label: $params.context.label', ({
        factoryParams,
        params,
      }) => {
        const resolver = SignOutMutationResolver.create(factoryParams)

        const actual = resolver.createRefreshTokenCookieClerk(params)

        expect(actual)
          .toHaveProperty('context', params.context)
      })
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('#findRefreshToken()', () => {
    /*
     * The lookup is the clerk's, and this method owns only the delegation: the presented token is
     * handed over untouched and the row comes back by reference, so nothing here hashes or matches
     * a token of its own. The clerk's own lookup is exercised for real in
     * `tests/_orders/SessionClerk/SessionClerk.js`.
     */
    describe('should hand the presented token to the session clerk', () => {
      const cases = [
        {
          params: {
            refreshToken: 'presented-refresh-token-alpha',
          },
          tally: /** @type {*} */ ({ label: 'refresh token row alpha' }),
        },
        {
          params: {
            refreshToken: 'presented-refresh-token-beta',
          },
          tally: /** @type {*} */ ({ label: 'refresh token row beta' }),
        },
      ]

      test.each(cases)('refreshToken: $params.refreshToken', async ({
        params,
        tally,
      }) => {
        const findRefreshTokenSpy = jest.fn()
          .mockResolvedValue(tally)
        const resolver = SignOutMutationResolver.create({
          sessionClerk: /** @type {*} */ ({
            findRefreshToken: findRefreshTokenSpy,
          }),
        })

        const actual = await resolver.findRefreshToken(params)

        expect(actual)
          .toBe(tally) // same reference
        expect(findRefreshTokenSpy)
          .toHaveBeenCalledWith(params)
      })
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('#formatResponse()', () => {
    /*
     * The answer is a literal and does not move with the instance, which is what says it is a
     * literal and not something read off the resolver own state. There is no false case to cover:
     * every refusal throws, so a caller that is answered at all has been signed out.
     */
    describe('should report the sign-out as done whatever the instance holds', () => {
      const cases = [
        {
          factoryParams: {
            sessionClerk: /** @type {*} */ ({ label: 'session clerk alpha' }),
          },
          expected: {
            signedOut: true,
          },
        },
        {
          factoryParams: {
            sessionClerk: /** @type {*} */ ({ label: 'session clerk beta' }),
          },
          expected: {
            signedOut: true,
          },
        },
      ]

      test.each(cases)('sessionClerk.label: $factoryParams.sessionClerk.label', ({
        factoryParams,
        expected,
      }) => {
        const resolver = SignOutMutationResolver.create(factoryParams)

        const actual = resolver.formatResponse()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
