/*
 * The seeded rows carry NO explicit `id`, and that is deliberate.
 *
 * `sign_in_attempts` is a table the product itself writes — signIn records a refused attempt — with an
 * auto-incremented id, which is `max(id) + 1`. `tests/_orders/` suites share one database and jest
 * runs them concurrently, so an explicit id inserted here sets the max that the product's next
 * insert takes, and that insert takes the id the next case in this file wanted. The run then fails
 * with a UNIQUE violation on a row nothing else had written, on whichever case lost the race.
 *
 * No id block can fix it: the block's own first insert is what hands the auto-increment writer the
 * block's second id. The ids are left to the database, and these cases never needed one — each is
 * told apart by its key, and isolated from the product's own rows by using an address of its own.
 */

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
                email: 'nadia@example.com',
                attemptedAt: new Date('2026-09-20T08:59:00.000Z'),
              },
              {
                email: 'NADIA@EXAMPLE.COM',
                attemptedAt: new Date('2026-09-20T08:46:00.000Z'),
              },
              {
                email: 'Nadia@Example.com',
                attemptedAt: new Date('2026-09-20T08:50:00.000Z'),
              },
              {
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
                email: 'paola@example.com',
                attemptedAt: new Date('2026-09-21T13:45:00.000Z'),
              },
              {
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
                email: 'sofia@example.com',
                attemptedAt: new Date('2026-09-23T08:46:00.000Z'),
              },
              {
                email: 'sofia@example.com',
                attemptedAt: new Date('2026-09-23T08:47:00.000Z'),
              },
              {
                email: 'sofia@example.com',
                attemptedAt: new Date('2026-09-23T08:48:00.000Z'),
              },
              {
                email: 'sofia@example.com',
                attemptedAt: new Date('2026-09-23T08:49:00.000Z'),
              },
              {
                email: 'sofia@example.com',
                attemptedAt: new Date('2026-09-23T08:50:00.000Z'),
              },
              {
                email: 'sofia@example.com',
                attemptedAt: new Date('2026-09-23T08:51:00.000Z'),
              },
              {
                email: 'sofia@example.com',
                attemptedAt: new Date('2026-09-23T08:52:00.000Z'),
              },
              {
                email: 'sofia@example.com',
                attemptedAt: new Date('2026-09-23T08:53:00.000Z'),
              },
              {
                email: 'sofia@example.com',
                attemptedAt: new Date('2026-09-23T08:54:00.000Z'),
              },
              {
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
                email: 'teresa@example.com',
                attemptedAt: new Date('2026-09-24T08:46:00.000Z'),
              },
              {
                email: 'teresa@example.com',
                attemptedAt: new Date('2026-09-24T08:47:00.000Z'),
              },
              {
                email: 'teresa@example.com',
                attemptedAt: new Date('2026-09-24T08:48:00.000Z'),
              },
              {
                email: 'teresa@example.com',
                attemptedAt: new Date('2026-09-24T08:49:00.000Z'),
              },
              {
                email: 'teresa@example.com',
                attemptedAt: new Date('2026-09-24T08:50:00.000Z'),
              },
              {
                email: 'teresa@example.com',
                attemptedAt: new Date('2026-09-24T08:51:00.000Z'),
              },
              {
                email: 'teresa@example.com',
                attemptedAt: new Date('2026-09-24T08:52:00.000Z'),
              },
              {
                email: 'teresa@example.com',
                attemptedAt: new Date('2026-09-24T08:53:00.000Z'),
              },
              {
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
                email: 'ugo@example.com',
                attemptedAt: new Date('2026-09-25T08:46:00.000Z'),
              },
              {
                email: 'ugo@example.com',
                attemptedAt: new Date('2026-09-25T08:47:00.000Z'),
              },
              {
                email: 'ugo@example.com',
                attemptedAt: new Date('2026-09-25T08:48:00.000Z'),
              },
              {
                email: 'ugo@example.com',
                attemptedAt: new Date('2026-09-25T08:49:00.000Z'),
              },
              {
                email: 'ugo@example.com',
                attemptedAt: new Date('2026-09-25T08:50:00.000Z'),
              },
              {
                email: 'ugo@example.com',
                attemptedAt: new Date('2026-09-25T08:51:00.000Z'),
              },
              {
                email: 'ugo@example.com',
                attemptedAt: new Date('2026-09-25T08:52:00.000Z'),
              },
              {
                email: 'ugo@example.com',
                attemptedAt: new Date('2026-09-25T08:53:00.000Z'),
              },
              {
                email: 'ugo@example.com',
                attemptedAt: new Date('2026-09-25T08:54:00.000Z'),
              },
              {
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
                StaffMemberId: 10100200,
                tokenHash: 'sign-in-failure-limit-token-hash-0001',
                sessionKey: 'sign-in-failure-limit-series-0001',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T08:46:00.000Z'),
                expiredAt: new Date('2026-10-10T08:46:00.000Z'),
              },
              {
                StaffMemberId: 10100200,
                tokenHash: 'sign-in-failure-limit-token-hash-0002',
                sessionKey: 'sign-in-failure-limit-series-0002',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T08:47:00.000Z'),
                expiredAt: new Date('2026-10-10T08:47:00.000Z'),
              },
              {
                StaffMemberId: 10100200,
                tokenHash: 'sign-in-failure-limit-token-hash-0003',
                sessionKey: 'sign-in-failure-limit-series-0003',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T08:48:00.000Z'),
                expiredAt: new Date('2026-10-10T08:48:00.000Z'),
              },
              {
                StaffMemberId: 10100200,
                tokenHash: 'sign-in-failure-limit-token-hash-0004',
                sessionKey: 'sign-in-failure-limit-series-0004',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T08:49:00.000Z'),
                expiredAt: new Date('2026-10-10T08:49:00.000Z'),
              },
              {
                StaffMemberId: 10100200,
                tokenHash: 'sign-in-failure-limit-token-hash-0005',
                sessionKey: 'sign-in-failure-limit-series-0005',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T08:50:00.000Z'),
                expiredAt: new Date('2026-10-10T08:50:00.000Z'),
              },
              {
                StaffMemberId: 10100200,
                tokenHash: 'sign-in-failure-limit-token-hash-0006',
                sessionKey: 'sign-in-failure-limit-series-0006',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T08:51:00.000Z'),
                expiredAt: new Date('2026-10-10T08:51:00.000Z'),
              },
              {
                StaffMemberId: 10100200,
                tokenHash: 'sign-in-failure-limit-token-hash-0007',
                sessionKey: 'sign-in-failure-limit-series-0007',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T08:52:00.000Z'),
                expiredAt: new Date('2026-10-10T08:52:00.000Z'),
              },
              {
                StaffMemberId: 10100200,
                tokenHash: 'sign-in-failure-limit-token-hash-0008',
                sessionKey: 'sign-in-failure-limit-series-0008',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T08:53:00.000Z'),
                expiredAt: new Date('2026-10-10T08:53:00.000Z'),
              },
              {
                StaffMemberId: 10100200,
                tokenHash: 'sign-in-failure-limit-token-hash-0009',
                sessionKey: 'sign-in-failure-limit-series-0009',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T08:54:00.000Z'),
                expiredAt: new Date('2026-10-10T08:54:00.000Z'),
              },
              {
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
