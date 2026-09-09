import StaffMemberRefreshToken from '../../../../sequelize/models/StaffMemberRefreshToken.js'

import BaseAppRenchanModel from '../../../../sequelize/baseModel/BaseAppRenchanModel.js'

describe('StaffMemberRefreshToken', () => {
  describe('super class', () => {
    test('to be instance of BaseAppRenchanModel', () => {
      const actual = StaffMemberRefreshToken.prototype

      expect(actual)
        .toBeInstanceOf(BaseAppRenchanModel)
    })
  })
})

describe('StaffMemberRefreshToken', () => {
  describe('.isGeneratedToken()', () => {
    describe('should accept a token of the shape the generator mints', () => {
      const cases = [
        {
          params: {
            token: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
          },
        },
        {
          params: {
            token: '0000000000000000000000000000000000000000000000000000000000000000',
          },
        },
        {
          params: {
            token: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
          },
        },
      ]

      test.each(cases)('token: $params.token', ({
        params,
      }) => {
        const actual = StaffMemberRefreshToken.isGeneratedToken(params)

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('StaffMemberRefreshToken', () => {
  describe('.isGeneratedToken()', () => {
    describe('should refuse anything the generator would not have minted', () => {
      const cases = [
        {
          params: {
            token: '',
          },
        },
        {
          params: {
            token: 'a1b2c3d4',
          },
        },
        {
          params: {
            // one character short of the generator's length
            token: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f9',
          },
        },
        {
          params: {
            // one character past the generator's length
            token: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f901',
          },
        },
        {
          params: {
            // right length, but upper case hex is not what the generator emits
            token: 'A1B2C3D4E5F60718293A4B5C6D7E8F90A1B2C3D4E5F60718293A4B5C6D7E8F90',
          },
        },
        {
          params: {
            // right length, but not hex at all
            token: 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
          },
        },
        {
          params: {
            token: null,
          },
        },
      ]

      test.each(cases)('token: $params.token', ({
        params,
      }) => {
        const actual = StaffMemberRefreshToken.isGeneratedToken(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('StaffMemberRefreshToken', () => {
  describe('.buildWithGeneratedAttributes()', () => {
    describe('should refuse a token that could be presented as an empty one', () => {
      const cases = [
        {
          params: {
            userId: 10000800,
            sessionKey: 'session-key-of-the-empty-token-10000800',
            refreshToken: '',
            generatedAt: new Date('2026-09-01T01:02:03.004Z'),
          },
          expected: 'StaffMemberRefreshToken was handed a refreshToken that SessionCredentialGenerator did not mint',
        },
        {
          params: {
            userId: 10000801,
            sessionKey: 'session-key-of-the-short-token-10000801',
            refreshToken: 'a1b2c3d4',
            generatedAt: new Date('2026-09-02T02:03:04.005Z'),
          },
          expected: 'StaffMemberRefreshToken was handed a refreshToken that SessionCredentialGenerator did not mint',
        },
        {
          params: {
            userId: 10000802,
            sessionKey: 'session-key-of-the-upper-case-token-10000802',
            refreshToken: 'A1B2C3D4E5F60718293A4B5C6D7E8F90A1B2C3D4E5F60718293A4B5C6D7E8F90',
            generatedAt: new Date('2026-09-03T03:04:05.006Z'),
          },
          expected: 'StaffMemberRefreshToken was handed a refreshToken that SessionCredentialGenerator did not mint',
        },
        {
          params: {
            userId: 10000803,
            sessionKey: 'session-key-of-the-absent-token-10000803',
            refreshToken: null,
            generatedAt: new Date('2026-09-04T04:05:06.007Z'),
          },
          expected: 'StaffMemberRefreshToken was handed a refreshToken that SessionCredentialGenerator did not mint',
        },
      ]

      test.each(cases)('refreshToken: $params.refreshToken', ({
        params,
        expected,
      }) => {
        const actual = () => StaffMemberRefreshToken.buildWithGeneratedAttributes(params)

        expect(actual)
          .toThrow(expected)
      })
    })
  })
})

describe('StaffMemberRefreshToken', () => {
  describe('.buildWithGeneratedAttributes()', () => {
    describe('should digest a token the generator did mint', () => {
      const cases = [
        {
          params: {
            userId: 10000804,
            sessionKey: 'session-key-of-a-minted-token-10000804',
            refreshToken: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
            generatedAt: new Date('2026-09-05T05:06:07.008Z'),
            expiredAt: new Date('2026-09-19T05:06:07.008Z'),
          },
          expected: '79175e70eb2236876b0c003be58294690c0e36b44c0947ae80f599ea9d039833',
        },
        {
          params: {
            userId: 10000805,
            sessionKey: 'session-key-of-a-second-minted-token-10000805',
            refreshToken: '0000000000000000000000000000000000000000000000000000000000000000',
            generatedAt: new Date('2026-09-06T06:07:08.009Z'),
            expiredAt: new Date('2026-09-20T06:07:08.009Z'),
          },
          expected: '60e05bd1b195af2f94112fa7197a5c88289058840ce7c6df9693756bc6250f55',
        },
      ]

      test.each(cases)('refreshToken: $params.refreshToken', ({
        params,
        expected,
      }) => {
        const actual = StaffMemberRefreshToken.buildWithGeneratedAttributes(params)

        expect(actual.get('tokenHash'))
          .toBe(expected)
      })
    })
  })
})
