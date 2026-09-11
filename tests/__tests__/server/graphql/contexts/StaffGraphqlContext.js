import BaseAppGraphqlContext from '../../../../../server/graphql/contexts/BaseAppGraphqlContext.js'
import StaffGraphqlContext from '../../../../../server/graphql/contexts/StaffGraphqlContext.js'

import SessionClerk from '../../../../../app/session/SessionClerk.js'

import StaffMember from '../../../../../sequelize/models/StaffMember.js'
import StaffMemberAccessToken from '../../../../../sequelize/models/StaffMemberAccessToken.js'
import StaffMemberRefreshToken from '../../../../../sequelize/models/StaffMemberRefreshToken.js'

/*
 * `.findUser()` is not here. It needs an access token row to find, no seeder writes one, and a
 * fixture that inserts is a write — so it sits in `tests/_orders/StaffGraphqlContext/`, the same
 * placement `tests/_orders/SessionClerk/SessionClerk.js` reached for its own read-only finds.
 * `.findStaffMember()` stays here: the members of staff it reads are seeded already
 * (`sequelize/seeders/development/20260910120001-000001-staff_members.cjs`), so it writes nothing.
 */

describe('StaffGraphqlContext', () => {
  describe('super class', () => {
    test('to be BaseAppGraphqlContext', () => {
      const actual = StaffGraphqlContext.prototype

      expect(actual)
        .toBeInstanceOf(BaseAppGraphqlContext)
    })
  })
})

describe('StaffGraphqlContext', () => {
  describe('.get:SessionClerkCtor', () => {
    describe('to be SessionClerk', () => {
      test('should return the class', () => {
        const expected = SessionClerk

        const actual = StaffGraphqlContext.SessionClerkCtor

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('StaffGraphqlContext', () => {
  describe('.get:StaffMemberCtor', () => {
    describe('to be StaffMember', () => {
      test('should return the model', () => {
        const expected = StaffMember

        const actual = StaffGraphqlContext.StaffMemberCtor

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('StaffGraphqlContext', () => {
  describe('.get:StaffMemberAccessTokenCtor', () => {
    describe('to be StaffMemberAccessToken', () => {
      test('should return the model', () => {
        const expected = StaffMemberAccessToken

        const actual = StaffGraphqlContext.StaffMemberAccessTokenCtor

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('StaffGraphqlContext', () => {
  describe('.get:StaffMemberRefreshTokenCtor', () => {
    describe('to be StaffMemberRefreshToken', () => {
      test('should return the model', () => {
        const expected = StaffMemberRefreshToken

        const actual = StaffGraphqlContext.StaffMemberRefreshTokenCtor

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('StaffGraphqlContext', () => {
  describe('.createSessionClerk()', () => {
    describe('should be instance of SessionClerk', () => {
      test('should return a session clerk', () => {
        const expected = SessionClerk

        const actual = StaffGraphqlContext.createSessionClerk()

        expect(actual)
          .toBeInstanceOf(expected)
      })
    })
  })
})

describe('StaffGraphqlContext', () => {
  describe('.createSessionClerk()', () => {
    describe('should hold the staff member access token model', () => {
      test('should pass StaffMemberAccessToken to the clerk', () => {
        const expected = StaffMemberAccessToken

        const actual = StaffGraphqlContext.createSessionClerk()

        expect(actual)
          .toHaveProperty('AccessTokenModel', expected)
      })
    })
  })
})

describe('StaffGraphqlContext', () => {
  describe('.createSessionClerk()', () => {
    describe('should hold the staff member refresh token model', () => {
      test('should pass StaffMemberRefreshToken to the clerk', () => {
        const expected = StaffMemberRefreshToken

        const actual = StaffGraphqlContext.createSessionClerk()

        expect(actual)
          .toHaveProperty('RefreshTokenModel', expected)
      })
    })
  })
})

describe('StaffGraphqlContext', () => {
  describe('.findStaffMember()', () => {
    describe('should find the member of staff an id names', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
          },
          expected: expect.objectContaining({
            id: 10110001,
            name: 'Haruka Arai',
          }),
        },
        {
          params: {
            staffMemberId: 10110005,
          },
          expected: expect.objectContaining({
            id: 10110005,
            name: 'Rin Takahashi',
          }),
        },
        {
          // an account issued halfway — it holds an address and no password digest, and is still a
          // member of staff a live token may name
          params: {
            staffMemberId: 10110011,
          },
          expected: expect.objectContaining({
            id: 10110011,
            name: 'Sakura Umeda',
          }),
        },
      ]

      test.each(cases)('staffMemberId: $params.staffMemberId', async ({
        params,
        expected,
      }) => {
        const actual = await StaffGraphqlContext.findStaffMember(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('StaffGraphqlContext', () => {
  describe('.findStaffMember()', () => {
    describe('should return null when the id names nobody', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10100441,
          },
        },
        {
          params: {
            staffMemberId: 10100442,
          },
        },
      ]

      test.each(cases)('staffMemberId: $params.staffMemberId', async ({
        params,
      }) => {
        const actual = await StaffGraphqlContext.findStaffMember(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('StaffGraphqlContext', () => {
  describe('#get:staffMember', () => {
    describe('to return #userEntity', () => {
      const cases = [
        {
          factoryParams: {
            expressRequest: /** @type {*} */ ({}),
            requestParams: /** @type {*} */ ({}),
            engine: /** @type {*} */ ({}),
            userEntity: /** @type {*} */ ({
              id: 10100009,
            }),
            visa: /** @type {*} */ ({}),
            requestedAt: new Date('2026-09-01T01:02:03.004Z'),
            uuid: '98765432-abcd-0000-1234-000010100001',
          },
        },
        {
          factoryParams: {
            expressRequest: /** @type {*} */ ({}),
            requestParams: /** @type {*} */ ({}),
            engine: /** @type {*} */ ({}),
            userEntity: /** @type {*} */ ({
              id: 10100010,
            }),
            visa: /** @type {*} */ ({}),
            requestedAt: new Date('2026-09-02T05:06:07.008Z'),
            uuid: '98765432-abcd-0000-1234-000010100002',
          },
        },
      ]

      test.each(cases)('userEntity.id: $factoryParams.userEntity.id', ({
        factoryParams,
      }) => {
        const context = new StaffGraphqlContext(factoryParams)

        const actual = context.staffMember

        expect(actual)
          .toBe(factoryParams.userEntity) // same reference
      })
    })
  })
})

describe('StaffGraphqlContext', () => {
  describe('#get:staffMember', () => {
    describe('to return null on a request that carried no live access token', () => {
      const cases = [
        {
          factoryParams: {
            expressRequest: /** @type {*} */ ({}),
            requestParams: /** @type {*} */ ({}),
            engine: /** @type {*} */ ({}),
            userEntity: /** @type {*} */ (null),
            visa: /** @type {*} */ ({}),
            requestedAt: new Date('2026-09-03T09:10:11.012Z'),
            uuid: '98765432-abcd-0000-1234-000010100003',
          },
        },
        {
          factoryParams: {
            expressRequest: /** @type {*} */ ({}),
            requestParams: /** @type {*} */ ({}),
            engine: /** @type {*} */ ({}),
            userEntity: /** @type {*} */ (null),
            visa: /** @type {*} */ ({}),
            requestedAt: new Date('2026-09-04T13:14:15.016Z'),
            uuid: '98765432-abcd-0000-1234-000010100004',
          },
        },
      ]

      test.each(cases)('requestedAt: $factoryParams.requestedAt', ({
        factoryParams,
      }) => {
        const context = new StaffGraphqlContext(factoryParams)

        const actual = context.staffMember

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('StaffGraphqlContext', () => {
  describe('#get:staffMemberId', () => {
    describe('to return #userId', () => {
      const cases = [
        {
          factoryParams: {
            expressRequest: /** @type {*} */ ({}),
            requestParams: /** @type {*} */ ({}),
            engine: /** @type {*} */ ({}),
            userEntity: /** @type {*} */ ({
              id: 10100001,
            }),
            visa: /** @type {*} */ ({}),
            requestedAt: new Date('2026-09-05T17:18:19.020Z'),
            uuid: '98765432-abcd-0000-1234-000010100005',
          },
          expected: 10100001,
        },
        {
          factoryParams: {
            expressRequest: /** @type {*} */ ({}),
            requestParams: /** @type {*} */ ({}),
            engine: /** @type {*} */ ({}),
            userEntity: /** @type {*} */ ({
              id: 10100002,
            }),
            visa: /** @type {*} */ ({}),
            requestedAt: new Date('2026-09-06T21:22:23.024Z'),
            uuid: '98765432-abcd-0000-1234-000010100006',
          },
          expected: 10100002,
        },
      ]

      test.each(cases)('userEntity.id: $factoryParams.userEntity.id', ({
        factoryParams,
        expected,
      }) => {
        const context = new StaffGraphqlContext(factoryParams)

        const actual = context.staffMemberId

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('StaffGraphqlContext', () => {
  describe('#get:staffMemberId', () => {
    describe('to return null on a request that carried no live access token', () => {
      const cases = [
        {
          factoryParams: {
            expressRequest: /** @type {*} */ ({}),
            requestParams: /** @type {*} */ ({}),
            engine: /** @type {*} */ ({}),
            userEntity: /** @type {*} */ (null),
            visa: /** @type {*} */ ({}),
            requestedAt: new Date('2026-09-07T01:02:03.004Z'),
            uuid: '98765432-abcd-0000-1234-000010100007',
          },
        },
        {
          factoryParams: {
            expressRequest: /** @type {*} */ ({}),
            requestParams: /** @type {*} */ ({}),
            engine: /** @type {*} */ ({}),
            userEntity: /** @type {*} */ (null),
            visa: /** @type {*} */ ({}),
            requestedAt: new Date('2026-09-08T05:06:07.008Z'),
            uuid: '98765432-abcd-0000-1234-000010100008',
          },
        },
      ]

      test.each(cases)('requestedAt: $factoryParams.requestedAt', ({
        factoryParams,
      }) => {
        const context = new StaffGraphqlContext(factoryParams)

        const actual = context.staffMemberId

        expect(actual)
          .toBeNull()
      })
    })
  })
})
