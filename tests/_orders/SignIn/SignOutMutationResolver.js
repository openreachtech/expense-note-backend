import SessionClerk from '../../../app/session/SessionClerk.js'
import RevokingSessionResult from '../../../app/session/RevokingSessionResult.js'

import StaffMemberAccessToken from '../../../sequelize/models/StaffMemberAccessToken.js'
import StaffMemberRefreshToken from '../../../sequelize/models/StaffMemberRefreshToken.js'

import SignOutMutationResolver from '../../../server/graphql/resolvers/staff/actual/mutations/SignOutMutationResolver.js'

/*
 * The writing half of the resolver: `#resolve()` revokes a series through `SessionClerk`, and
 * `#revokeSession()` is the wrapper it revokes through. The non-writing members — the getters,
 * `#createRefreshTokenCookieClerk()`, `#findRefreshToken()` and `#formatResponse()` — sit in
 * `tests/__tests__/server/graphql/resolvers/staff/actual/mutations/SignOutMutationResolver.js`.
 *
 * Every session below is minted for real, by `SessionClerk#saveSession()` against a member of
 * staff the development seeder already holds (ids 10110001..10110010): the plain refresh token
 * exists only in the clerk's answer, because the table stores a digest, so it cannot be written
 * as a fixture literal. The session keys carry this unit's reserved id range (10100501..10100550)
 * so a row is traceable to the test that wrote it.
 *
 * The context is a plain fixture rather than a real `StaffGraphqlContext`: the resolver reads
 * `#now` off it and hands the rest to `RefreshTokenExpressCookieClerk`, which reads `#cookieHeader`,
 * `#config` and `#expressResponse` and nothing else. `context.staffMember` is deliberately absent
 * from every fixture — this operation authenticates by the cookie, and a call whose access token
 * has expired carries no member of staff at all.
 */

describe('SignOutMutationResolver', () => {
  describe('#resolve()', () => {
    describe('should report the sign-out as done for a live refresh-token cookie', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            sessionKey: 'session-key-10100501',
            signedInAt: new Date('2026-09-01T09:00:00.000Z'),
            signedOutAt: new Date('2026-09-01T09:10:00.000Z'),
            config: {
              graphqlEndpoint: '/graphql-staff',
              refreshTokenCookie: {
                name: 'test_staff_refresh_token',
                lifetimeDays: 14,
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
              },
            },
          },
          expected: {
            signedOut: true,
          },
        },
        {
          params: {
            staffMemberId: 10110002,
            sessionKey: 'session-key-10100502',
            signedInAt: new Date('2026-09-02T10:00:00.000Z'),
            signedOutAt: new Date('2026-09-15T23:59:00.000Z'), // the last day of the fourteen
            config: {
              graphqlEndpoint: '/graphql-staff',
              refreshTokenCookie: {
                name: 'test_staff_refresh_token',
                lifetimeDays: 14,
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
              },
            },
          },
          expected: {
            signedOut: true,
          },
        },
      ]

      test.each(cases)('sessionKey: $params.sessionKey', async ({
        params,
        expected,
      }) => {
        const sessionClerk = SessionClerk.create({
          AccessTokenModel: StaffMemberAccessToken,
          RefreshTokenModel: StaffMemberRefreshToken,
        })
        const savingResult = await sessionClerk.saveSession({
          userId: params.staffMemberId,
          sessionKey: params.sessionKey,
          now: params.signedInAt,
        })
        const clearCookieSpy = jest.fn()
        const context = /** @type {*} */ ({
          now: params.signedOutAt,
          cookieHeader: `${params.config.refreshTokenCookie.name}=${savingResult.credentialPair.refreshToken}`,
          config: params.config,
          expressResponse: {
            clearCookie: clearCookieSpy,
          },
        })
        const resolver = SignOutMutationResolver.create()

        const actual = await resolver.resolve({
          context,
        })

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * A revoked series with the cookie still in the browser is a cookie that will be presented
     * again and refused, so clearing it is what makes the next visit ask for a sign-in rather
     * than fail a renewal. The attributes have to match the ones the cookie was written with, or
     * the browser keeps the original and the session appears to survive the sign-out.
     */
    describe('should clear the refresh-token cookie', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110003,
            sessionKey: 'session-key-10100503',
            signedInAt: new Date('2026-09-03T09:00:00.000Z'),
            signedOutAt: new Date('2026-09-03T09:10:00.000Z'),
            config: {
              graphqlEndpoint: '/graphql-staff',
              refreshTokenCookie: {
                name: 'test_staff_refresh_token',
                lifetimeDays: 14,
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
              },
            },
          },
          expected: {
            cookieName: 'test_staff_refresh_token',
            attributeHash: {
              httpOnly: true,
              secure: true,
              sameSite: 'lax',
              path: '/graphql-staff',
            },
          },
        },
        {
          params: {
            staffMemberId: 10110004,
            sessionKey: 'session-key-10100504',
            signedInAt: new Date('2026-09-04T09:00:00.000Z'),
            signedOutAt: new Date('2026-09-04T09:10:00.000Z'),
            config: {
              graphqlEndpoint: '/graphql-staff-second-endpoint',
              refreshTokenCookie: {
                name: 'test_staff_refresh_token_second_name',
                lifetimeDays: 7,
                secure: false,
                sameSite: 'lax',
                httpOnly: true,
              },
            },
          },
          expected: {
            cookieName: 'test_staff_refresh_token_second_name',
            attributeHash: {
              httpOnly: true,
              secure: false,
              sameSite: 'lax',
              path: '/graphql-staff-second-endpoint',
            },
          },
        },
      ]

      test.each(cases)('sessionKey: $params.sessionKey', async ({
        params,
        expected,
      }) => {
        const sessionClerk = SessionClerk.create({
          AccessTokenModel: StaffMemberAccessToken,
          RefreshTokenModel: StaffMemberRefreshToken,
        })
        const savingResult = await sessionClerk.saveSession({
          userId: params.staffMemberId,
          sessionKey: params.sessionKey,
          now: params.signedInAt,
        })
        const clearCookieSpy = jest.fn()
        const context = /** @type {*} */ ({
          now: params.signedOutAt,
          cookieHeader: `${params.config.refreshTokenCookie.name}=${savingResult.credentialPair.refreshToken}`,
          config: params.config,
          expressResponse: {
            clearCookie: clearCookieSpy,
          },
        })
        const resolver = SignOutMutationResolver.create()

        await resolver.resolve({
          context,
        })

        expect(clearCookieSpy)
          .toHaveBeenCalledWith(expected.cookieName, expected.attributeHash)
      })
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * Section 10: "a session ... stops working the moment its holder signs out", and section 9.7:
     * "signing out revokes every row sharing it".
     *
     * Two live refresh tokens are minted into one series, and the sign-out presents only the
     * first. What is acted on is the SECOND one, which no call ever presented before: it was live
     * when it was minted, nothing touched it but the sign-out, and it is refused afterwards. So
     * the revocation reached a row other than the one presented, which is what "every row sharing
     * the series" means and what makes the session stop working rather than only that one cookie.
     */
    describe('should revoke every refresh token of the series', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110005,
            sessionKey: 'session-key-10100505',
            firstSignedInAt: new Date('2026-09-05T09:00:00.000Z'),
            secondSignedInAt: new Date('2026-09-05T09:05:00.000Z'),
            signedOutAt: new Date('2026-09-05T09:10:00.000Z'),
            config: {
              graphqlEndpoint: '/graphql-staff',
              refreshTokenCookie: {
                name: 'test_staff_refresh_token',
                lifetimeDays: 14,
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
              },
            },
          },
          expected: '204.M002.001',
        },
        {
          params: {
            staffMemberId: 10110006,
            sessionKey: 'session-key-10100506',
            firstSignedInAt: new Date('2026-09-06T09:00:00.000Z'),
            secondSignedInAt: new Date('2026-09-06T09:05:00.000Z'),
            signedOutAt: new Date('2026-09-06T09:10:00.000Z'),
            config: {
              graphqlEndpoint: '/graphql-staff',
              refreshTokenCookie: {
                name: 'test_staff_refresh_token',
                lifetimeDays: 14,
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
              },
            },
          },
          expected: '204.M002.001',
        },
      ]

      test.each(cases)('sessionKey: $params.sessionKey', async ({
        params,
        expected,
      }) => {
        const sessionClerk = SessionClerk.create({
          AccessTokenModel: StaffMemberAccessToken,
          RefreshTokenModel: StaffMemberRefreshToken,
        })
        const presentedSavingResult = await sessionClerk.saveSession({
          userId: params.staffMemberId,
          sessionKey: params.sessionKey,
          now: params.firstSignedInAt,
        })
        const siblingSavingResult = await sessionClerk.saveSession({
          userId: params.staffMemberId,
          sessionKey: params.sessionKey,
          now: params.secondSignedInAt,
        })
        const clearCookieSpy = jest.fn()
        const resolver = SignOutMutationResolver.create()
        await resolver.resolve({
          context: /** @type {*} */ ({
            now: params.signedOutAt,
            cookieHeader: `${params.config.refreshTokenCookie.name}=${presentedSavingResult.credentialPair.refreshToken}`,
            config: params.config,
            expressResponse: {
              clearCookie: clearCookieSpy,
            },
          }),
        })
        const siblingContext = /** @type {*} */ ({
          now: params.signedOutAt,
          cookieHeader: `${params.config.refreshTokenCookie.name}=${siblingSavingResult.credentialPair.refreshToken}`,
          config: params.config,
          expressResponse: {
            clearCookie: clearCookieSpy,
          },
        })

        const actual = () => resolver.resolve({
          context: siblingContext,
        })

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * Section 7 makes the refresh-token cookie this operation's credential, so a call carrying
     * none is an unauthenticated call and is refused. A live session exists for the member of
     * staff below, so what is refused is the absence of the cookie and not an empty table.
     */
    describe('should refuse a call carrying no refresh-token cookie at all', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110007,
            sessionKey: 'session-key-10100507',
            signedInAt: new Date('2026-09-07T09:00:00.000Z'),
            signedOutAt: new Date('2026-09-07T09:10:00.000Z'),
            config: {
              graphqlEndpoint: '/graphql-staff',
              refreshTokenCookie: {
                name: 'test_staff_refresh_token',
                lifetimeDays: 14,
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
              },
            },
          },
          expected: '204.M002.001',
        },
        {
          params: {
            staffMemberId: 10110008,
            sessionKey: 'session-key-10100508',
            signedInAt: new Date('2026-09-08T09:00:00.000Z'),
            signedOutAt: new Date('2026-09-08T09:10:00.000Z'),
            config: {
              graphqlEndpoint: '/graphql-staff',
              refreshTokenCookie: {
                name: 'test_staff_refresh_token',
                lifetimeDays: 14,
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
              },
            },
          },
          expected: '204.M002.001',
        },
      ]

      test.each(cases)('sessionKey: $params.sessionKey', async ({
        params,
        expected,
      }) => {
        const sessionClerk = SessionClerk.create({
          AccessTokenModel: StaffMemberAccessToken,
          RefreshTokenModel: StaffMemberRefreshToken,
        })
        await sessionClerk.saveSession({
          userId: params.staffMemberId,
          sessionKey: params.sessionKey,
          now: params.signedInAt,
        })
        const clearCookieSpy = jest.fn()
        const context = /** @type {*} */ ({
          now: params.signedOutAt,
          cookieHeader: null,
          config: params.config,
          expressResponse: {
            clearCookie: clearCookieSpy,
          },
        })
        const resolver = SignOutMutationResolver.create()

        const actual = () => resolver.resolve({
          context,
        })

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * A token nobody minted. Refused by the same code as every other dead credential, because
     * section 10 requires a refusal not to say which state it hit.
     */
    describe('should refuse a cookie whose refresh token matches no row', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110009,
            sessionKey: 'session-key-10100509',
            signedInAt: new Date('2026-09-09T09:00:00.000Z'),
            signedOutAt: new Date('2026-09-09T09:10:00.000Z'),
            presentedRefreshToken: 'ab01ab01ab01ab01ab01ab01ab01ab01ab01ab01ab01ab01ab01ab01ab01ab01',
            config: {
              graphqlEndpoint: '/graphql-staff',
              refreshTokenCookie: {
                name: 'test_staff_refresh_token',
                lifetimeDays: 14,
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
              },
            },
          },
          expected: '204.M002.001',
        },
        {
          params: {
            staffMemberId: 10110010,
            sessionKey: 'session-key-10100510',
            signedInAt: new Date('2026-09-10T09:00:00.000Z'),
            signedOutAt: new Date('2026-09-10T09:10:00.000Z'),
            presentedRefreshToken: 'cd23cd23cd23cd23cd23cd23cd23cd23cd23cd23cd23cd23cd23cd23cd23cd23',
            config: {
              graphqlEndpoint: '/graphql-staff',
              refreshTokenCookie: {
                name: 'test_staff_refresh_token',
                lifetimeDays: 14,
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
              },
            },
          },
          expected: '204.M002.001',
        },
      ]

      test.each(cases)('sessionKey: $params.sessionKey', async ({
        params,
        expected,
      }) => {
        const sessionClerk = SessionClerk.create({
          AccessTokenModel: StaffMemberAccessToken,
          RefreshTokenModel: StaffMemberRefreshToken,
        })
        await sessionClerk.saveSession({
          userId: params.staffMemberId,
          sessionKey: params.sessionKey,
          now: params.signedInAt,
        })
        const clearCookieSpy = jest.fn()
        const context = /** @type {*} */ ({
          now: params.signedOutAt,
          cookieHeader: `${params.config.refreshTokenCookie.name}=${params.presentedRefreshToken}`,
          config: params.config,
          expressResponse: {
            clearCookie: clearCookieSpy,
          },
        })
        const resolver = SignOutMutationResolver.create()

        const actual = () => resolver.resolve({
          context,
        })

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * Signing out twice from the same machine. The series is already revoked, so the second call
     * presents a credential the database has refused, and is refused by the same code.
     */
    describe('should refuse a cookie whose refresh token is already revoked', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            sessionKey: 'session-key-10100511',
            signedInAt: new Date('2026-09-11T09:00:00.000Z'),
            revokedAt: new Date('2026-09-11T09:05:00.000Z'),
            signedOutAt: new Date('2026-09-11T09:10:00.000Z'),
            config: {
              graphqlEndpoint: '/graphql-staff',
              refreshTokenCookie: {
                name: 'test_staff_refresh_token',
                lifetimeDays: 14,
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
              },
            },
          },
          expected: '204.M002.001',
        },
        {
          params: {
            staffMemberId: 10110002,
            sessionKey: 'session-key-10100512',
            signedInAt: new Date('2026-09-12T09:00:00.000Z'),
            revokedAt: new Date('2026-09-12T09:05:00.000Z'),
            signedOutAt: new Date('2026-09-12T09:10:00.000Z'),
            config: {
              graphqlEndpoint: '/graphql-staff',
              refreshTokenCookie: {
                name: 'test_staff_refresh_token',
                lifetimeDays: 14,
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
              },
            },
          },
          expected: '204.M002.001',
        },
      ]

      test.each(cases)('sessionKey: $params.sessionKey', async ({
        params,
        expected,
      }) => {
        const sessionClerk = SessionClerk.create({
          AccessTokenModel: StaffMemberAccessToken,
          RefreshTokenModel: StaffMemberRefreshToken,
        })
        const savingResult = await sessionClerk.saveSession({
          userId: params.staffMemberId,
          sessionKey: params.sessionKey,
          now: params.signedInAt,
        })
        await sessionClerk.revokeSession({
          sessionKey: params.sessionKey,
          now: params.revokedAt,
        })
        const clearCookieSpy = jest.fn()
        const context = /** @type {*} */ ({
          now: params.signedOutAt,
          cookieHeader: `${params.config.refreshTokenCookie.name}=${savingResult.credentialPair.refreshToken}`,
          config: params.config,
          expressResponse: {
            clearCookie: clearCookieSpy,
          },
        })
        const resolver = SignOutMutationResolver.create()

        const actual = () => resolver.resolve({
          context,
        })

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The cookie carries a token a renewal already spent. It is the third of the states
     * `StaffMemberRefreshToken#isAvailable()` answers, and it is refused by the same code as the
     * other two.
     */
    describe('should refuse a cookie whose refresh token was already spent', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110003,
            sessionKey: 'session-key-10100513',
            signedInAt: new Date('2026-09-13T09:00:00.000Z'),
            spentAt: new Date('2026-09-13T09:05:00.000Z'),
            signedOutAt: new Date('2026-09-13T09:10:00.000Z'),
            config: {
              graphqlEndpoint: '/graphql-staff',
              refreshTokenCookie: {
                name: 'test_staff_refresh_token',
                lifetimeDays: 14,
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
              },
            },
          },
          expected: '204.M002.001',
        },
        {
          params: {
            staffMemberId: 10110004,
            sessionKey: 'session-key-10100514',
            signedInAt: new Date('2026-09-14T09:00:00.000Z'),
            spentAt: new Date('2026-09-14T09:05:00.000Z'),
            signedOutAt: new Date('2026-09-14T09:10:00.000Z'),
            config: {
              graphqlEndpoint: '/graphql-staff',
              refreshTokenCookie: {
                name: 'test_staff_refresh_token',
                lifetimeDays: 14,
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
              },
            },
          },
          expected: '204.M002.001',
        },
      ]

      test.each(cases)('sessionKey: $params.sessionKey', async ({
        params,
        expected,
      }) => {
        const sessionClerk = SessionClerk.create({
          AccessTokenModel: StaffMemberAccessToken,
          RefreshTokenModel: StaffMemberRefreshToken,
        })
        const savingResult = await sessionClerk.saveSession({
          userId: params.staffMemberId,
          sessionKey: params.sessionKey,
          now: params.signedInAt,
        })
        await sessionClerk.rotateSession({
          refreshTokenEntity: savingResult.credentialPair.refreshTokenEntity,
          now: params.spentAt,
        })
        const clearCookieSpy = jest.fn()
        const context = /** @type {*} */ ({
          now: params.signedOutAt,
          cookieHeader: `${params.config.refreshTokenCookie.name}=${savingResult.credentialPair.refreshToken}`,
          config: params.config,
          expressResponse: {
            clearCookie: clearCookieSpy,
          },
        })
        const resolver = SignOutMutationResolver.create()

        const actual = () => resolver.resolve({
          context,
        })

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The cookie is older than the fourteen days its token was minted for. The instant a token
     * expires already counts as expired, so nothing here is a borderline read.
     */
    describe('should refuse a cookie whose refresh token has expired', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110005,
            sessionKey: 'session-key-10100515',
            signedInAt: new Date('2020-01-01T09:00:00.000Z'),
            signedOutAt: new Date('2026-09-15T09:10:00.000Z'),
            config: {
              graphqlEndpoint: '/graphql-staff',
              refreshTokenCookie: {
                name: 'test_staff_refresh_token',
                lifetimeDays: 14,
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
              },
            },
          },
          expected: '204.M002.001',
        },
        {
          params: {
            staffMemberId: 10110006,
            sessionKey: 'session-key-10100516',
            signedInAt: new Date('2021-02-02T09:00:00.000Z'),
            signedOutAt: new Date('2026-09-16T09:10:00.000Z'),
            config: {
              graphqlEndpoint: '/graphql-staff',
              refreshTokenCookie: {
                name: 'test_staff_refresh_token',
                lifetimeDays: 14,
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
              },
            },
          },
          expected: '204.M002.001',
        },
      ]

      test.each(cases)('sessionKey: $params.sessionKey', async ({
        params,
        expected,
      }) => {
        const sessionClerk = SessionClerk.create({
          AccessTokenModel: StaffMemberAccessToken,
          RefreshTokenModel: StaffMemberRefreshToken,
        })
        const savingResult = await sessionClerk.saveSession({
          userId: params.staffMemberId,
          sessionKey: params.sessionKey,
          now: params.signedInAt,
        })
        const clearCookieSpy = jest.fn()
        const context = /** @type {*} */ ({
          now: params.signedOutAt,
          cookieHeader: `${params.config.refreshTokenCookie.name}=${savingResult.credentialPair.refreshToken}`,
          config: params.config,
          expressResponse: {
            clearCookie: clearCookieSpy,
          },
        })
        const resolver = SignOutMutationResolver.create()

        const actual = () => resolver.resolve({
          context,
        })

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The one branch seeded data cannot reach: the revocation itself fails. Answering
     * `signedOut: true` there would be a lie, because the series would still be live — so the
     * revocation result is steered into its error state and the second code is expected.
     */
    describe('should refuse when the revocation does not land', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110007,
            sessionKey: 'session-key-10100517',
            signedInAt: new Date('2026-09-17T09:00:00.000Z'),
            signedOutAt: new Date('2026-09-17T09:10:00.000Z'),
            config: {
              graphqlEndpoint: '/graphql-staff',
              refreshTokenCookie: {
                name: 'test_staff_refresh_token',
                lifetimeDays: 14,
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
              },
            },
          },
          expected: '204.M002.002',
        },
        {
          params: {
            staffMemberId: 10110008,
            sessionKey: 'session-key-10100518',
            signedInAt: new Date('2026-09-18T09:00:00.000Z'),
            signedOutAt: new Date('2026-09-18T09:10:00.000Z'),
            config: {
              graphqlEndpoint: '/graphql-staff',
              refreshTokenCookie: {
                name: 'test_staff_refresh_token',
                lifetimeDays: 14,
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
              },
            },
          },
          expected: '204.M002.002',
        },
      ]

      test.each(cases)('sessionKey: $params.sessionKey', async ({
        params,
        expected,
      }) => {
        const sessionClerk = SessionClerk.create({
          AccessTokenModel: StaffMemberAccessToken,
          RefreshTokenModel: StaffMemberRefreshToken,
        })
        const savingResult = await sessionClerk.saveSession({
          userId: params.staffMemberId,
          sessionKey: params.sessionKey,
          now: params.signedInAt,
        })
        const clearCookieSpy = jest.fn()
        const context = /** @type {*} */ ({
          now: params.signedOutAt,
          cookieHeader: `${params.config.refreshTokenCookie.name}=${savingResult.credentialPair.refreshToken}`,
          config: params.config,
          expressResponse: {
            clearCookie: clearCookieSpy,
          },
        })
        const resolver = SignOutMutationResolver.create()
        jest.spyOn(resolver, 'revokeSession')
          .mockResolvedValue(
            RevokingSessionResult.create({
              error: new Error('stub revocation failure'),
            })
          )

        const actual = () => resolver.resolve({
          context,
        })

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('SignOutMutationResolver', () => {
  describe('#revokeSession()', () => {
    /*
     * The wrapper the sign-out revokes through, exercised for real. Two pairs are minted into one
     * series, so the counts say the revocation took the whole series and not only the token that
     * was presented: both refresh tokens are revoked and both access tokens the series handed out
     * are deleted.
     */
    describe('should revoke every token of the series and report the counts', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110009,
            sessionKey: 'session-key-10100519',
            firstSignedInAt: new Date('2026-09-19T09:00:00.000Z'),
            secondSignedInAt: new Date('2026-09-19T09:05:00.000Z'),
            revokedAt: new Date('2026-09-19T09:10:00.000Z'),
          },
          expected: {
            response: {
              revokedRefreshTokenCount: 2,
              deletedAccessTokenCount: 2,
            },
            error: null,
          },
        },
        {
          params: {
            staffMemberId: 10110010,
            sessionKey: 'session-key-10100520',
            firstSignedInAt: new Date('2026-09-20T09:00:00.000Z'),
            secondSignedInAt: new Date('2026-09-20T09:05:00.000Z'),
            revokedAt: new Date('2026-09-20T09:10:00.000Z'),
          },
          expected: {
            response: {
              revokedRefreshTokenCount: 2,
              deletedAccessTokenCount: 2,
            },
            error: null,
          },
        },
      ]

      test.each(cases)('sessionKey: $params.sessionKey', async ({
        params,
        expected,
      }) => {
        const sessionClerk = SessionClerk.create({
          AccessTokenModel: StaffMemberAccessToken,
          RefreshTokenModel: StaffMemberRefreshToken,
        })
        await sessionClerk.saveSession({
          userId: params.staffMemberId,
          sessionKey: params.sessionKey,
          now: params.firstSignedInAt,
        })
        await sessionClerk.saveSession({
          userId: params.staffMemberId,
          sessionKey: params.sessionKey,
          now: params.secondSignedInAt,
        })
        const resolver = SignOutMutationResolver.create()

        const actual = await resolver.revokeSession({
          sessionKey: params.sessionKey,
          now: params.revokedAt,
        })

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
