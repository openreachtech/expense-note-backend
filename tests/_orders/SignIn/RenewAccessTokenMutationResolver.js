import SessionClerk from '../../../app/session/SessionClerk.js'

import AccessTokenRenewalRateLimit from '../../../app/tools/rateLimit/limits/AccessTokenRenewalRateLimit.js'

import StaffMemberAccessToken from '../../../sequelize/models/StaffMemberAccessToken.js'
import StaffMemberRefreshToken from '../../../sequelize/models/StaffMemberRefreshToken.js'

import RenewAccessTokenMutationResolver from '../../../server/graphql/resolvers/staff/actual/mutations/RenewAccessTokenMutationResolver.js'

/*
 * `#resolve()` — the whole operation, against the real tables.
 *
 * The members of staff are the seeded ones
 * (`sequelize/seeders/development/20260910120001-000001-staff_members.cjs`), so the only rows
 * created here are token rows, and **no row is given an explicit id**. That is deliberate rather
 * than an omission of this feature's `101` prefix: every successful renewal inserts a refresh
 * token and an access token whose ids the database assigns as `max(id) + 1`, so an explicit id
 * written above that maximum is the next auto-increment value, and the following explicit insert
 * would collide with a row this very file minted. Nothing here needs an id anyway — a refresh
 * token is found by the digest of what the cookie presents, which is what the operation itself
 * looks it up by.
 *
 * The refresh tokens are 64 lower-case hex characters because
 * `StaffMemberRefreshToken.buildWithGeneratedAttributes()` refuses a token the credential
 * generator would not have minted; the four digits at the end are what tells them apart in a
 * failure log. The series keys are this file's own so that no other file's series is touched.
 *
 * **Every describe whose renewal rotates hands its context a response to write a cookie to.** The
 * rotation mints a pair whose refresh half reaches its holder as a cookie and nowhere else, so the
 * operation refuses to rotate where it has nothing to write that cookie to — the write is
 * otherwise a silent no-op and the successor would be minted unpresentable. The describes whose
 * renewal is refused before the rotation keep a null response, because what they are about
 * happens earlier; the last describe is the one that asks what happens when there is no response
 * at all. The reuse-revocation describe needs a response for the same reason a successful renewal
 * does: revoking the series is the rotation's own doing.
 *
 * The refusals are asserted against an **anchored** pattern rather than the code as a substring:
 * spec section 10 requires the refusal of an absent, expired, revoked or already spent cookie to
 * reveal which it was in none of them, and a message that appended the state would still satisfy
 * a substring match.
 */

describe('RenewAccessTokenMutationResolver', () => {
  describe('#resolve()', () => {
    describe('should hand back a freshly issued access token', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001, // seeded: Haruka Arai
            sessionKey: 'renew-resolver-series-0501',
            refreshToken: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0501',
            generatedAt: new Date('2026-09-11T09:00:00.000Z'),
            expiredAt: new Date('2026-09-25T09:00:00.000Z'),
            cookieHeader: 'staff_refresh_token=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0501',
            presentedAt: new Date('2026-09-11T09:14:00.000Z'),
          },
          expected: {
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
        {
          params: {
            staffMemberId: 10110002, // seeded: Kenji Ogawa
            sessionKey: 'renew-resolver-series-0502',
            refreshToken: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0502',
            generatedAt: new Date('2026-09-12T10:00:00.000Z'),
            expiredAt: new Date('2026-09-26T10:00:00.000Z'),
            cookieHeader: 'other=1; staff_refresh_token=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0502; another=2',
            presentedAt: new Date('2026-09-26T09:59:59.999Z'), // one millisecond of life left
          },
          expected: {
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
      ]

      test.each(cases)('sessionKey: $params.sessionKey', async ({
        params,
        expected,
      }) => {
        const refreshTokenEntity = StaffMemberRefreshToken.buildWithGeneratedAttributes({
          userId: params.staffMemberId,
          sessionKey: params.sessionKey,
          refreshToken: params.refreshToken,
          generatedAt: params.generatedAt,
          expiredAt: params.expiredAt,
        })
        await refreshTokenEntity.save()
        const resolver = RenewAccessTokenMutationResolver.create()
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          cookieHeader: params.cookieHeader,
          expressResponse: {
            cookie: () => null,
          },
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })

        const actual = await resolver.resolve({
          context,
        })

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The new refresh token reaches the browser as an httpOnly cookie and appears in no response
     * body (spec sections 9.7 and 10.1). The token the cookie carries is minted inside the
     * rotation, so it is asserted by shape.
     */
    describe('should hand the new refresh token to the browser as an httpOnly cookie', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110003, // seeded: Mio Fukuda
            sessionKey: 'renew-resolver-series-0503',
            refreshToken: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0503',
            generatedAt: new Date('2026-09-13T09:00:00.000Z'),
            expiredAt: new Date('2026-09-27T09:00:00.000Z'),
            cookieHeader: 'staff_refresh_token=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0503',
            presentedAt: new Date('2026-09-13T09:14:00.000Z'),
          },
          expected: {
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
        {
          params: {
            staffMemberId: 10110004, // seeded: Souta Nishimura
            sessionKey: 'renew-resolver-series-0504',
            refreshToken: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0504',
            generatedAt: new Date('2026-09-14T10:00:00.000Z'),
            expiredAt: new Date('2026-09-28T10:00:00.000Z'),
            cookieHeader: 'staff_refresh_token=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0504',
            presentedAt: new Date('2026-09-14T10:14:00.000Z'),
          },
          expected: {
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
      ]

      test.each(cases)('sessionKey: $params.sessionKey', async ({
        params,
        expected,
      }) => {
        const refreshTokenEntity = StaffMemberRefreshToken.buildWithGeneratedAttributes({
          userId: params.staffMemberId,
          sessionKey: params.sessionKey,
          refreshToken: params.refreshToken,
          generatedAt: params.generatedAt,
          expiredAt: params.expiredAt,
        })
        await refreshTokenEntity.save()
        const cookieSpy = jest.fn()
        const resolver = RenewAccessTokenMutationResolver.create()
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          cookieHeader: params.cookieHeader,
          expressResponse: {
            cookie: cookieSpy,
          },
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })

        const actual = await resolver.resolve({
          context,
        })

        expect(actual)
          .toEqual(expected)
        expect(cookieSpy)
          .toHaveBeenCalledWith(
            'staff_refresh_token',
            expect.stringMatching(/^[0-9a-f]{64}$/u),
            {
              httpOnly: true,
              secure: true,
              sameSite: 'lax',
              path: '/graphql-staff',
              maxAge: 1209600000,
            }
          )
      })
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * Spec section 10: a refresh-token cookie that is expired, revoked or already spent is
     * refused identically in all three cases. The three cases below are the three states, and
     * they share one `expected` — an anchored pattern, so a refusal naming which state it was
     * would fail. That shared expectation is the criterion; three cases each merely refused would
     * not establish it.
     */
    describe('should refuse a dead refresh token identically, whichever way it died', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110005, // seeded: Rin Takahashi
            sessionKey: 'renew-resolver-spent-series-0511',
            refreshToken: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0511',
            generatedAt: new Date('2026-09-15T09:00:00.000Z'),
            expiredAt: new Date('2026-09-29T09:00:00.000Z'),
            // already spent on a rotation
            deadState: {
              usedAt: new Date('2026-09-15T09:14:00.000Z'),
              revokedAt: null,
            },
            cookieHeader: 'staff_refresh_token=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0511',
            presentedAt: new Date('2026-09-15T09:20:00.000Z'),
          },
          expected: /^204\.M003\.001$/u,
        },
        {
          params: {
            staffMemberId: 10110006, // seeded: Yuuto Kirishima
            sessionKey: 'renew-resolver-revoked-series-0512',
            refreshToken: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0512',
            generatedAt: new Date('2026-09-16T09:00:00.000Z'),
            expiredAt: new Date('2026-09-30T09:00:00.000Z'),
            // revoked without ever being spent
            deadState: {
              usedAt: null,
              revokedAt: new Date('2026-09-16T09:10:00.000Z'),
            },
            cookieHeader: 'staff_refresh_token=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0512',
            presentedAt: new Date('2026-09-16T09:20:00.000Z'),
          },
          expected: /^204\.M003\.001$/u,
        },
        {
          params: {
            staffMemberId: 10110007, // seeded: Nanami Doi
            sessionKey: 'renew-resolver-expired-series-0513',
            refreshToken: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0513',
            generatedAt: new Date('2026-09-03T09:00:00.000Z'),
            expiredAt: new Date('2026-09-17T09:00:00.000Z'),
            // neither spent nor revoked: its fortnight simply ran out
            deadState: {
              usedAt: null,
              revokedAt: null,
            },
            cookieHeader: 'staff_refresh_token=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0513',
            presentedAt: new Date('2026-09-17T09:00:00.000Z'), // the expiry instant itself
          },
          expected: /^204\.M003\.001$/u,
        },
      ]

      test.each(cases)('sessionKey: $params.sessionKey', async ({
        params,
        expected,
      }) => {
        const refreshTokenEntity = StaffMemberRefreshToken.buildWithGeneratedAttributes({
          userId: params.staffMemberId,
          sessionKey: params.sessionKey,
          refreshToken: params.refreshToken,
          generatedAt: params.generatedAt,
          expiredAt: params.expiredAt,
        })
        refreshTokenEntity.set(params.deadState)
        await refreshTokenEntity.save()
        const resolver = RenewAccessTokenMutationResolver.create()
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          cookieHeader: params.cookieHeader,
          expressResponse: null,
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })

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

describe('RenewAccessTokenMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * Spec section 10: called with no refresh-token cookie at all it is refused, and returns
     * nobody. The same code as the three dead states above, so the four are one refusal — and
     * nothing is read, because a request with nothing to present names no series.
     */
    describe('should refuse a request carrying no refresh-token cookie', () => {
      const cases = [
        {
          params: {
            // no `Cookie` header at all
            cookieHeader: null,
            presentedAt: new Date('2026-09-18T09:00:00.000Z'),
          },
          expected: /^204\.M003\.001$/u,
        },
        {
          params: {
            // cookies, but not this audience's
            cookieHeader: 'other=1; admin_refresh_token=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0514; another=2',
            presentedAt: new Date('2026-09-19T09:00:00.000Z'),
          },
          expected: /^204\.M003\.001$/u,
        },
      ]

      test.each(cases)('cookieHeader: $params.cookieHeader', async ({
        params,
        expected,
      }) => {
        const resolver = RenewAccessTokenMutationResolver.create()
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          cookieHeader: params.cookieHeader,
          expressResponse: null,
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })

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

describe('RenewAccessTokenMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * A cookie whose value no row holds — a guess, or a token from a database that has since been
     * rebuilt. It is the same refusal again, so what a caller learns from it is nothing: not
     * whether the value ever existed, and not whose it was.
     */
    describe('should refuse a refresh token no row holds', () => {
      const cases = [
        {
          params: {
            cookieHeader: 'staff_refresh_token=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0515',
            presentedAt: new Date('2026-09-20T09:00:00.000Z'),
          },
          expected: /^204\.M003\.001$/u,
        },
        {
          params: {
            // not even the shape a token is minted in
            cookieHeader: 'staff_refresh_token=not-a-token-this-project-ever-minted-0516',
            presentedAt: new Date('2026-09-21T09:00:00.000Z'),
          },
          expected: /^204\.M003\.001$/u,
        },
      ]

      test.each(cases)('cookieHeader: $params.cookieHeader', async ({
        params,
        expected,
      }) => {
        const resolver = RenewAccessTokenMutationResolver.create()
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          cookieHeader: params.cookieHeader,
          expressResponse: null,
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })

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

describe('RenewAccessTokenMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * Spec section 10: a refresh token presented after it was already spent revokes every token
     * in its series — the stolen cookie stops working, and so does the session it was stolen
     * from. Each case holds two tokens of one series: the spent one a thief presents, and the
     * live successor the rotation had issued to its rightful holder. The first case reads back the
     * presented token, the second the successor; between them that is every token in the series.
     *
     * The reuse is arranged, and the read-back is the Act — the same shape
     * `tests/_orders/SessionClerk/SessionClerk.js` uses for this, because what is asserted is
     * what the refusal left behind rather than the refusal itself. The refusal is absorbed by an
     * expectation of its own instead of being ignored, so a resolver that stopped refusing could
     * not let the read-back pass quietly. Revoking inside a transaction the resolver rolled back
     * would leave `revokedAt` null here.
     */
    describe('should revoke every token in the series a reuse presented', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110008, // seeded: Riku Hasegawa
            sessionKey: 'renew-resolver-reused-series-0521',
            spentRefreshToken: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0521',
            successorRefreshToken: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0522',
            generatedAt: new Date('2026-09-22T09:00:00.000Z'),
            expiredAt: new Date('2026-10-06T09:00:00.000Z'),
            spentAt: new Date('2026-09-22T09:14:00.000Z'),
            cookieHeader: 'staff_refresh_token=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0521',
            presentedAt: new Date('2026-09-22T09:20:00.000Z'),
            // the stolen cookie itself
            readBackRefreshToken: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0521',
          },
          expected: expect.objectContaining({
            sessionKey: 'renew-resolver-reused-series-0521',
            revokedAt: new Date('2026-09-22T09:20:00.000Z'),
          }),
        },
        {
          params: {
            staffMemberId: 10110009, // seeded: Aoi Tsuchiya
            sessionKey: 'renew-resolver-reused-series-0523',
            spentRefreshToken: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0523',
            successorRefreshToken: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0524',
            generatedAt: new Date('2026-09-23T09:00:00.000Z'),
            expiredAt: new Date('2026-10-07T09:00:00.000Z'),
            spentAt: new Date('2026-09-23T09:14:00.000Z'),
            cookieHeader: 'staff_refresh_token=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0523',
            presentedAt: new Date('2026-09-23T09:20:00.000Z'),
            // the live successor, which is the session the cookie was stolen from
            readBackRefreshToken: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0524',
          },
          expected: expect.objectContaining({
            sessionKey: 'renew-resolver-reused-series-0523',
            revokedAt: new Date('2026-09-23T09:20:00.000Z'),
          }),
        },
      ]

      test.each(cases)('sessionKey: $params.sessionKey', async ({
        params,
        expected,
      }) => {
        const spentTokenEntity = StaffMemberRefreshToken.buildWithGeneratedAttributes({
          userId: params.staffMemberId,
          sessionKey: params.sessionKey,
          refreshToken: params.spentRefreshToken,
          generatedAt: params.generatedAt,
          expiredAt: params.expiredAt,
        })
        spentTokenEntity.set({
          usedAt: params.spentAt,
        })
        await spentTokenEntity.save()
        const successorTokenEntity = StaffMemberRefreshToken.buildWithGeneratedAttributes({
          userId: params.staffMemberId,
          sessionKey: params.sessionKey,
          refreshToken: params.successorRefreshToken,
          generatedAt: params.spentAt,
          expiredAt: params.expiredAt,
        })
        await successorTokenEntity.save()
        const resolver = RenewAccessTokenMutationResolver.create()
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          cookieHeader: params.cookieHeader,
          expressResponse: {
            cookie: () => null,
          },
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })
        const refusedRenewal = () => resolver.resolve({
          context,
        })
        await expect(refusedRenewal)
          .rejects
          .toThrow(/^204\.M003\.001$/u)
        const sessionClerk = SessionClerk.create({
          AccessTokenModel: StaffMemberAccessToken,
          RefreshTokenModel: StaffMemberRefreshToken,
        })

        const actual = await sessionClerk.findRefreshToken({
          refreshToken: params.readBackRefreshToken,
        })

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * Spec section 7: sixty renewals per hour for one refresh-token series. Sixty rows in one
     * hour is not arrangeable as readable fixtures, so the count alone is steered and everything
     * around it stays real — the threshold of sixty is the limit's own, the comparison is the
     * base class's, and the presented token below is live, so nothing but the limit can be what
     * refuses it.
     *
     * The refusal carries a code of its own, and that is the point rather than an oversight: the
     * four credential states have to be indistinguishable from one another, and "too frequent" is
     * not one of them. A caller learning they are rate-limited learns nothing about whose
     * sessions exist.
     *
     * The assertion on what the count was asked for is what proves the limit is keyed on the
     * series the cookie presents, and on nothing else.
     */
    describe('should refuse a renewal the series has already spent its hour on', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110010, // seeded: Daiki Morishita
            sessionKey: 'renew-resolver-busy-series-0531',
            refreshToken: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0531',
            generatedAt: new Date('2026-09-24T09:00:00.000Z'),
            expiredAt: new Date('2026-10-08T09:00:00.000Z'),
            cookieHeader: 'staff_refresh_token=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0531',
            presentedAt: new Date('2026-09-24T09:30:00.000Z'),
          },
          mockRecentEventCount: 60, // exactly the threshold: the sixty-first is one too many
          expected: /^204\.M003\.002$/u,
        },
        {
          params: {
            staffMemberId: 10110001, // seeded: Haruka Arai
            sessionKey: 'renew-resolver-busy-series-0532',
            refreshToken: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0532',
            generatedAt: new Date('2026-09-25T09:00:00.000Z'),
            expiredAt: new Date('2026-10-09T09:00:00.000Z'),
            cookieHeader: 'staff_refresh_token=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0532',
            presentedAt: new Date('2026-09-25T09:30:00.000Z'),
          },
          mockRecentEventCount: 120, // well past it
          expected: /^204\.M003\.002$/u,
        },
      ]

      test.each(cases)('sessionKey: $params.sessionKey', async ({
        params,
        mockRecentEventCount,
        expected,
      }) => {
        const refreshTokenEntity = StaffMemberRefreshToken.buildWithGeneratedAttributes({
          userId: params.staffMemberId,
          sessionKey: params.sessionKey,
          refreshToken: params.refreshToken,
          generatedAt: params.generatedAt,
          expiredAt: params.expiredAt,
        })
        await refreshTokenEntity.save()
        const countSpy = jest.spyOn(AccessTokenRenewalRateLimit.prototype, 'countRecentEvents')
          .mockResolvedValue(mockRecentEventCount)
        const resolver = RenewAccessTokenMutationResolver.create()
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          cookieHeader: params.cookieHeader,
          expressResponse: null,
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })

        const actual = () => resolver.resolve({
          context,
        })

        await expect(actual)
          .rejects
          .toThrow(expected)
        expect(countSpy)
          .toHaveBeenCalledWith({
            key: params.sessionKey,
          })
      })
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The limit is counted per series, so another series renewing in the same hour is not this
     * one's business. The three rows of the other series below share the presented token's hour
     * and are counted for real; the renewal goes through.
     */
    describe('should let a series renew while another series renews in the same hour', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110002, // seeded: Kenji Ogawa
            sessionKey: 'renew-resolver-quiet-series-0541',
            refreshToken: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0541',
            generatedAt: new Date('2026-09-26T09:00:00.000Z'),
            expiredAt: new Date('2026-10-10T09:00:00.000Z'),
            otherSeriesRecords: [
              {
                StaffMemberId: 10110002,
                tokenHash: 'renew-resolver-other-series-hash-0542',
                sessionKey: 'renew-resolver-loud-series-0542',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T09:05:00.000Z'),
                expiredAt: new Date('2026-10-10T09:05:00.000Z'),
              },
              {
                StaffMemberId: 10110002,
                tokenHash: 'renew-resolver-other-series-hash-0543',
                sessionKey: 'renew-resolver-loud-series-0542',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T09:10:00.000Z'),
                expiredAt: new Date('2026-10-10T09:10:00.000Z'),
              },
              {
                StaffMemberId: 10110002,
                tokenHash: 'renew-resolver-other-series-hash-0544',
                sessionKey: 'renew-resolver-loud-series-0542',
                usedAt: null,
                revokedAt: null,
                generatedAt: new Date('2026-09-26T09:15:00.000Z'),
                expiredAt: new Date('2026-10-10T09:15:00.000Z'),
              },
            ],
            cookieHeader: 'staff_refresh_token=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0541',
            presentedAt: new Date('2026-09-26T09:20:00.000Z'),
          },
          expected: {
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
      ]

      test.each(cases)('sessionKey: $params.sessionKey', async ({
        params,
        expected,
      }) => {
        const refreshTokenEntity = StaffMemberRefreshToken.buildWithGeneratedAttributes({
          userId: params.staffMemberId,
          sessionKey: params.sessionKey,
          refreshToken: params.refreshToken,
          generatedAt: params.generatedAt,
          expiredAt: params.expiredAt,
        })
        await refreshTokenEntity.save()
        await StaffMemberRefreshToken.bulkCreate(params.otherSeriesRecords)
        const resolver = RenewAccessTokenMutationResolver.create()
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          cookieHeader: params.cookieHeader,
          expressResponse: {
            cookie: () => null,
          },
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })

        const actual = await resolver.resolve({
          context,
        })

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * Where the limit sits in the sequence, asserted rather than asserted about. It is consulted
     * **after** the presented token is found — the key is the series, which nothing knows before
     * the lookup — and **before** the rotation, so a caller who has spent the hour's renewals
     * buys no write at all. The read-back below is the proof of the second half: the presented
     * token is still unspent and unrevoked, which it would not be if the limit were consulted
     * after the rotation.
     */
    describe('should refuse before the presented refresh token is spent', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110003, // seeded: Mio Fukuda
            sessionKey: 'renew-resolver-unspent-series-0551',
            refreshToken: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0551',
            generatedAt: new Date('2026-09-27T09:00:00.000Z'),
            expiredAt: new Date('2026-10-11T09:00:00.000Z'),
            cookieHeader: 'staff_refresh_token=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0551',
            presentedAt: new Date('2026-09-27T09:30:00.000Z'),
          },
          mockRecentEventCount: 60,
          expected: expect.objectContaining({
            sessionKey: 'renew-resolver-unspent-series-0551',
            usedAt: null,
            revokedAt: null,
          }),
        },
        {
          params: {
            staffMemberId: 10110004, // seeded: Souta Nishimura
            sessionKey: 'renew-resolver-unspent-series-0552',
            refreshToken: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0552',
            generatedAt: new Date('2026-09-28T09:00:00.000Z'),
            expiredAt: new Date('2026-10-12T09:00:00.000Z'),
            cookieHeader: 'staff_refresh_token=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0552',
            presentedAt: new Date('2026-09-28T09:30:00.000Z'),
          },
          mockRecentEventCount: 90,
          expected: expect.objectContaining({
            sessionKey: 'renew-resolver-unspent-series-0552',
            usedAt: null,
            revokedAt: null,
          }),
        },
      ]

      test.each(cases)('sessionKey: $params.sessionKey', async ({
        params,
        mockRecentEventCount,
        expected,
      }) => {
        const refreshTokenEntity = StaffMemberRefreshToken.buildWithGeneratedAttributes({
          userId: params.staffMemberId,
          sessionKey: params.sessionKey,
          refreshToken: params.refreshToken,
          generatedAt: params.generatedAt,
          expiredAt: params.expiredAt,
        })
        await refreshTokenEntity.save()
        jest.spyOn(AccessTokenRenewalRateLimit.prototype, 'countRecentEvents')
          .mockResolvedValue(mockRecentEventCount)
        const resolver = RenewAccessTokenMutationResolver.create()
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          cookieHeader: params.cookieHeader,
          expressResponse: null,
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })
        const refusedRenewal = () => resolver.resolve({
          context,
        })
        await expect(refusedRenewal)
          .rejects
          .toThrow(/^204\.M003\.002$/u)
        const sessionClerk = SessionClerk.create({
          AccessTokenModel: StaffMemberAccessToken,
          RefreshTokenModel: StaffMemberRefreshToken,
        })

        const actual = await sessionClerk.findRefreshToken({
          refreshToken: params.refreshToken,
        })

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RenewAccessTokenMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **A renewal it cannot hand the new cookie back to is refused, and the presented token is
     * left unspent.**
     *
     * The engine's endpoint also carries a WebSocket channel — `GraphqlServerBuilder#setupServer()`
     * opens one for every audience, with no configuration flag — and over it there is no express
     * response, so `BaseAppGraphqlContext#get:expressResponse` is null and
     * `RefreshTokenExpressCookieClerk#saveRefreshTokenCookie()` writes through an optional call
     * that silently does nothing. A renewal that rotated first would spend the presented token,
     * mint a successor nobody can ever present or revoke, and answer with a working access token.
     *
     * The presented token here is **live**: unspent, unrevoked, inside its lifetime, on a series
     * that has renewed nothing this hour. So every check above the guard passes, and without the
     * guard this renewal succeeds — which is what makes the test fail without it.
     *
     * The read-back is the Act, in the shape the limit's own describe above uses: what is asserted
     * is what the refusal left behind, and a rotation that had happened would show `usedAt` set on
     * the presented token. The refusal itself is absorbed by an expectation rather than ignored, so
     * a resolver that stopped refusing could not let the read-back pass quietly.
     */
    describe('should refuse a renewal it has no way to hand the new cookie to', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110006, // seeded: Yuuto Kirishima
            sessionKey: 'renew-resolver-undeliverable-series-0561',
            refreshToken: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0561',
            generatedAt: new Date('2026-10-14T09:00:00.000Z'),
            expiredAt: new Date('2026-10-28T09:00:00.000Z'),
            cookieHeader: 'staff_refresh_token=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0561',
            presentedAt: new Date('2026-10-14T09:14:00.000Z'),
          },
          expected: expect.objectContaining({
            sessionKey: 'renew-resolver-undeliverable-series-0561',
            usedAt: null,
            revokedAt: null,
          }),
        },
        {
          params: {
            staffMemberId: 10110010, // seeded: Daiki Morishita
            sessionKey: 'renew-resolver-undeliverable-series-0562',
            refreshToken: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0562',
            generatedAt: new Date('2026-10-15T09:00:00.000Z'),
            expiredAt: new Date('2026-10-29T09:00:00.000Z'),
            cookieHeader: 'staff_refresh_token=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0562',
            presentedAt: new Date('2026-10-15T09:14:00.000Z'),
          },
          expected: expect.objectContaining({
            sessionKey: 'renew-resolver-undeliverable-series-0562',
            usedAt: null,
            revokedAt: null,
          }),
        },
      ]

      test.each(cases)('sessionKey: $params.sessionKey', async ({
        params,
        expected,
      }) => {
        const refreshTokenEntity = StaffMemberRefreshToken.buildWithGeneratedAttributes({
          userId: params.staffMemberId,
          sessionKey: params.sessionKey,
          refreshToken: params.refreshToken,
          generatedAt: params.generatedAt,
          expiredAt: params.expiredAt,
        })
        await refreshTokenEntity.save()
        const resolver = RenewAccessTokenMutationResolver.create()
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          cookieHeader: params.cookieHeader,
          expressResponse: null, // what a request over the WebSocket channel carries
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })
        const refusedRenewal = () => resolver.resolve({
          context,
        })
        await expect(refusedRenewal)
          .rejects
          .toThrow(/^204\.M003\.001$/u)
        const sessionClerk = SessionClerk.create({
          AccessTokenModel: StaffMemberAccessToken,
          RefreshTokenModel: StaffMemberRefreshToken,
        })

        const actual = await sessionClerk.findRefreshToken({
          refreshToken: params.refreshToken,
        })

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
