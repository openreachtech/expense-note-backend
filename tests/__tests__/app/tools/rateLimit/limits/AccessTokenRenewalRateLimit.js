import {
  Op,
} from 'sequelize'

import AccessTokenRenewalRateLimit from '../../../../../../app/tools/rateLimit/limits/AccessTokenRenewalRateLimit.js'

import BaseRateLimit from '../../../../../../app/tools/rateLimit/BaseRateLimit.js'

import StaffMemberRefreshToken from '../../../../../../sequelize/models/StaffMemberRefreshToken.js'

describe('AccessTokenRenewalRateLimit', () => {
  describe('super class', () => {
    test('to be instance of BaseRateLimit', () => {
      const received = AccessTokenRenewalRateLimit.prototype

      expect(received)
        .toBeInstanceOf(BaseRateLimit)
    })
  })
})

describe('AccessTokenRenewalRateLimit', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          factoryParams: {
            pointsAt: new Date('2026-09-10T09:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            pointsAt: new Date('2026-09-10T19:45:00.000Z'),
          },
        },
      ]

      test.each(cases)('pointsAt: $factoryParams.pointsAt', ({
        factoryParams,
      }) => {
        const actual = AccessTokenRenewalRateLimit.create(factoryParams)

        expect(actual)
          .toBeInstanceOf(AccessTokenRenewalRateLimit)
      })
    })
  })
})

describe('AccessTokenRenewalRateLimit', () => {
  describe('#get:EventModel', () => {
    test('should count the rows of staff_member_refresh_tokens', () => {
      // No table of its own: every rotation inserts a row here, so a series' rows inside the
      // last hour already are its renewal count.
      const rateLimit = AccessTokenRenewalRateLimit.create({
        pointsAt: new Date('2026-09-10T09:00:00.000Z'),
      })

      const actual = rateLimit.EventModel

      expect(actual)
        .toBe(StaffMemberRefreshToken) // same reference
    })
  })
})

describe('AccessTokenRenewalRateLimit', () => {
  describe('#get:keyFieldName', () => {
    test('should key on the refresh-token series', () => {
      const rateLimit = AccessTokenRenewalRateLimit.create({
        pointsAt: new Date('2026-09-10T09:00:00.000Z'),
      })
      const expected = 'sessionKey'

      const actual = rateLimit.keyFieldName

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('AccessTokenRenewalRateLimit', () => {
  describe('#get:timestampFieldName', () => {
    test('should read the instant off generatedAt', () => {
      const rateLimit = AccessTokenRenewalRateLimit.create({
        pointsAt: new Date('2026-09-10T09:00:00.000Z'),
      })
      const expected = 'generatedAt'

      const actual = rateLimit.timestampFieldName

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('AccessTokenRenewalRateLimit', () => {
  describe('#get:windowMilliseconds', () => {
    test('should be the hour section 7 states', () => {
      const rateLimit = AccessTokenRenewalRateLimit.create({
        pointsAt: new Date('2026-09-10T09:00:00.000Z'),
      })
      const expected = 3600000

      const actual = rateLimit.windowMilliseconds

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('AccessTokenRenewalRateLimit', () => {
  describe('#get:maxEventCount', () => {
    test('should be the sixty renewals section 7 states', () => {
      const rateLimit = AccessTokenRenewalRateLimit.create({
        pointsAt: new Date('2026-09-10T09:00:00.000Z'),
      })
      const expected = 60

      const actual = rateLimit.maxEventCount

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('AccessTokenRenewalRateLimit', () => {
  describe('#generateStoredKey()', () => {
    describe('should answer the series key untouched', () => {
      // A session key is minted hex, never anything a caller typed, so the value queried is
      // the value stored - there is nothing to normalize and nothing to lower case.
      const cases = [
        {
          params: {
            key: '0a1b2c3d4e5f60718293a4b5c6d7e8f9',
          },
          expected: '0a1b2c3d4e5f60718293a4b5c6d7e8f9',
        },
        {
          params: {
            key: 'ABCDEF0123456789',
          },
          expected: 'ABCDEF0123456789',
        },
      ]

      test.each(cases)('key: $params.key', ({
        params,
        expected,
      }) => {
        const rateLimit = AccessTokenRenewalRateLimit.create({
          pointsAt: new Date('2026-09-10T09:00:00.000Z'),
        })

        const actual = rateLimit.generateStoredKey(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AccessTokenRenewalRateLimit', () => {
  describe('#createWindowOpenedAt()', () => {
    describe('should open the window an hour back', () => {
      const cases = [
        {
          factoryParams: {
            pointsAt: new Date('2026-09-10T09:00:00.000Z'),
          },
          expected: new Date('2026-09-10T08:00:00.000Z'),
        },
        {
          factoryParams: {
            pointsAt: new Date('2026-09-10T00:30:15.250Z'),
          },
          expected: new Date('2026-09-09T23:30:15.250Z'),
        },
      ]

      test.each(cases)('pointsAt: $factoryParams.pointsAt', ({
        factoryParams,
        expected,
      }) => {
        const rateLimit = AccessTokenRenewalRateLimit.create(factoryParams)

        const actual = rateLimit.createWindowOpenedAt()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AccessTokenRenewalRateLimit', () => {
  describe('#buildWhereClause()', () => {
    describe('should match one series inside the window', () => {
      const cases = [
        {
          factoryParams: {
            pointsAt: new Date('2026-09-10T09:00:00.000Z'),
          },
          params: {
            key: '0a1b2c3d4e5f60718293a4b5c6d7e8f9',
          },
          expected: {
            sessionKey: '0a1b2c3d4e5f60718293a4b5c6d7e8f9',
            generatedAt: {
              [Op.gte]: new Date('2026-09-10T08:00:00.000Z'),
            },
          },
        },
        {
          factoryParams: {
            pointsAt: new Date('2026-09-12T22:10:00.000Z'),
          },
          params: {
            key: 'fedcba98765432100123456789abcdef',
          },
          expected: {
            sessionKey: 'fedcba98765432100123456789abcdef',
            generatedAt: {
              [Op.gte]: new Date('2026-09-12T21:10:00.000Z'),
            },
          },
        },
      ]

      test.each(cases)('key: $params.key', ({
        factoryParams,
        params,
        expected,
      }) => {
        const rateLimit = AccessTokenRenewalRateLimit.create(factoryParams)

        const actual = rateLimit.buildWhereClause(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
