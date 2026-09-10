import SignInFailureRateLimit from '../../../app/tools/rateLimit/limits/SignInFailureRateLimit.js'

import SignInAttempt from '../../../sequelize/models/SignInAttempt.js'
import StaffMemberRefreshToken from '../../../sequelize/models/StaffMemberRefreshToken.js'

describe('SignInFailureRateLimit', () => {
  describe('#countRecentEvents()', () => {
    describe('should count the failures inside the window, whatever case they were typed in', () => {
      // The rows land lower cased, so a count taken on the address as typed has to normalize
      // first or it counts against a value no row holds.
      const cases = [
        {
          factoryParams: {
            pointsAt: new Date('2026-09-20T09:00:00.000Z'),
          },
          params: {
            key: 'Nadia@Example.com',
            attempts: [
              {
                id: 10100201,
                email: 'nadia@example.com',
                attemptedAt: new Date('2026-09-20T08:59:00.000Z'),
              },
              {
                id: 10100202,
                email: 'NADIA@EXAMPLE.COM',
                attemptedAt: new Date('2026-09-20T08:46:00.000Z'),
              },
              {
                id: 10100203,
                email: 'Nadia@Example.com',
                attemptedAt: new Date('2026-09-20T08:50:00.000Z'),
              },
              {
                id: 10100204,
                email: 'nadia@example.com',
                attemptedAt: new Date('2026-09-20T08:44:00.000Z'),
              },
            ],
          },
          expected: 3,
        },
        {
          factoryParams: {
            pointsAt: new Date('2026-09-21T14:00:00.000Z'),
          },
          params: {
            key: 'Paola@Example.com',
            attempts: [
              {
                id: 10100205,
                email: 'paola@example.com',
                attemptedAt: new Date('2026-09-21T13:45:00.000Z'),
              },
              {
                id: 10100206,
                email: 'PAOLA@Example.com',
                attemptedAt: new Date('2026-09-21T13:44:59.999Z'),
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
        await SignInAttempt.bulkCreate(params.attempts)
        const rateLimit = SignInFailureRateLimit.create(factoryParams)

        const actual = await rateLimit.countRecentEvents({
          key: params.key,
        })

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('SignInFailureRateLimit', () => {
  describe('#countRecentEvents()', () => {
    describe('should count nothing for an address that failed nothing in the window', () => {
      const cases = [
        {
          factoryParams: {
            pointsAt: new Date('2026-09-22T09:00:00.000Z'),
          },
          params: {
            key: 'Quirino@Example.com',
          },
          expected: 0,
        },
        {
          factoryParams: {
            pointsAt: new Date('2026-09-22T10:00:00.000Z'),
          },
          params: {
            key: 'Rosa@Example.com',
          },
          expected: 0,
        },
      ]

      test.each(cases)('key: $params.key', async ({
        factoryParams,
        params,
        expected,
      }) => {
        const rateLimit = SignInFailureRateLimit.create(factoryParams)

        const actual = await rateLimit.countRecentEvents({
          key: params.key,
        })

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('SignInFailureRateLimit', () => {
  describe('#hasReachedMaxEventCount()', () => {
    describe('should refuse an eleventh failure for the same address inside fifteen minutes', () => {
      const cases = [
        {
          factoryParams: {
            pointsAt: new Date('2026-09-23T09:00:00.000Z'),
          },
          params: {
            key: 'Sofia@Example.com',
            attempts: [
              {
                id: 10100211,
                email: 'sofia@example.com',
                attemptedAt: new Date('2026-09-23T08:46:00.000Z'),
              },
              {
                id: 10100212,
                email: 'sofia@example.com',
                attemptedAt: new Date('2026-09-23T08:47:00.000Z'),
              },
              {
                id: 10100213,
                email: 'sofia@example.com',
                attemptedAt: new Date('2026-09-23T08:48:00.000Z'),
              },
              {
                id: 10100214,
                email: 'sofia@example.com',
                attemptedAt: new Date('2026-09-23T08:49:00.000Z'),
              },
              {
                id: 10100215,
                email: 'sofia@example.com',
                attemptedAt: new Date('2026-09-23T08:50:00.000Z'),
              },
              {
                id: 10100216,
                email: 'sofia@example.com',
                attemptedAt: new Date('2026-09-23T08:51:00.000Z'),
              },
              {
                id: 10100217,
                email: 'sofia@example.com',
                attemptedAt: new Date('2026-09-23T08:52:00.000Z'),
              },
              {
                id: 10100218,
                email: 'sofia@example.com',
                attemptedAt: new Date('2026-09-23T08:53:00.000Z'),
              },
              {
                id: 10100219,
                email: 'sofia@example.com',
                attemptedAt: new Date('2026-09-23T08:54:00.000Z'),
              },
              {
                id: 10100220,
                email: 'sofia@example.com',
                attemptedAt: new Date('2026-09-23T08:55:00.000Z'),
              },
            ],
          },
        },
      ]

      test.each(cases)('key: $params.key', async ({
        factoryParams,
        params,
      }) => {
        await SignInAttempt.bulkCreate(params.attempts)
        const rateLimit = SignInFailureRateLimit.create(factoryParams)

        const actual = await rateLimit.hasReachedMaxEventCount({
          key: params.key,
        })

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('SignInFailureRateLimit', () => {
  describe('#hasReachedMaxEventCount()', () => {
    describe('should let a tenth failure for the same address through', () => {
      // Nine already counted, so the tenth is the last one section 7 allows.
      const cases = [
        {
          factoryParams: {
            pointsAt: new Date('2026-09-24T09:00:00.000Z'),
          },
          params: {
            key: 'Teresa@Example.com',
            attempts: [
              {
                id: 10100221,
                email: 'teresa@example.com',
                attemptedAt: new Date('2026-09-24T08:46:00.000Z'),
              },
              {
                id: 10100222,
                email: 'teresa@example.com',
                attemptedAt: new Date('2026-09-24T08:47:00.000Z'),
              },
              {
                id: 10100223,
                email: 'teresa@example.com',
                attemptedAt: new Date('2026-09-24T08:48:00.000Z'),
              },
              {
                id: 10100224,
                email: 'teresa@example.com',
                attemptedAt: new Date('2026-09-24T08:49:00.000Z'),
              },
              {
                id: 10100225,
                email: 'teresa@example.com',
                attemptedAt: new Date('2026-09-24T08:50:00.000Z'),
              },
              {
                id: 10100226,
                email: 'teresa@example.com',
                attemptedAt: new Date('2026-09-24T08:51:00.000Z'),
              },
              {
                id: 10100227,
                email: 'teresa@example.com',
                attemptedAt: new Date('2026-09-24T08:52:00.000Z'),
              },
              {
                id: 10100228,
                email: 'teresa@example.com',
                attemptedAt: new Date('2026-09-24T08:53:00.000Z'),
              },
              {
                id: 10100229,
                email: 'teresa@example.com',
                attemptedAt: new Date('2026-09-24T08:54:00.000Z'),
              },
            ],
          },
        },
      ]

      test.each(cases)('key: $params.key', async ({
        factoryParams,
        params,
      }) => {
        await SignInAttempt.bulkCreate(params.attempts)
        const rateLimit = SignInFailureRateLimit.create(factoryParams)

        const actual = await rateLimit.hasReachedMaxEventCount({
          key: params.key,
        })

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('SignInFailureRateLimit', () => {
  describe('#hasReachedMaxEventCount()', () => {
    describe('should refuse nothing to a different address in the same window', () => {
      // Ten failures for one address, and a first attempt for another one inside the same
      // fifteen minutes. Keyed on the caller's IP address instead, this would be refused - and
      // one person's wrong password would lock out the whole office.
      const cases = [
        {
          factoryParams: {
            pointsAt: new Date('2026-09-25T09:00:00.000Z'),
          },
          params: {
            key: 'Valeria@Example.com',
            attempts: [
              {
                id: 10100231,
                email: 'ugo@example.com',
                attemptedAt: new Date('2026-09-25T08:46:00.000Z'),
              },
              {
                id: 10100232,
                email: 'ugo@example.com',
                attemptedAt: new Date('2026-09-25T08:47:00.000Z'),
              },
              {
                id: 10100233,
                email: 'ugo@example.com',
                attemptedAt: new Date('2026-09-25T08:48:00.000Z'),
              },
              {
                id: 10100234,
                email: 'ugo@example.com',
                attemptedAt: new Date('2026-09-25T08:49:00.000Z'),
              },
              {
                id: 10100235,
                email: 'ugo@example.com',
                attemptedAt: new Date('2026-09-25T08:50:00.000Z'),
              },
              {
                id: 10100236,
                email: 'ugo@example.com',
                attemptedAt: new Date('2026-09-25T08:51:00.000Z'),
              },
              {
                id: 10100237,
                email: 'ugo@example.com',
                attemptedAt: new Date('2026-09-25T08:52:00.000Z'),
              },
              {
                id: 10100238,
                email: 'ugo@example.com',
                attemptedAt: new Date('2026-09-25T08:53:00.000Z'),
              },
              {
                id: 10100239,
                email: 'ugo@example.com',
                attemptedAt: new Date('2026-09-25T08:54:00.000Z'),
              },
              {
                id: 10100240,
                email: 'ugo@example.com',
                attemptedAt: new Date('2026-09-25T08:55:00.000Z'),
              },
            ],
          },
        },
      ]

      test.each(cases)('key: $params.key', async ({
        factoryParams,
        params,
      }) => {
        await SignInAttempt.bulkCreate(params.attempts)
        const rateLimit = SignInFailureRateLimit.create(factoryParams)

        const actual = await rateLimit.hasReachedMaxEventCount({
          key: params.key,
        })

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('SignInFailureRateLimit', () => {
  describe('#hasReachedMaxEventCount()', () => {
    describe('should refuse nothing to an address whose window holds ten successful sign-ins', () => {
      // A successful sign-in writes no row in sign_in_attempts (spec section 10.3); what it does
      // write is a refresh token. Ten of those in the window, no failure among them, and the
      // eleventh sign-in is refused nothing.
      const cases = [
        {
          factoryParams: {
            pointsAt: new Date('2026-09-26T09:00:00.000Z'),
          },
          params: {
            key: 'Zara@Example.com',
            refreshTokens: [
              {
                id: 10100241,
                StaffMemberId: 10100200,
                tokenHash: 'sign-in-failure-limit-token-hash-0001',
                sessionKey: 'sign-in-failure-limit-series-0001',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T08:46:00.000Z'),
                expiredAt: new Date('2026-10-10T08:46:00.000Z'),
              },
              {
                id: 10100242,
                StaffMemberId: 10100200,
                tokenHash: 'sign-in-failure-limit-token-hash-0002',
                sessionKey: 'sign-in-failure-limit-series-0002',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T08:47:00.000Z'),
                expiredAt: new Date('2026-10-10T08:47:00.000Z'),
              },
              {
                id: 10100243,
                StaffMemberId: 10100200,
                tokenHash: 'sign-in-failure-limit-token-hash-0003',
                sessionKey: 'sign-in-failure-limit-series-0003',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T08:48:00.000Z'),
                expiredAt: new Date('2026-10-10T08:48:00.000Z'),
              },
              {
                id: 10100244,
                StaffMemberId: 10100200,
                tokenHash: 'sign-in-failure-limit-token-hash-0004',
                sessionKey: 'sign-in-failure-limit-series-0004',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T08:49:00.000Z'),
                expiredAt: new Date('2026-10-10T08:49:00.000Z'),
              },
              {
                id: 10100245,
                StaffMemberId: 10100200,
                tokenHash: 'sign-in-failure-limit-token-hash-0005',
                sessionKey: 'sign-in-failure-limit-series-0005',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T08:50:00.000Z'),
                expiredAt: new Date('2026-10-10T08:50:00.000Z'),
              },
              {
                id: 10100246,
                StaffMemberId: 10100200,
                tokenHash: 'sign-in-failure-limit-token-hash-0006',
                sessionKey: 'sign-in-failure-limit-series-0006',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T08:51:00.000Z'),
                expiredAt: new Date('2026-10-10T08:51:00.000Z'),
              },
              {
                id: 10100247,
                StaffMemberId: 10100200,
                tokenHash: 'sign-in-failure-limit-token-hash-0007',
                sessionKey: 'sign-in-failure-limit-series-0007',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T08:52:00.000Z'),
                expiredAt: new Date('2026-10-10T08:52:00.000Z'),
              },
              {
                id: 10100248,
                StaffMemberId: 10100200,
                tokenHash: 'sign-in-failure-limit-token-hash-0008',
                sessionKey: 'sign-in-failure-limit-series-0008',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T08:53:00.000Z'),
                expiredAt: new Date('2026-10-10T08:53:00.000Z'),
              },
              {
                id: 10100249,
                StaffMemberId: 10100200,
                tokenHash: 'sign-in-failure-limit-token-hash-0009',
                sessionKey: 'sign-in-failure-limit-series-0009',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T08:54:00.000Z'),
                expiredAt: new Date('2026-10-10T08:54:00.000Z'),
              },
              {
                id: 10100250,
                StaffMemberId: 10100200,
                tokenHash: 'sign-in-failure-limit-token-hash-0010',
                sessionKey: 'sign-in-failure-limit-series-0010',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T08:55:00.000Z'),
                expiredAt: new Date('2026-10-10T08:55:00.000Z'),
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
        const rateLimit = SignInFailureRateLimit.create(factoryParams)

        const actual = await rateLimit.hasReachedMaxEventCount({
          key: params.key,
        })

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})
