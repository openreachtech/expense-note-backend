import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

import SessionClerk from '../../../../../../../../app/session/SessionClerk.js'

import AccessTokenRenewalRateLimit from '../../../../../../../../app/tools/rateLimit/limits/AccessTokenRenewalRateLimit.js'

import StaffMemberAccessToken from '../../../../../../../../sequelize/models/StaffMemberAccessToken.js'
import StaffMemberRefreshToken from '../../../../../../../../sequelize/models/StaffMemberRefreshToken.js'

import RefreshTokenExpressCookieClerk from '../../../../../../../../server/graphql/contexts/tools/RefreshTokenExpressCookieClerk.js'

import RenewAccessTokenMutationResolver from '../../../../../../../../server/graphql/resolvers/staff/actual/mutations/RenewAccessTokenMutationResolver.js'

/*
 * The members that write nothing. `#resolve()` and everything it persists — the rotation, the
 * series revocation a refused cookie costs, and the renewal limit read against real rows — live
 * in `tests/_orders/RenewAccessTokenMutationResolver/`.
 *
 * The operation takes no argument, so an instance method with no parameters is varied by the
 * instance instead: each case creates the resolver with a different stand-in error code, so it
 * holds a different `errorHash`.
 */

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
     * One code for every dead credential state, and a second one for the policy refusal alone.
     * Spec section 10 requires an absent, expired, revoked or already spent refresh token to be
     * refused identically, so a second code among the four would be the defect; "too frequent" is
     * not one of the four and carries its own.
     */
    test('to hold one refusal for the credential and one for the limit', () => {
      const expected = {
        RefreshTokenUnavailable: '204.M003.001',
        TooFrequentRenewal: '204.M003.002',
      }

      const actual = RenewAccessTokenMutationResolver.errorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('.get:AccessTokenRenewalRateLimitCtor', () => {
    test('to be the renewal rate limit class', () => {
      const actual = RenewAccessTokenMutationResolver.AccessTokenRenewalRateLimitCtor

      expect(actual)
        .toBe(AccessTokenRenewalRateLimit) // same reference
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('.get:RefreshTokenExpressCookieClerkCtor', () => {
    test('to be the cookie clerk class', () => {
      const actual = RenewAccessTokenMutationResolver.RefreshTokenExpressCookieClerkCtor

      expect(actual)
        .toBe(RefreshTokenExpressCookieClerk) // same reference
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('.get:SessionClerkCtor', () => {
    test('to be the session clerk class', () => {
      const actual = RenewAccessTokenMutationResolver.SessionClerkCtor

      expect(actual)
        .toBe(SessionClerk) // same reference
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('.get:StaffMemberAccessTokenCtor', () => {
    test('to be the staff access token model', () => {
      const actual = RenewAccessTokenMutationResolver.StaffMemberAccessTokenCtor

      expect(actual)
        .toBe(StaffMemberAccessToken) // same reference
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('.get:StaffMemberRefreshTokenCtor', () => {
    test('to be the staff refresh token model', () => {
      const actual = RenewAccessTokenMutationResolver.StaffMemberRefreshTokenCtor

      expect(actual)
        .toBe(StaffMemberRefreshToken) // same reference
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('#createRefreshTokenCookieClerk()', () => {
    describe('should build a cookie clerk of the request it is handed', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M003.001',
            },
          },
          params: {
            context: /** @type {*} */ ({
              label: 'a request presenting a cookie',
            }),
          },
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M003.002',
            },
          },
          params: {
            context: /** @type {*} */ ({
              label: 'a request presenting no cookie',
            }),
          },
        },
      ]

      test.each(cases)('context.label: $params.context.label', ({
        factoryParams,
        params,
      }) => {
        const resolver = RenewAccessTokenMutationResolver.create(factoryParams)

        const actual = resolver.createRefreshTokenCookieClerk(params)

        expect(actual)
          .toBeInstanceOf(RefreshTokenExpressCookieClerk)
      })
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('#createRefreshTokenCookieClerk()', () => {
    describe('should hand the clerk the context of this request', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M003.001',
            },
          },
          params: {
            context: /** @type {*} */ ({
              label: 'a request presenting a cookie',
            }),
          },
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M003.002',
            },
          },
          params: {
            context: /** @type {*} */ ({
              label: 'a request presenting no cookie',
            }),
          },
        },
      ]

      test.each(cases)('context.label: $params.context.label', ({
        factoryParams,
        params,
      }) => {
        const resolver = RenewAccessTokenMutationResolver.create(factoryParams)

        const actual = resolver.createRefreshTokenCookieClerk(params)

        expect(actual)
          .toHaveProperty('context', params.context)
      })
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('#createSessionClerk()', () => {
    describe('should build a session clerk', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M003.001',
            },
          },
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M003.002',
            },
          },
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', ({
        factoryParams,
      }) => {
        const resolver = RenewAccessTokenMutationResolver.create(factoryParams)

        const actual = resolver.createSessionClerk()

        expect(actual)
          .toBeInstanceOf(SessionClerk)
      })
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('#createSessionClerk()', () => {
    /*
     * The staff pair and not another audience's: a clerk handed the wrong models would read and
     * rotate somebody else's sessions while looking like it worked.
     */
    describe('should hand the clerk the staff token models', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M003.001',
            },
          },
          expected: expect.objectContaining({
            AccessTokenModel: StaffMemberAccessToken,
            RefreshTokenModel: StaffMemberRefreshToken,
          }),
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M003.002',
            },
          },
          expected: expect.objectContaining({
            AccessTokenModel: StaffMemberAccessToken,
            RefreshTokenModel: StaffMemberRefreshToken,
          }),
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', ({
        factoryParams,
        expected,
      }) => {
        const resolver = RenewAccessTokenMutationResolver.create(factoryParams)

        const actual = resolver.createSessionClerk()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('#createAccessTokenRenewalRateLimit()', () => {
    describe('should build the renewal rate limit', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M003.001',
            },
          },
          params: {
            pointsAt: new Date('2026-09-24T09:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M003.002',
            },
          },
          params: {
            pointsAt: new Date('2026-09-25T10:30:00.000Z'),
          },
        },
      ]

      test.each(cases)('pointsAt: $params.pointsAt', ({
        factoryParams,
        params,
      }) => {
        const resolver = RenewAccessTokenMutationResolver.create(factoryParams)

        const actual = resolver.createAccessTokenRenewalRateLimit(params)

        expect(actual)
          .toBeInstanceOf(AccessTokenRenewalRateLimit)
      })
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('#createAccessTokenRenewalRateLimit()', () => {
    /*
     * The window ends at the request's own instant, never at whatever the clock says inside the
     * limit: one request asks every question of one clock.
     */
    describe('should end the window at the instant it is handed', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M003.001',
            },
          },
          params: {
            pointsAt: new Date('2026-09-26T09:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M003.002',
            },
          },
          params: {
            pointsAt: new Date('2026-09-27T10:30:00.000Z'),
          },
        },
      ]

      test.each(cases)('pointsAt: $params.pointsAt', ({
        factoryParams,
        params,
      }) => {
        const resolver = RenewAccessTokenMutationResolver.create(factoryParams)

        const actual = resolver.createAccessTokenRenewalRateLimit(params)

        expect(actual)
          .toHaveProperty('pointsAt', params.pointsAt)
      })
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('#hasReachedRenewalLimit()', () => {
    /*
     * Read against the real table, which holds no refresh token of these series at all — a series
     * that renewed nothing inside the hour may renew.
     */
    describe('should refuse nothing to a series that renewed nothing in the window', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M003.001',
            },
          },
          params: {
            sessionKey: 'renew-resolver-unused-series-0001',
            pointsAt: new Date('2026-09-28T09:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M003.002',
            },
          },
          params: {
            sessionKey: 'renew-resolver-unused-series-0002',
            pointsAt: new Date('2026-09-29T10:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('sessionKey: $params.sessionKey', async ({
        factoryParams,
        params,
      }) => {
        const resolver = RenewAccessTokenMutationResolver.create(factoryParams)

        const actual = await resolver.hasReachedRenewalLimit(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('#hasReachedRenewalLimit()', () => {
    /*
     * Sixty rows in one hour is not arrangeable as readable fixtures, so the count alone is
     * steered and everything around it stays real: the threshold of sixty is the limit's own
     * (asserted in `tests/__tests__/app/tools/rateLimit/limits/AccessTokenRenewalRateLimit.js`),
     * the "at or over" comparison is the base class's, and the assertion below on what the count
     * was asked for is what proves the limit is keyed on the presented series and on no other.
     */
    describe('should refuse a series that already renewed as often as the hour allows', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M003.001',
            },
          },
          params: {
            sessionKey: 'renew-resolver-busy-series-0001',
            pointsAt: new Date('2026-09-30T09:00:00.000Z'),
          },
          mockRecentEventCount: 60,
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M003.002',
            },
          },
          params: {
            sessionKey: 'renew-resolver-busy-series-0002',
            pointsAt: new Date('2026-10-01T10:00:00.000Z'),
          },
          mockRecentEventCount: 61,
        },
      ]

      test.each(cases)('sessionKey: $params.sessionKey', async ({
        factoryParams,
        params,
        mockRecentEventCount,
      }) => {
        const resolver = RenewAccessTokenMutationResolver.create(factoryParams)
        const countSpy = jest.spyOn(AccessTokenRenewalRateLimit.prototype, 'countRecentEvents')
          .mockResolvedValue(mockRecentEventCount)

        const actual = await resolver.hasReachedRenewalLimit(params)

        expect(actual)
          .toBeTruthy()
        expect(countSpy)
          .toHaveBeenCalledWith({
            key: params.sessionKey,
          })
      })
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('#formatResponse()', () => {
    /*
     * The access token and nothing else. A response carrying the refresh token, its digest or the
     * series would break spec sections 9.7 and 7 at once, so the whole returned object is
     * compared rather than the one field read off it.
     */
    describe('should answer with the freshly issued access token alone', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M003.001',
            },
          },
          params: {
            accessTokenEntity: /** @type {*} */ ({
              accessToken: 'renewed-access-token-0001',
              sessionKey: 'renew-resolver-formatted-series-0001',
            }),
          },
          expected: {
            accessToken: 'renewed-access-token-0001',
          },
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M003.002',
            },
          },
          params: {
            accessTokenEntity: /** @type {*} */ ({
              accessToken: 'renewed-access-token-0002',
              sessionKey: 'renew-resolver-formatted-series-0002',
            }),
          },
          expected: {
            accessToken: 'renewed-access-token-0002',
          },
        },
      ]

      test.each(cases)('accessTokenEntity.accessToken: $params.accessTokenEntity.accessToken', ({
        factoryParams,
        params,
        expected,
      }) => {
        const resolver = RenewAccessTokenMutationResolver.create(factoryParams)

        const actual = resolver.formatResponse(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
