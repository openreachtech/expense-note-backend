/*
 * The seeded rows carry NO explicit `id`, and that is deliberate.
 *
 * `staff_member_refresh_tokens` is a table the product itself writes — signIn and renewAccessToken mint a refresh token — with an
 * auto-incremented id, which is `max(id) + 1`. `tests/_orders/` suites share one database and jest
 * runs them concurrently, so an explicit id inserted here sets the max that the product's next
 * insert takes, and that insert takes the id the next case in this file wanted. The run then fails
 * with a UNIQUE violation on a row nothing else had written, on whichever case lost the race.
 *
 * No id block can fix it: the block's own first insert is what hands the auto-increment writer the
 * block's second id. The ids are left to the database, and these cases never needed one — each is
 * told apart by its key, and isolated from the product's own rows by using an address of its own.
 */

import AccessTokenRenewalRateLimit from '../../../app/tools/rateLimit/limits/AccessTokenRenewalRateLimit.js'

import StaffMemberRefreshToken from '../../../sequelize/models/StaffMemberRefreshToken.js'

describe('AccessTokenRenewalRateLimit', () => {
  describe('#countRecentEvents()', () => {
    describe('should count one series rows inside the window and no other series', () => {
      const cases = [
        {
          factoryParams: {
            pointsAt: new Date('2026-09-20T09:00:00.000Z'),
          },
          params: {
            key: 'renewal-limit-series-0001',
            refreshTokens: [
              {
                StaffMemberId: 10100300,
                tokenHash: 'renewal-limit-token-hash-0001',
                sessionKey: 'renewal-limit-series-0001',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-20T08:50:00.000Z'),
                expiredAt: new Date('2026-10-04T08:50:00.000Z'),
              },
              {
                StaffMemberId: 10100300,
                tokenHash: 'renewal-limit-token-hash-0002',
                sessionKey: 'renewal-limit-series-0001',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-20T08:01:00.000Z'),
                expiredAt: new Date('2026-10-04T08:01:00.000Z'),
              },
              {
                StaffMemberId: 10100300,
                tokenHash: 'renewal-limit-token-hash-0003',
                sessionKey: 'renewal-limit-series-0001',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-20T07:59:00.000Z'),
                expiredAt: new Date('2026-10-04T07:59:00.000Z'),
              },
              {
                StaffMemberId: 10100300,
                tokenHash: 'renewal-limit-token-hash-0004',
                sessionKey: 'renewal-limit-series-0002',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-20T08:55:00.000Z'),
                expiredAt: new Date('2026-10-04T08:55:00.000Z'),
              },
            ],
          },
          expected: 2,
        },
        {
          factoryParams: {
            pointsAt: new Date('2026-09-21T15:00:00.000Z'),
          },
          params: {
            key: 'renewal-limit-series-0003',
            refreshTokens: [
              {
                StaffMemberId: 10100310,
                tokenHash: 'renewal-limit-token-hash-0011',
                sessionKey: 'renewal-limit-series-0003',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-21T14:00:00.000Z'),
                expiredAt: new Date('2026-10-05T14:00:00.000Z'),
              },
              {
                StaffMemberId: 10100310,
                tokenHash: 'renewal-limit-token-hash-0012',
                sessionKey: 'renewal-limit-series-0003',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-21T13:59:59.999Z'),
                expiredAt: new Date('2026-10-05T13:59:59.999Z'),
              },
            ],
          },
          expected: 1,
        },
      ]

      test.each(cases)('key: $params.key', async ({
        factoryParams,
        params,
        expected,
      }) => {
        await StaffMemberRefreshToken.bulkCreate(params.refreshTokens)
        const rateLimit = AccessTokenRenewalRateLimit.create(factoryParams)

        const actual = await rateLimit.countRecentEvents({
          key: params.key,
        })

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AccessTokenRenewalRateLimit', () => {
  describe('#countRecentEvents()', () => {
    describe('should count nothing for a series that renewed nothing in the window', () => {
      const cases = [
        {
          factoryParams: {
            pointsAt: new Date('2026-09-22T09:00:00.000Z'),
          },
          params: {
            key: 'renewal-limit-series-0004',
          },
          expected: 0,
        },
        {
          factoryParams: {
            pointsAt: new Date('2026-09-22T11:00:00.000Z'),
          },
          params: {
            key: 'renewal-limit-series-0005',
          },
          expected: 0,
        },
      ]

      test.each(cases)('key: $params.key', async ({
        factoryParams,
        params,
        expected,
      }) => {
        const rateLimit = AccessTokenRenewalRateLimit.create(factoryParams)

        const actual = await rateLimit.countRecentEvents({
          key: params.key,
        })

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AccessTokenRenewalRateLimit', () => {
  describe('#hasReachedMaxEventCount()', () => {
    describe('should refuse nothing to a series renewing at the rate a client renews', () => {
      // Three rows in the hour is what one access token expiring every fifteen minutes costs.
      // Section 7 allows sixty, so this is nowhere near it.
      const cases = [
        {
          factoryParams: {
            pointsAt: new Date('2026-09-23T09:00:00.000Z'),
          },
          params: {
            key: 'renewal-limit-series-0006',
            refreshTokens: [
              {
                StaffMemberId: 10100320,
                tokenHash: 'renewal-limit-token-hash-0021',
                sessionKey: 'renewal-limit-series-0006',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-23T08:15:00.000Z'),
                expiredAt: new Date('2026-10-07T08:15:00.000Z'),
              },
              {
                StaffMemberId: 10100320,
                tokenHash: 'renewal-limit-token-hash-0022',
                sessionKey: 'renewal-limit-series-0006',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-23T08:30:00.000Z'),
                expiredAt: new Date('2026-10-07T08:30:00.000Z'),
              },
              {
                StaffMemberId: 10100320,
                tokenHash: 'renewal-limit-token-hash-0023',
                sessionKey: 'renewal-limit-series-0006',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-23T08:45:00.000Z'),
                expiredAt: new Date('2026-10-07T08:45:00.000Z'),
              },
            ],
          },
        },
      ]

      test.each(cases)('key: $params.key', async ({
        factoryParams,
        params,
      }) => {
        await StaffMemberRefreshToken.bulkCreate(params.refreshTokens)
        const rateLimit = AccessTokenRenewalRateLimit.create(factoryParams)

        const actual = await rateLimit.hasReachedMaxEventCount({
          key: params.key,
        })

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})
