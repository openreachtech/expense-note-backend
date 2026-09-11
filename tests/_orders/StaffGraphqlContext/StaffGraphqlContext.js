import StaffGraphqlContext from '../../../server/graphql/contexts/StaffGraphqlContext.js'

import StaffMemberAccessToken from '../../../sequelize/models/StaffMemberAccessToken.js'

/*
 * `.findUser()` reads and never writes, yet it sits here: every case needs an access token row to
 * find, no seeder writes one, and a fixture that inserts is a write.
 * `tests/_orders/SessionClerk/SessionClerk.js` reached the same placement for its own read-only
 * finds, and for the same reason.
 *
 * The members of staff are the seeded ones
 * (`sequelize/seeders/development/20260910120001-000001-staff_members.cjs`), so only the token row
 * is created here — and asserting the seeded `name` alongside the seeded `id` is what tells the
 * member of staff apart from the token row that names them.
 *
 * Row ids 10100401..10100450 are this file's block. Access tokens take 10100401.., and the two
 * ids naming nobody take 10100441.. — deliberately inside the block and deliberately unseeded.
 *
 * The access token values are short readable strings rather than 64 hex characters: nothing on the
 * read path judges the shape of a presented token, the unique index on `access_token` is what the
 * lookup uses, and a literal that fits on one line is what a failure log can be read against.
 */

describe('StaffGraphqlContext', () => {
  describe('.findUser()', () => {
    describe('should return the member of staff a live access token belongs to', () => {
      const cases = [
        {
          params: {
            accessTokenRecord: {
              id: 10100401,
              StaffMemberId: 10110001, // seeded: Haruka Arai
              accessToken: 'access-token-0401',
              sessionKey: 'session-key-0401',
              generatedAt: new Date('2026-09-11T10:00:00.000Z'),
              expiredAt: new Date('2026-09-11T10:15:00.000Z'),
            },
            expressRequest: /** @type {*} */ ({}),
            requestedAt: new Date('2026-09-11T10:14:59.999Z'), // one millisecond of life left
          },
          expected: expect.objectContaining({
            id: 10110001,
            name: 'Haruka Arai',
          }),
        },
        {
          params: {
            accessTokenRecord: {
              id: 10100402,
              StaffMemberId: 10110005, // seeded: Rin Takahashi
              accessToken: 'access-token-0402',
              sessionKey: 'session-key-0402',
              generatedAt: new Date('2026-09-12T11:00:00.000Z'),
              expiredAt: new Date('2026-09-12T11:15:00.000Z'),
            },
            expressRequest: /** @type {*} */ ({}),
            requestedAt: new Date('2026-09-12T11:00:00.000Z'), // the instant it was issued
          },
          expected: expect.objectContaining({
            id: 10110005,
            name: 'Rin Takahashi',
          }),
        },
      ]

      test.each(cases)('accessTokenRecord.id: $params.accessTokenRecord.id', async ({
        params,
        expected,
      }) => {
        await StaffMemberAccessToken.create(params.accessTokenRecord)

        const args = {
          expressRequest: params.expressRequest,
          accessToken: params.accessTokenRecord.accessToken,
          requestedAt: params.requestedAt,
        }

        const actual = await StaffGraphqlContext.findUser(args)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('StaffGraphqlContext', () => {
  describe('.findUser()', () => {
    describe('should refuse an access token whose fifteen minutes have run out', () => {
      const cases = [
        {
          params: {
            accessTokenRecord: {
              id: 10100403,
              StaffMemberId: 10110002, // seeded: Kenji Ogawa
              accessToken: 'access-token-0403',
              sessionKey: 'session-key-0403',
              generatedAt: new Date('2026-09-13T12:00:00.000Z'),
              expiredAt: new Date('2026-09-13T12:15:00.000Z'),
            },
            expressRequest: /** @type {*} */ ({}),
            requestedAt: new Date('2026-09-13T12:15:00.000Z'), // the expiry instant itself counts as expired
          },
        },
        {
          params: {
            accessTokenRecord: {
              id: 10100404,
              StaffMemberId: 10110003, // seeded: Mio Fukuda
              accessToken: 'access-token-0404',
              sessionKey: 'session-key-0404',
              generatedAt: new Date('2026-09-14T13:00:00.000Z'),
              expiredAt: new Date('2026-09-14T13:15:00.000Z'),
            },
            expressRequest: /** @type {*} */ ({}),
            requestedAt: new Date('2026-09-14T13:15:00.001Z'), // one millisecond past the expiry
          },
        },
      ]

      test.each(cases)('accessTokenRecord.id: $params.accessTokenRecord.id', async ({
        params,
      }) => {
        await StaffMemberAccessToken.create(params.accessTokenRecord)

        const args = {
          expressRequest: params.expressRequest,
          accessToken: params.accessTokenRecord.accessToken,
          requestedAt: params.requestedAt,
        }

        const actual = await StaffGraphqlContext.findUser(args)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('StaffGraphqlContext', () => {
  describe('.findUser()', () => {
    describe('should refuse an access token that names no member of staff', () => {
      const cases = [
        {
          params: {
            accessTokenRecord: {
              id: 10100405,
              StaffMemberId: 10100441, // names nobody; the tables carry no DB-level foreign key
              accessToken: 'access-token-0405',
              sessionKey: 'session-key-0405',
              generatedAt: new Date('2026-09-15T14:00:00.000Z'),
              expiredAt: new Date('2026-09-15T14:15:00.000Z'),
            },
            expressRequest: /** @type {*} */ ({}),
            requestedAt: new Date('2026-09-15T14:05:00.000Z'), // well inside the window
          },
        },
        {
          params: {
            accessTokenRecord: {
              id: 10100406,
              StaffMemberId: 10100442, // names nobody
              accessToken: 'access-token-0406',
              sessionKey: 'session-key-0406',
              generatedAt: new Date('2026-09-16T15:00:00.000Z'),
              expiredAt: new Date('2026-09-16T15:15:00.000Z'),
            },
            expressRequest: /** @type {*} */ ({}),
            requestedAt: new Date('2026-09-16T15:00:00.000Z'), // the instant it was issued
          },
        },
      ]

      test.each(cases)('accessTokenRecord.id: $params.accessTokenRecord.id', async ({
        params,
      }) => {
        await StaffMemberAccessToken.create(params.accessTokenRecord)

        const args = {
          expressRequest: params.expressRequest,
          accessToken: params.accessTokenRecord.accessToken,
          requestedAt: params.requestedAt,
        }

        const actual = await StaffGraphqlContext.findUser(args)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('StaffGraphqlContext', () => {
  describe('.findUser()', () => {
    describe('should refuse an access token that matches no row', () => {
      const cases = [
        {
          params: {
            expressRequest: /** @type {*} */ ({}),
            accessToken: 'access-token-that-was-never-issued-0447',
            requestedAt: new Date('2026-09-17T16:00:00.000Z'),
          },
        },
        {
          params: {
            expressRequest: /** @type {*} */ ({}),
            accessToken: 'access-token-that-was-never-issued-0448',
            requestedAt: new Date('2026-09-18T17:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('accessToken: $params.accessToken', async ({
        params,
      }) => {
        const actual = await StaffGraphqlContext.findUser(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('StaffGraphqlContext', () => {
  describe('.findUser()', () => {
    describe('should refuse a request that carried no access token, reading nothing', () => {
      const cases = [
        {
          params: {
            expressRequest: /** @type {*} */ ({}),
            accessToken: /** @type {*} */ (null),
            requestedAt: new Date('2026-09-19T18:00:00.000Z'),
          },
        },
        {
          params: {
            expressRequest: /** @type {*} */ ({}),
            accessToken: /** @type {*} */ (null),
            requestedAt: new Date('2026-09-20T19:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('requestedAt: $params.requestedAt', async ({
        params,
      }) => {
        const createSessionClerkSpy = jest.spyOn(StaffGraphqlContext, 'createSessionClerk')

        const actual = await StaffGraphqlContext.findUser(params)

        expect(actual)
          .toBeNull()
        expect(createSessionClerkSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})
