import BaseAppGraphqlContext from '../../../../../server/graphql/contexts/BaseAppGraphqlContext.js'
import StaffGraphqlContext from '../../../../../server/graphql/contexts/StaffGraphqlContext.js'

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
  describe('.findUser()', () => {
    describe('should match no session while the access token lookup is unimplemented', () => {
      const cases = [
        {
          params: {
            expressRequest: /** @type {*} */ ({}),
            accessToken: 'access-token-of-a-staff-member$alpha',
            requestedAt: new Date('2026-09-01T01:02:03.004Z'),
          },
        },
        {
          params: {
            expressRequest: /** @type {*} */ ({}),
            accessToken: 'access-token-of-a-staff-member$beta',
            requestedAt: new Date('2026-09-02T05:06:07.008Z'),
          },
        },
        {
          params: {
            expressRequest: /** @type {*} */ ({}),
            accessToken: null,
            requestedAt: new Date('2026-09-03T09:10:11.012Z'),
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
  describe('#get:staffMember', () => {
    describe('to return #userEntity', () => {
      const cases = [
        {
          params: {
            expressRequest: /** @type {*} */ ({}),
            requestParams: /** @type {*} */ ({}),
            engine: /** @type {*} */ ({}),
            userEntity: /** @type {*} */ ({
              label: 'staffMemberSigningInFirst',
              alpha: Symbol('alpha'),
            }),
            visa: /** @type {*} */ ({}),
            requestedAt: new Date('2026-09-01T01:02:03.004Z'),
            uuid: '98765432-abcd-0000-1234-000010100001',
          },
        },
        {
          params: {
            expressRequest: /** @type {*} */ ({}),
            requestParams: /** @type {*} */ ({}),
            engine: /** @type {*} */ ({}),
            userEntity: /** @type {*} */ ({
              label: 'staffMemberSigningInSecond',
              beta: Symbol('beta'),
            }),
            visa: /** @type {*} */ ({}),
            requestedAt: new Date('2026-09-02T05:06:07.008Z'),
            uuid: '98765432-abcd-0000-1234-000010100002',
          },
        },
      ]

      test.each(cases)('$params.userEntity.label', ({
        params,
      }) => {
        const context = new StaffGraphqlContext(params)

        const actual = context.staffMember

        expect(actual)
          .toBe(params.userEntity) // same reference
      })
    })
  })
})

describe('StaffGraphqlContext', () => {
  describe('#get:staffMember', () => {
    describe('to return null on a request that carried no live access token', () => {
      const cases = [
        {
          params: {
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
          params: {
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

      test.each(cases)('requestedAt: $params.requestedAt', ({
        params,
      }) => {
        const context = new StaffGraphqlContext(params)

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
          params: {
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
          params: {
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

      test.each(cases)('userEntity.id: $params.userEntity.id', ({
        params,
        expected,
      }) => {
        const context = new StaffGraphqlContext(params)

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
          params: {
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
          params: {
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

      test.each(cases)('requestedAt: $params.requestedAt', ({
        params,
      }) => {
        const context = new StaffGraphqlContext(params)

        const actual = context.staffMemberId

        expect(actual)
          .toBeNull()
      })
    })
  })
})
