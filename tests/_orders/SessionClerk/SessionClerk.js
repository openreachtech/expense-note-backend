import SessionClerk from '../../../app/session/SessionClerk.js'
import RevokingSessionResult from '../../../app/session/RevokingSessionResult.js'

import StaffMember from '../../../sequelize/models/StaffMember.js'
import StaffMemberAccessToken from '../../../sequelize/models/StaffMemberAccessToken.js'
import StaffMemberRefreshToken from '../../../sequelize/models/StaffMemberRefreshToken.js'

/*
 * Every test here creates the rows it reads, so the whole class sits in `_orders` — including the
 * two read-only finds, whose fixtures are still writes. There is no seeder for the token tables to
 * read instead, and the fixture values are literals so each expectation can be one too.
 *
 * The access token values below are short readable strings rather than 64 hex characters: nothing
 * on the read path judges the shape of a presented token, the unique index on `access_token` is
 * what the lookup uses, and a literal that fits on one line is what a failure log can be read
 * against.
 */

describe('SessionClerk', () => {
  describe('#findAvailableAccessToken()', () => {
    describe('should find the row a live access token belongs to', () => {
      const cases = [
        {
          params: {
            staffMember: {
              id: 10100221,
              name: 'staff member holding a live access token 10100221',
            },
            accessTokenRecord: {
              id: 10100201,
              StaffMemberId: 10100221,
              accessToken: 'access-token-0201',
              sessionKey: 'session-key-0201',
              generatedAt: new Date('2026-09-01T10:00:00.000Z'),
              expiredAt: new Date('2026-09-01T10:15:00.000Z'),
            },
            pointsAt: new Date('2026-09-01T10:14:59.999Z'), // one millisecond of life left
          },
          expected: expect.objectContaining({
            id: 10100201,
            accessToken: 'access-token-0201',
            sessionKey: 'session-key-0201',
          }),
        },
        {
          params: {
            staffMember: {
              id: 10100222,
              name: 'staff member holding a freshly issued access token 10100222',
            },
            accessTokenRecord: {
              id: 10100202,
              StaffMemberId: 10100222,
              accessToken: 'access-token-0202',
              sessionKey: 'session-key-0202',
              generatedAt: new Date('2026-09-02T11:00:00.000Z'),
              expiredAt: new Date('2026-09-02T11:15:00.000Z'),
            },
            pointsAt: new Date('2026-09-02T11:00:00.000Z'), // the instant it was issued
          },
          expected: expect.objectContaining({
            id: 10100202,
            accessToken: 'access-token-0202',
            sessionKey: 'session-key-0202',
          }),
        },
      ]

      test.each(cases)('accessTokenRecord.id: $params.accessTokenRecord.id', async ({
        params,
        expected,
      }) => {
        await StaffMember.create(params.staffMember)
        await StaffMemberAccessToken.create(params.accessTokenRecord)
        const sessionClerk = SessionClerk.create({
          AccessTokenModel: StaffMemberAccessToken,
          RefreshTokenModel: StaffMemberRefreshToken,
        })

        const args = {
          accessToken: params.accessTokenRecord.accessToken,
          pointsAt: params.pointsAt,
        }

        const actual = await sessionClerk.findAvailableAccessToken(args)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SessionClerk', () => {
  describe('#findAvailableAccessToken()', () => {
    describe('should refuse an access token whose fifteen minutes have run out', () => {
      const cases = [
        {
          params: {
            staffMember: {
              id: 10100223,
              name: 'staff member holding an access token at its expiry 10100223',
            },
            accessTokenRecord: {
              id: 10100203,
              StaffMemberId: 10100223,
              accessToken: 'access-token-0203',
              sessionKey: 'session-key-0203',
              generatedAt: new Date('2026-09-03T12:00:00.000Z'),
              expiredAt: new Date('2026-09-03T12:15:00.000Z'),
            },
            pointsAt: new Date('2026-09-03T12:15:00.000Z'), // the expiry instant itself counts as expired
          },
        },
        {
          params: {
            staffMember: {
              id: 10100224,
              name: 'staff member holding an access token past its expiry 10100224',
            },
            accessTokenRecord: {
              id: 10100204,
              StaffMemberId: 10100224,
              accessToken: 'access-token-0204',
              sessionKey: 'session-key-0204',
              generatedAt: new Date('2026-09-04T13:00:00.000Z'),
              expiredAt: new Date('2026-09-04T13:15:00.000Z'),
            },
            pointsAt: new Date('2026-09-04T13:15:00.001Z'), // one millisecond past it
          },
        },
      ]

      test.each(cases)('accessTokenRecord.id: $params.accessTokenRecord.id', async ({
        params,
      }) => {
        await StaffMember.create(params.staffMember)
        await StaffMemberAccessToken.create(params.accessTokenRecord)
        const sessionClerk = SessionClerk.create({
          AccessTokenModel: StaffMemberAccessToken,
          RefreshTokenModel: StaffMemberRefreshToken,
        })

        const args = {
          accessToken: params.accessTokenRecord.accessToken,
          pointsAt: params.pointsAt,
        }

        const actual = await sessionClerk.findAvailableAccessToken(args)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('SessionClerk', () => {
  describe('#findAvailableAccessToken()', () => {
    describe('should refuse an access token no row holds', () => {
      const cases = [
        {
          params: {
            staffMember: {
              id: 10100225,
              name: 'staff member whose live token is not the one presented 10100225',
            },
            accessTokenRecord: {
              id: 10100205,
              StaffMemberId: 10100225,
              accessToken: 'access-token-0205',
              sessionKey: 'session-key-0205',
              generatedAt: new Date('2026-09-05T14:00:00.000Z'),
              expiredAt: new Date('2026-09-05T14:15:00.000Z'),
            },
            accessToken: 'access-token-9905', // minted by nobody
            pointsAt: new Date('2026-09-05T14:05:00.000Z'),
          },
        },
        {
          params: {
            staffMember: {
              id: 10100226,
              name: 'staff member whose live token is not the other one presented 10100226',
            },
            accessTokenRecord: {
              id: 10100206,
              StaffMemberId: 10100226,
              accessToken: 'access-token-0206',
              sessionKey: 'session-key-0206',
              generatedAt: new Date('2026-09-06T15:00:00.000Z'),
              expiredAt: new Date('2026-09-06T15:15:00.000Z'),
            },
            accessToken: 'access-token-9906', // minted by nobody
            pointsAt: new Date('2026-09-06T15:05:00.000Z'),
          },
        },
      ]

      test.each(cases)('accessToken: $params.accessToken', async ({
        params,
      }) => {
        await StaffMember.create(params.staffMember)
        await StaffMemberAccessToken.create(params.accessTokenRecord)
        const sessionClerk = SessionClerk.create({
          AccessTokenModel: StaffMemberAccessToken,
          RefreshTokenModel: StaffMemberRefreshToken,
        })

        const args = {
          accessToken: params.accessToken,
          pointsAt: params.pointsAt,
        }

        const actual = await sessionClerk.findAvailableAccessToken(args)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('SessionClerk', () => {
  describe('#findAvailableAccessToken()', () => {
    describe('should refuse a request that carried no access token', () => {
      const cases = [
        {
          params: {
            accessToken: null, // no header on the request at all
            pointsAt: new Date('2026-09-07T16:00:00.000Z'),
          },
        },
        {
          params: {
            accessToken: '', // the header was there and empty
            pointsAt: new Date('2026-09-07T16:05:00.000Z'),
          },
        },
      ]

      test.each(cases)('accessToken: $params.accessToken', async ({
        params,
      }) => {
        const sessionClerk = SessionClerk.create({
          AccessTokenModel: StaffMemberAccessToken,
          RefreshTokenModel: StaffMemberRefreshToken,
        })

        const actual = await sessionClerk.findAvailableAccessToken(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('SessionClerk', () => {
  describe('#findAccessToken()', () => {
    describe('should find the row an expired access token still belongs to', () => {
      const cases = [
        {
          params: {
            staffMember: {
              id: 10100227,
              name: 'staff member holding a long expired access token 10100227',
            },
            accessTokenRecord: {
              id: 10100207,
              StaffMemberId: 10100227,
              accessToken: 'access-token-0207',
              sessionKey: 'session-key-0207',
              generatedAt: new Date('2026-09-08T17:00:00.000Z'),
              expiredAt: new Date('2026-09-08T17:15:00.000Z'),
            },
          },
          expected: expect.objectContaining({
            id: 10100207,
            accessToken: 'access-token-0207',
            expiredAt: new Date('2026-09-08T17:15:00.000Z'),
          }),
        },
        {
          params: {
            staffMember: {
              id: 10100228,
              name: 'staff member holding another expired access token 10100228',
            },
            accessTokenRecord: {
              id: 10100208,
              StaffMemberId: 10100228,
              accessToken: 'access-token-0208',
              sessionKey: 'session-key-0208',
              generatedAt: new Date('2026-09-09T18:00:00.000Z'),
              expiredAt: new Date('2026-09-09T18:15:00.000Z'),
            },
          },
          expected: expect.objectContaining({
            id: 10100208,
            accessToken: 'access-token-0208',
            expiredAt: new Date('2026-09-09T18:15:00.000Z'),
          }),
        },
      ]

      test.each(cases)('accessTokenRecord.id: $params.accessTokenRecord.id', async ({
        params,
        expected,
      }) => {
        await StaffMember.create(params.staffMember)
        await StaffMemberAccessToken.create(params.accessTokenRecord)
        const sessionClerk = SessionClerk.create({
          AccessTokenModel: StaffMemberAccessToken,
          RefreshTokenModel: StaffMemberRefreshToken,
        })

        const args = {
          accessToken: params.accessTokenRecord.accessToken,
        }

        const actual = await sessionClerk.findAccessToken(args)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SessionClerk', () => {
  describe('#findAccessToken()', () => {
    describe('should refuse an access token no row holds', () => {
      const cases = [
        {
          params: {
            staffMember: {
              id: 10100229,
              name: 'staff member whose row is not the one asked for 10100229',
            },
            accessTokenRecord: {
              id: 10100209,
              StaffMemberId: 10100229,
              accessToken: 'access-token-0209',
              sessionKey: 'session-key-0209',
              generatedAt: new Date('2026-09-10T19:00:00.000Z'),
              expiredAt: new Date('2026-09-10T19:15:00.000Z'),
            },
            accessToken: 'access-token-9909', // minted by nobody
          },
        },
        {
          params: {
            staffMember: {
              id: 10100230,
              name: 'staff member whose row is not the other one asked for 10100230',
            },
            accessTokenRecord: {
              id: 10100210,
              StaffMemberId: 10100230,
              accessToken: 'access-token-0210',
              sessionKey: 'session-key-0210',
              generatedAt: new Date('2026-09-11T20:00:00.000Z'),
              expiredAt: new Date('2026-09-11T20:15:00.000Z'),
            },
            accessToken: 'access-token-9910', // minted by nobody
          },
        },
      ]

      test.each(cases)('accessToken: $params.accessToken', async ({
        params,
      }) => {
        await StaffMember.create(params.staffMember)
        await StaffMemberAccessToken.create(params.accessTokenRecord)
        const sessionClerk = SessionClerk.create({
          AccessTokenModel: StaffMemberAccessToken,
          RefreshTokenModel: StaffMemberRefreshToken,
        })

        const args = {
          accessToken: params.accessToken,
        }

        const actual = await sessionClerk.findAccessToken(args)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('SessionClerk', () => {
  describe('#rotateSession()', () => {
    describe('should issue the next pair in the same series', () => {
      const cases = [
        {
          params: {
            staffMember: {
              id: 10100241,
              name: 'staff member rotating a session 10100241',
            },
            sessionKey: 'session-key-0241',
            savedAt: new Date('2026-09-12T09:00:00.000Z'),
            spentAt: new Date('2026-09-12T09:14:00.000Z'),
          },
          expected: expect.objectContaining({
            accessTokenEntity: expect.objectContaining({
              sessionKey: 'session-key-0241',
              generatedAt: new Date('2026-09-12T09:14:00.000Z'),
            }),
            refreshTokenEntity: expect.objectContaining({
              sessionKey: 'session-key-0241',
              usedAt: null,
              revokedAt: null,
            }),
            refreshToken: expect.any(String),
          }),
        },
        {
          params: {
            staffMember: {
              id: 10100242,
              name: 'staff member rotating another session 10100242',
            },
            sessionKey: 'session-key-0242',
            savedAt: new Date('2026-09-13T10:00:00.000Z'),
            spentAt: new Date('2026-09-13T10:14:00.000Z'),
          },
          expected: expect.objectContaining({
            accessTokenEntity: expect.objectContaining({
              sessionKey: 'session-key-0242',
              generatedAt: new Date('2026-09-13T10:14:00.000Z'),
            }),
            refreshTokenEntity: expect.objectContaining({
              sessionKey: 'session-key-0242',
              usedAt: null,
              revokedAt: null,
            }),
            refreshToken: expect.any(String),
          }),
        },
      ]

      test.each(cases)('staffMember.id: $params.staffMember.id', async ({
        params,
        expected,
      }) => {
        await StaffMember.create(params.staffMember)
        const sessionClerk = SessionClerk.create({
          AccessTokenModel: StaffMemberAccessToken,
          RefreshTokenModel: StaffMemberRefreshToken,
        })
        const savingResult = await sessionClerk.saveSession({
          userId: params.staffMember.id,
          sessionKey: params.sessionKey,
          now: params.savedAt,
        })

        const args = {
          refreshTokenEntity: savingResult.credentialPair.refreshTokenEntity,
          now: params.spentAt,
        }

        const rotatingResult = await sessionClerk.rotateSession(args)
        const actual = rotatingResult.credentialPair

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SessionClerk', () => {
  describe('#rotateSession()', () => {
    describe('when the refresh token was already spent', () => {
      describe('should refuse the second presentation', () => {
        const cases = [
          {
            params: {
              staffMember: {
                id: 10100243,
                name: 'staff member presenting a spent token 10100243',
              },
              sessionKey: 'session-key-0243',
              savedAt: new Date('2026-09-14T09:00:00.000Z'),
              spentAt: new Date('2026-09-14T09:14:00.000Z'),
              reusedAt: new Date('2026-09-14T09:20:00.000Z'),
            },
            expected: new Error('The refresh token could not be spent'),
          },
          {
            params: {
              staffMember: {
                id: 10100244,
                name: 'staff member presenting another spent token 10100244',
              },
              sessionKey: 'session-key-0244',
              savedAt: new Date('2026-09-15T10:00:00.000Z'),
              spentAt: new Date('2026-09-15T10:14:00.000Z'),
              reusedAt: new Date('2026-09-15T10:20:00.000Z'),
            },
            expected: new Error('The refresh token could not be spent'),
          },
        ]

        test.each(cases)('staffMember.id: $params.staffMember.id', async ({
          params,
          expected,
        }) => {
          await StaffMember.create(params.staffMember)
          const sessionClerk = SessionClerk.create({
            AccessTokenModel: StaffMemberAccessToken,
            RefreshTokenModel: StaffMemberRefreshToken,
          })
          const savingResult = await sessionClerk.saveSession({
            userId: params.staffMember.id,
            sessionKey: params.sessionKey,
            now: params.savedAt,
          })
          const presentedEntity = savingResult.credentialPair.refreshTokenEntity
          await sessionClerk.rotateSession({
            refreshTokenEntity: presentedEntity,
            now: params.spentAt,
          })

          const rotatingResult = await sessionClerk.rotateSession({
            refreshTokenEntity: presentedEntity,
            now: params.reusedAt,
          })
          const actual = rotatingResult.error

          expect(actual)
            .toEqual(expected)
        })
      })
    })
  })
})

describe('SessionClerk', () => {
  describe('#rotateSession()', () => {
    describe('when the refresh token was already spent', () => {
      describe('should hand back no new pair', () => {
        const cases = [
          {
            params: {
              staffMember: {
                id: 10100245,
                name: 'staff member handed no new pair 10100245',
              },
              sessionKey: 'session-key-0245',
              savedAt: new Date('2026-09-16T09:00:00.000Z'),
              spentAt: new Date('2026-09-16T09:14:00.000Z'),
              reusedAt: new Date('2026-09-16T09:20:00.000Z'),
            },
          },
          {
            params: {
              staffMember: {
                id: 10100246,
                name: 'staff member handed no other new pair 10100246',
              },
              sessionKey: 'session-key-0246',
              savedAt: new Date('2026-09-17T10:00:00.000Z'),
              spentAt: new Date('2026-09-17T10:14:00.000Z'),
              reusedAt: new Date('2026-09-17T10:20:00.000Z'),
            },
          },
        ]

        test.each(cases)('staffMember.id: $params.staffMember.id', async ({
          params,
        }) => {
          await StaffMember.create(params.staffMember)
          const sessionClerk = SessionClerk.create({
            AccessTokenModel: StaffMemberAccessToken,
            RefreshTokenModel: StaffMemberRefreshToken,
          })
          const savingResult = await sessionClerk.saveSession({
            userId: params.staffMember.id,
            sessionKey: params.sessionKey,
            now: params.savedAt,
          })
          const presentedEntity = savingResult.credentialPair.refreshTokenEntity
          await sessionClerk.rotateSession({
            refreshTokenEntity: presentedEntity,
            now: params.spentAt,
          })

          const rotatingResult = await sessionClerk.rotateSession({
            refreshTokenEntity: presentedEntity,
            now: params.reusedAt,
          })
          const actual = rotatingResult.credentialPair

          expect(actual)
            .toBeNull()
        })
      })
    })
  })
})

describe('SessionClerk', () => {
  describe('#rotateSession()', () => {
    describe('when the refresh token was already spent', () => {
      /*
       * The proof the revocation outlives the refusal that reports it. The reuse attempt happens
       * in Arrange; the Act reads back what the database holds afterwards, through the clerk's own
       * window on it. Revoking inside the transaction the refusal rolls back would leave this
       * `revokedAt` null.
       */
      describe('should revoke the refresh token the reuse presented', () => {
        const cases = [
          {
            params: {
              staffMember: {
                id: 10100247,
                name: 'staff member whose presented token is revoked 10100247',
              },
              sessionKey: 'session-key-0247',
              savedAt: new Date('2026-09-18T09:00:00.000Z'),
              spentAt: new Date('2026-09-18T09:14:00.000Z'),
              reusedAt: new Date('2026-09-18T09:20:00.000Z'),
            },
            expected: expect.objectContaining({
              sessionKey: 'session-key-0247',
              usedAt: new Date('2026-09-18T09:14:00.000Z'),
              revokedAt: new Date('2026-09-18T09:20:00.000Z'),
            }),
          },
          {
            params: {
              staffMember: {
                id: 10100248,
                name: 'staff member whose other presented token is revoked 10100248',
              },
              sessionKey: 'session-key-0248',
              savedAt: new Date('2026-09-19T10:00:00.000Z'),
              spentAt: new Date('2026-09-19T10:14:00.000Z'),
              reusedAt: new Date('2026-09-19T10:20:00.000Z'),
            },
            expected: expect.objectContaining({
              sessionKey: 'session-key-0248',
              usedAt: new Date('2026-09-19T10:14:00.000Z'),
              revokedAt: new Date('2026-09-19T10:20:00.000Z'),
            }),
          },
        ]

        test.each(cases)('staffMember.id: $params.staffMember.id', async ({
          params,
          expected,
        }) => {
          await StaffMember.create(params.staffMember)
          const sessionClerk = SessionClerk.create({
            AccessTokenModel: StaffMemberAccessToken,
            RefreshTokenModel: StaffMemberRefreshToken,
          })
          const savingResult = await sessionClerk.saveSession({
            userId: params.staffMember.id,
            sessionKey: params.sessionKey,
            now: params.savedAt,
          })
          const presentedEntity = savingResult.credentialPair.refreshTokenEntity
          await sessionClerk.rotateSession({
            refreshTokenEntity: presentedEntity,
            now: params.spentAt,
          })
          await sessionClerk.rotateSession({
            refreshTokenEntity: presentedEntity,
            now: params.reusedAt,
          })

          const actual = await sessionClerk.findRefreshToken({
            refreshToken: savingResult.credentialPair.refreshToken,
          })

          expect(actual)
            .toEqual(expected)
        })
      })
    })
  })
})

describe('SessionClerk', () => {
  describe('#rotateSession()', () => {
    describe('when the refresh token was already spent', () => {
      describe('should revoke the refresh token the rotation had issued', () => {
        const cases = [
          {
            params: {
              staffMember: {
                id: 10100249,
                name: 'staff member whose successor token is revoked 10100249',
              },
              sessionKey: 'session-key-0249',
              savedAt: new Date('2026-09-20T09:00:00.000Z'),
              spentAt: new Date('2026-09-20T09:14:00.000Z'),
              reusedAt: new Date('2026-09-20T09:20:00.000Z'),
            },
            expected: expect.objectContaining({
              sessionKey: 'session-key-0249',
              usedAt: null, // never spent, and now never will be
              revokedAt: new Date('2026-09-20T09:20:00.000Z'),
            }),
          },
          {
            params: {
              staffMember: {
                id: 10100250,
                name: 'staff member whose other successor token is revoked 10100250',
              },
              sessionKey: 'session-key-0250',
              savedAt: new Date('2026-09-21T10:00:00.000Z'),
              spentAt: new Date('2026-09-21T10:14:00.000Z'),
              reusedAt: new Date('2026-09-21T10:20:00.000Z'),
            },
            expected: expect.objectContaining({
              sessionKey: 'session-key-0250',
              usedAt: null, // never spent, and now never will be
              revokedAt: new Date('2026-09-21T10:20:00.000Z'),
            }),
          },
        ]

        test.each(cases)('staffMember.id: $params.staffMember.id', async ({
          params,
          expected,
        }) => {
          await StaffMember.create(params.staffMember)
          const sessionClerk = SessionClerk.create({
            AccessTokenModel: StaffMemberAccessToken,
            RefreshTokenModel: StaffMemberRefreshToken,
          })
          const savingResult = await sessionClerk.saveSession({
            userId: params.staffMember.id,
            sessionKey: params.sessionKey,
            now: params.savedAt,
          })
          const presentedEntity = savingResult.credentialPair.refreshTokenEntity
          const rotatingResult = await sessionClerk.rotateSession({
            refreshTokenEntity: presentedEntity,
            now: params.spentAt,
          })
          await sessionClerk.rotateSession({
            refreshTokenEntity: presentedEntity,
            now: params.reusedAt,
          })

          const actual = await sessionClerk.findRefreshToken({
            refreshToken: rotatingResult.credentialPair.refreshToken,
          })

          expect(actual)
            .toEqual(expected)
        })
      })
    })
  })
})

describe('SessionClerk', () => {
  describe('#rotateSession()', () => {
    describe('when the refresh token was already spent', () => {
      describe('should delete the access tokens the series handed out', () => {
        const cases = [
          {
            params: {
              staffMember: {
                id: 10100251,
                name: 'staff member whose access tokens are deleted 10100251',
              },
              sessionKey: 'session-key-0251',
              savedAt: new Date('2026-09-22T09:00:00.000Z'),
              spentAt: new Date('2026-09-22T09:14:00.000Z'),
              reusedAt: new Date('2026-09-22T09:20:00.000Z'),
            },
          },
          {
            params: {
              staffMember: {
                id: 10100252,
                name: 'staff member whose other access tokens are deleted 10100252',
              },
              sessionKey: 'session-key-0252',
              savedAt: new Date('2026-09-23T10:00:00.000Z'),
              spentAt: new Date('2026-09-23T10:14:00.000Z'),
              reusedAt: new Date('2026-09-23T10:20:00.000Z'),
            },
          },
        ]

        test.each(cases)('staffMember.id: $params.staffMember.id', async ({
          params,
        }) => {
          await StaffMember.create(params.staffMember)
          const sessionClerk = SessionClerk.create({
            AccessTokenModel: StaffMemberAccessToken,
            RefreshTokenModel: StaffMemberRefreshToken,
          })
          const savingResult = await sessionClerk.saveSession({
            userId: params.staffMember.id,
            sessionKey: params.sessionKey,
            now: params.savedAt,
          })
          const presentedEntity = savingResult.credentialPair.refreshTokenEntity
          await sessionClerk.rotateSession({
            refreshTokenEntity: presentedEntity,
            now: params.spentAt,
          })
          await sessionClerk.rotateSession({
            refreshTokenEntity: presentedEntity,
            now: params.reusedAt,
          })

          const actual = await sessionClerk.findAccessToken({
            accessToken: savingResult.credentialPair.accessTokenEntity.accessToken,
          })

          expect(actual)
            .toBeNull()
        })
      })
    })
  })
})

describe('SessionClerk', () => {
  describe('#rotateSession()', () => {
    describe('when the refresh token was revoked without being spent', () => {
      /*
       * The state signing out leaves behind: `revokedAt` set, `usedAt` still null. The clerk is
       * driven directly here, with no resolver pre-check in front of it, because the guard on
       * `#spendRefreshToken()` — not a caller — is what has to refuse this.
       */
      describe('should refuse it', () => {
        const cases = [
          {
            params: {
              staffMember: {
                id: 10100261,
                name: 'staff member who signed out 10100261',
              },
              sessionKey: 'session-key-0261',
              savedAt: new Date('2026-09-30T09:00:00.000Z'),
              revokedAt: new Date('2026-09-30T09:10:00.000Z'),
              presentedAt: new Date('2026-09-30T09:20:00.000Z'),
            },
            expected: new Error('The refresh token could not be spent'),
          },
          {
            params: {
              staffMember: {
                id: 10100262,
                name: 'staff member who also signed out 10100262',
              },
              sessionKey: 'session-key-0262',
              savedAt: new Date('2026-10-01T10:00:00.000Z'),
              revokedAt: new Date('2026-10-01T10:10:00.000Z'),
              presentedAt: new Date('2026-10-01T10:20:00.000Z'),
            },
            expected: new Error('The refresh token could not be spent'),
          },
        ]

        test.each(cases)('staffMember.id: $params.staffMember.id', async ({
          params,
          expected,
        }) => {
          await StaffMember.create(params.staffMember)
          const sessionClerk = SessionClerk.create({
            AccessTokenModel: StaffMemberAccessToken,
            RefreshTokenModel: StaffMemberRefreshToken,
          })
          const savingResult = await sessionClerk.saveSession({
            userId: params.staffMember.id,
            sessionKey: params.sessionKey,
            now: params.savedAt,
          })
          await sessionClerk.revokeSession({
            sessionKey: params.sessionKey,
            now: params.revokedAt,
          })

          const rotatingResult = await sessionClerk.rotateSession({
            refreshTokenEntity: savingResult.credentialPair.refreshTokenEntity,
            now: params.presentedAt,
          })
          const actual = rotatingResult.error

          expect(actual)
            .toEqual(expected)
        })
      })
    })
  })
})

describe('SessionClerk', () => {
  describe('#rotateSession()', () => {
    describe('when the refresh token was revoked without being spent', () => {
      describe('should hand back no new pair', () => {
        const cases = [
          {
            params: {
              staffMember: {
                id: 10100263,
                name: 'staff member handed no pair after signing out 10100263',
              },
              sessionKey: 'session-key-0263',
              savedAt: new Date('2026-10-02T09:00:00.000Z'),
              revokedAt: new Date('2026-10-02T09:10:00.000Z'),
              presentedAt: new Date('2026-10-02T09:20:00.000Z'),
            },
          },
          {
            params: {
              staffMember: {
                id: 10100264,
                name: 'staff member also handed no pair after signing out 10100264',
              },
              sessionKey: 'session-key-0264',
              savedAt: new Date('2026-10-03T10:00:00.000Z'),
              revokedAt: new Date('2026-10-03T10:10:00.000Z'),
              presentedAt: new Date('2026-10-03T10:20:00.000Z'),
            },
          },
        ]

        test.each(cases)('staffMember.id: $params.staffMember.id', async ({
          params,
        }) => {
          await StaffMember.create(params.staffMember)
          const sessionClerk = SessionClerk.create({
            AccessTokenModel: StaffMemberAccessToken,
            RefreshTokenModel: StaffMemberRefreshToken,
          })
          const savingResult = await sessionClerk.saveSession({
            userId: params.staffMember.id,
            sessionKey: params.sessionKey,
            now: params.savedAt,
          })
          await sessionClerk.revokeSession({
            sessionKey: params.sessionKey,
            now: params.revokedAt,
          })

          const rotatingResult = await sessionClerk.rotateSession({
            refreshTokenEntity: savingResult.credentialPair.refreshTokenEntity,
            now: params.presentedAt,
          })
          const actual = rotatingResult.credentialPair

          expect(actual)
            .toBeNull()
        })
      })
    })
  })
})

describe('SessionClerk', () => {
  describe('#rotateSession()', () => {
    describe('when the refresh token has expired without being spent or revoked', () => {
      /*
       * A fortnight-old cookie nobody spent. The row is built with an explicit `expiredAt` so the
       * boundary is exact and does not move with `AUTH_REFRESH_TOKEN_TTL_DAYS`; the first case
       * presents it at the very instant it expires, which section 9.7's model counts as expired.
       */
      describe('should refuse it', () => {
        const cases = [
          {
            params: {
              staffMember: {
                id: 10100265,
                name: 'staff member holding an expired refresh token 10100265',
              },
              sessionKey: 'session-key-0265',
              refreshToken: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb0265',
              generatedAt: new Date('2026-09-01T09:00:00.000Z'),
              expiredAt: new Date('2026-09-15T09:00:00.000Z'),
              presentedAt: new Date('2026-09-15T09:00:00.000Z'), // the expiry instant itself
            },
            expected: new Error('The refresh token could not be spent'),
          },
          {
            params: {
              staffMember: {
                id: 10100266,
                name: 'staff member holding a long expired refresh token 10100266',
              },
              sessionKey: 'session-key-0266',
              refreshToken: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb0266',
              generatedAt: new Date('2026-09-02T10:00:00.000Z'),
              expiredAt: new Date('2026-09-16T10:00:00.000Z'),
              presentedAt: new Date('2026-09-16T10:00:00.001Z'), // one millisecond past it
            },
            expected: new Error('The refresh token could not be spent'),
          },
        ]

        test.each(cases)('staffMember.id: $params.staffMember.id', async ({
          params,
          expected,
        }) => {
          await StaffMember.create(params.staffMember)
          const refreshTokenEntity = StaffMemberRefreshToken.buildWithGeneratedAttributes({
            userId: params.staffMember.id,
            sessionKey: params.sessionKey,
            refreshToken: params.refreshToken,
            generatedAt: params.generatedAt,
            expiredAt: params.expiredAt,
          })
          await refreshTokenEntity.save()
          const sessionClerk = SessionClerk.create({
            AccessTokenModel: StaffMemberAccessToken,
            RefreshTokenModel: StaffMemberRefreshToken,
          })

          const rotatingResult = await sessionClerk.rotateSession({
            refreshTokenEntity,
            now: params.presentedAt,
          })
          const actual = rotatingResult.error

          expect(actual)
            .toEqual(expected)
        })
      })
    })
  })
})

describe('SessionClerk', () => {
  describe('#rotateSession()', () => {
    describe('when the refresh token has expired without being spent or revoked', () => {
      describe('should hand back no new pair', () => {
        const cases = [
          {
            params: {
              staffMember: {
                id: 10100267,
                name: 'staff member handed no pair on an expired token 10100267',
              },
              sessionKey: 'session-key-0267',
              refreshToken: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb0267',
              generatedAt: new Date('2026-09-03T09:00:00.000Z'),
              expiredAt: new Date('2026-09-17T09:00:00.000Z'),
              presentedAt: new Date('2026-09-17T09:00:00.000Z'), // the expiry instant itself
            },
          },
          {
            params: {
              staffMember: {
                id: 10100268,
                name: 'staff member also handed no pair on an expired token 10100268',
              },
              sessionKey: 'session-key-0268',
              refreshToken: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb0268',
              generatedAt: new Date('2026-09-04T10:00:00.000Z'),
              expiredAt: new Date('2026-09-18T10:00:00.000Z'),
              presentedAt: new Date('2026-09-25T10:00:00.000Z'), // a week past it
            },
          },
        ]

        test.each(cases)('staffMember.id: $params.staffMember.id', async ({
          params,
        }) => {
          await StaffMember.create(params.staffMember)
          const refreshTokenEntity = StaffMemberRefreshToken.buildWithGeneratedAttributes({
            userId: params.staffMember.id,
            sessionKey: params.sessionKey,
            refreshToken: params.refreshToken,
            generatedAt: params.generatedAt,
            expiredAt: params.expiredAt,
          })
          await refreshTokenEntity.save()
          const sessionClerk = SessionClerk.create({
            AccessTokenModel: StaffMemberAccessToken,
            RefreshTokenModel: StaffMemberRefreshToken,
          })

          const rotatingResult = await sessionClerk.rotateSession({
            refreshTokenEntity,
            now: params.presentedAt,
          })
          const actual = rotatingResult.credentialPair

          expect(actual)
            .toBeNull()
        })
      })
    })
  })
})

describe('SessionClerk', () => {
  describe('#rotateSession()', () => {
    describe('when the caller supplies the transaction a reuse is detected in', () => {
      /*
       * The other route into the reuse path. A caller that joins its own transaction and commits it
       * — which is what `#shouldRollBack()` tells it to do for this refusal — keeps the revocation.
       */
      describe('should revoke the series in that transaction', () => {
        const cases = [
          {
            params: {
              staffMember: {
                id: 10100253,
                name: 'staff member reused inside a joined transaction 10100253',
              },
              sessionKey: 'session-key-0253',
              savedAt: new Date('2026-09-24T09:00:00.000Z'),
              spentAt: new Date('2026-09-24T09:14:00.000Z'),
              reusedAt: new Date('2026-09-24T09:20:00.000Z'),
            },
            expected: expect.objectContaining({
              sessionKey: 'session-key-0253',
              usedAt: new Date('2026-09-24T09:14:00.000Z'),
              revokedAt: new Date('2026-09-24T09:20:00.000Z'),
            }),
          },
          {
            params: {
              staffMember: {
                id: 10100254,
                name: 'staff member reused inside another joined transaction 10100254',
              },
              sessionKey: 'session-key-0254',
              savedAt: new Date('2026-09-25T10:00:00.000Z'),
              spentAt: new Date('2026-09-25T10:14:00.000Z'),
              reusedAt: new Date('2026-09-25T10:20:00.000Z'),
            },
            expected: expect.objectContaining({
              sessionKey: 'session-key-0254',
              usedAt: new Date('2026-09-25T10:14:00.000Z'),
              revokedAt: new Date('2026-09-25T10:20:00.000Z'),
            }),
          },
        ]

        test.each(cases)('staffMember.id: $params.staffMember.id', async ({
          params,
          expected,
        }) => {
          await StaffMember.create(params.staffMember)
          const sessionClerk = SessionClerk.create({
            AccessTokenModel: StaffMemberAccessToken,
            RefreshTokenModel: StaffMemberRefreshToken,
          })
          const savingResult = await sessionClerk.saveSession({
            userId: params.staffMember.id,
            sessionKey: params.sessionKey,
            now: params.savedAt,
          })
          const presentedEntity = savingResult.credentialPair.refreshTokenEntity
          await sessionClerk.rotateSession({
            refreshTokenEntity: presentedEntity,
            now: params.spentAt,
          })
          await StaffMemberAccessToken.beginTransaction(async transaction => {
            await sessionClerk.rotateSession({
              refreshTokenEntity: presentedEntity,
              now: params.reusedAt,
              transaction,
            })
          })

          const actual = await sessionClerk.findRefreshToken({
            refreshToken: savingResult.credentialPair.refreshToken,
          })

          expect(actual)
            .toEqual(expected)
        })
      })
    })
  })
})

describe('SessionClerk', () => {
  describe('#rotateSession()', () => {
    describe('when revoking the reused series fails', () => {
      describe('should report the revocation error', () => {
        const cases = [
          {
            params: {
              staffMember: {
                id: 10100255,
                name: 'staff member whose revocation fails 10100255',
              },
              sessionKey: 'session-key-0255',
              savedAt: new Date('2026-09-26T09:00:00.000Z'),
              spentAt: new Date('2026-09-26T09:14:00.000Z'),
              reusedAt: new Date('2026-09-26T09:20:00.000Z'),
            },
            mockRevokingError: new Error('session-clerk-revoking-failure-0001'),
            expected: new Error('session-clerk-revoking-failure-0001'),
          },
          {
            params: {
              staffMember: {
                id: 10100256,
                name: 'staff member whose revocation fails otherwise 10100256',
              },
              sessionKey: 'session-key-0256',
              savedAt: new Date('2026-09-27T10:00:00.000Z'),
              spentAt: new Date('2026-09-27T10:14:00.000Z'),
              reusedAt: new Date('2026-09-27T10:20:00.000Z'),
            },
            mockRevokingError: new Error('session-clerk-revoking-failure-0002'),
            expected: new Error('session-clerk-revoking-failure-0002'),
          },
        ]

        test.each(cases)('staffMember.id: $params.staffMember.id', async ({
          params,
          mockRevokingError,
          expected,
        }) => {
          await StaffMember.create(params.staffMember)
          const sessionClerk = SessionClerk.create({
            AccessTokenModel: StaffMemberAccessToken,
            RefreshTokenModel: StaffMemberRefreshToken,
          })
          const savingResult = await sessionClerk.saveSession({
            userId: params.staffMember.id,
            sessionKey: params.sessionKey,
            now: params.savedAt,
          })
          const presentedEntity = savingResult.credentialPair.refreshTokenEntity
          await sessionClerk.rotateSession({
            refreshTokenEntity: presentedEntity,
            now: params.spentAt,
          })

          // A database failure inside the revocation cannot be reached with real rows.
          jest.spyOn(sessionClerk, 'revokeSession')
            .mockResolvedValue(RevokingSessionResult.create({
              error: mockRevokingError,
            }))

          const rotatingResult = await sessionClerk.rotateSession({
            refreshTokenEntity: presentedEntity,
            now: params.reusedAt,
          })
          const actual = rotatingResult.error

          expect(actual)
            .toEqual(expected)
        })
      })
    })
  })
})

describe('SessionClerk', () => {
  describe('#rotateSession()', () => {
    describe('when revoking the reused series fails', () => {
      describe('should leave the series unrevoked rather than claim it', () => {
        const cases = [
          {
            params: {
              staffMember: {
                id: 10100257,
                name: 'staff member whose series stays unrevoked 10100257',
              },
              sessionKey: 'session-key-0257',
              savedAt: new Date('2026-09-28T09:00:00.000Z'),
              spentAt: new Date('2026-09-28T09:14:00.000Z'),
              reusedAt: new Date('2026-09-28T09:20:00.000Z'),
            },
            mockRevokingError: new Error('session-clerk-revoking-failure-0003'),
            expected: expect.objectContaining({
              sessionKey: 'session-key-0257',
              usedAt: new Date('2026-09-28T09:14:00.000Z'),
              revokedAt: null, // the refusal claimed no revocation, and wrote none
            }),
          },
          {
            params: {
              staffMember: {
                id: 10100258,
                name: 'staff member whose other series stays unrevoked 10100258',
              },
              sessionKey: 'session-key-0258',
              savedAt: new Date('2026-09-29T10:00:00.000Z'),
              spentAt: new Date('2026-09-29T10:14:00.000Z'),
              reusedAt: new Date('2026-09-29T10:20:00.000Z'),
            },
            mockRevokingError: new Error('session-clerk-revoking-failure-0004'),
            expected: expect.objectContaining({
              sessionKey: 'session-key-0258',
              usedAt: new Date('2026-09-29T10:14:00.000Z'),
              revokedAt: null, // the refusal claimed no revocation, and wrote none
            }),
          },
        ]

        test.each(cases)('staffMember.id: $params.staffMember.id', async ({
          params,
          mockRevokingError,
          expected,
        }) => {
          await StaffMember.create(params.staffMember)
          const sessionClerk = SessionClerk.create({
            AccessTokenModel: StaffMemberAccessToken,
            RefreshTokenModel: StaffMemberRefreshToken,
          })
          const savingResult = await sessionClerk.saveSession({
            userId: params.staffMember.id,
            sessionKey: params.sessionKey,
            now: params.savedAt,
          })
          const presentedEntity = savingResult.credentialPair.refreshTokenEntity
          await sessionClerk.rotateSession({
            refreshTokenEntity: presentedEntity,
            now: params.spentAt,
          })

          // A database failure inside the revocation cannot be reached with real rows.
          jest.spyOn(sessionClerk, 'revokeSession')
            .mockResolvedValue(RevokingSessionResult.create({
              error: mockRevokingError,
            }))
          await sessionClerk.rotateSession({
            refreshTokenEntity: presentedEntity,
            now: params.reusedAt,
          })

          const actual = await sessionClerk.findRefreshToken({
            refreshToken: savingResult.credentialPair.refreshToken,
          })

          expect(actual)
            .toEqual(expected)
        })
      })
    })
  })
})
