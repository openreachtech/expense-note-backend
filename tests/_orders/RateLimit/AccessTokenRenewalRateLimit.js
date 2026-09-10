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
                id: 10100301,
                StaffMemberId: 10100300,
                tokenHash: 'renewal-limit-token-hash-0001',
                sessionKey: 'renewal-limit-series-0001',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-20T08:50:00.000Z'),
                expiredAt: new Date('2026-10-04T08:50:00.000Z'),
              },
              {
                id: 10100302,
                StaffMemberId: 10100300,
                tokenHash: 'renewal-limit-token-hash-0002',
                sessionKey: 'renewal-limit-series-0001',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-20T08:01:00.000Z'),
                expiredAt: new Date('2026-10-04T08:01:00.000Z'),
              },
              {
                id: 10100303,
                StaffMemberId: 10100300,
                tokenHash: 'renewal-limit-token-hash-0003',
                sessionKey: 'renewal-limit-series-0001',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-20T07:59:00.000Z'),
                expiredAt: new Date('2026-10-04T07:59:00.000Z'),
              },
              {
                id: 10100304,
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
                id: 10100311,
                StaffMemberId: 10100310,
                tokenHash: 'renewal-limit-token-hash-0011',
                sessionKey: 'renewal-limit-series-0003',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-21T14:00:00.000Z'),
                expiredAt: new Date('2026-10-05T14:00:00.000Z'),
              },
              {
                id: 10100312,
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
                id: 10100321,
                StaffMemberId: 10100320,
                tokenHash: 'renewal-limit-token-hash-0021',
                sessionKey: 'renewal-limit-series-0006',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-23T08:15:00.000Z'),
                expiredAt: new Date('2026-10-07T08:15:00.000Z'),
              },
              {
                id: 10100322,
                StaffMemberId: 10100320,
                tokenHash: 'renewal-limit-token-hash-0022',
                sessionKey: 'renewal-limit-series-0006',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-23T08:30:00.000Z'),
                expiredAt: new Date('2026-10-07T08:30:00.000Z'),
              },
              {
                id: 10100323,
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
