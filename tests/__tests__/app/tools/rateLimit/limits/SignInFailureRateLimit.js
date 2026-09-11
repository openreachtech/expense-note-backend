import {
  Op,
} from 'sequelize'

import SignInFailureRateLimit from '../../../../../../app/tools/rateLimit/limits/SignInFailureRateLimit.js'

import BaseRateLimit from '../../../../../../app/tools/rateLimit/BaseRateLimit.js'

import SignInAttempt from '../../../../../../sequelize/models/SignInAttempt.js'
import StaffMemberSecret from '../../../../../../sequelize/models/StaffMemberSecret.js'

describe('SignInFailureRateLimit', () => {
  describe('super class', () => {
    test('to be instance of BaseRateLimit', () => {
      const received = SignInFailureRateLimit.prototype

      expect(received)
        .toBeInstanceOf(BaseRateLimit)
    })
  })
})

describe('SignInFailureRateLimit', () => {
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
            pointsAt: new Date('2026-09-10T17:30:00.000Z'),
          },
        },
      ]

      test.each(cases)('pointsAt: $factoryParams.pointsAt', ({
        factoryParams,
      }) => {
        const actual = SignInFailureRateLimit.create(factoryParams)

        expect(actual)
          .toBeInstanceOf(SignInFailureRateLimit)
      })
    })
  })
})

describe('SignInFailureRateLimit', () => {
  describe('#get:EventModel', () => {
    test('should count the rows of sign_in_attempts', () => {
      // The table holding failed attempts only, which is why a successful sign-in counts for
      // nothing without any rule here saying so.
      const rateLimit = SignInFailureRateLimit.create({
        pointsAt: new Date('2026-09-10T09:00:00.000Z'),
      })

      const actual = rateLimit.EventModel

      expect(actual)
        .toBe(SignInAttempt) // same reference
    })
  })
})

describe('SignInFailureRateLimit', () => {
  describe('#get:keyFieldName', () => {
    test('should key on the email address', () => {
      const rateLimit = SignInFailureRateLimit.create({
        pointsAt: new Date('2026-09-10T09:00:00.000Z'),
      })
      const expected = 'email'

      const actual = rateLimit.keyFieldName

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('SignInFailureRateLimit', () => {
  describe('#get:timestampFieldName', () => {
    test('should read the instant off attemptedAt', () => {
      const rateLimit = SignInFailureRateLimit.create({
        pointsAt: new Date('2026-09-10T09:00:00.000Z'),
      })
      const expected = 'attemptedAt'

      const actual = rateLimit.timestampFieldName

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('SignInFailureRateLimit', () => {
  describe('#get:windowMilliseconds', () => {
    test('should be the fifteen minutes section 7 states', () => {
      const rateLimit = SignInFailureRateLimit.create({
        pointsAt: new Date('2026-09-10T09:00:00.000Z'),
      })
      const expected = 900000

      const actual = rateLimit.windowMilliseconds

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('SignInFailureRateLimit', () => {
  describe('#get:maxEventCount', () => {
    test('should be the ten failures section 7 states', () => {
      const rateLimit = SignInFailureRateLimit.create({
        pointsAt: new Date('2026-09-10T09:00:00.000Z'),
      })
      const expected = 10

      const actual = rateLimit.maxEventCount

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('SignInFailureRateLimit', () => {
  describe('#get:StaffMemberSecretModel', () => {
    test('should answer the model defining a normalized address', () => {
      // Reached through the counted model's own seam, so the read and the write cannot come to
      // disagree about what one address is.
      const rateLimit = SignInFailureRateLimit.create({
        pointsAt: new Date('2026-09-10T09:00:00.000Z'),
      })

      const actual = rateLimit.StaffMemberSecretModel

      expect(actual)
        .toBe(StaffMemberSecret) // same reference
    })
  })
})

describe('SignInFailureRateLimit', () => {
  describe('#generateStoredKey()', () => {
    describe('should answer the address as sign_in_attempts holds it', () => {
      const cases = [
        {
          params: {
            key: 'Nadia@Example.com',
          },
          expected: 'nadia@example.com',
        },
        {
          params: {
            key: 'ROSA@EXAMPLE.COM',
          },
          expected: 'rosa@example.com',
        },
        {
          params: {
            key: 'Otto.Van-Dijk+notes@Sub.Example.COM',
          },
          expected: 'otto.van-dijk+notes@sub.example.com',
        },
      ]

      test.each(cases)('key: $params.key', ({
        params,
        expected,
      }) => {
        const rateLimit = SignInFailureRateLimit.create({
          pointsAt: new Date('2026-09-10T09:00:00.000Z'),
        })

        const actual = rateLimit.generateStoredKey(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('SignInFailureRateLimit', () => {
  describe('#createWindowOpenedAt()', () => {
    describe('should open the window fifteen minutes back', () => {
      const cases = [
        {
          factoryParams: {
            pointsAt: new Date('2026-09-10T09:00:00.000Z'),
          },
          expected: new Date('2026-09-10T08:45:00.000Z'),
        },
        {
          factoryParams: {
            pointsAt: new Date('2026-09-10T00:07:30.500Z'),
          },
          expected: new Date('2026-09-09T23:52:30.500Z'),
        },
      ]

      test.each(cases)('pointsAt: $factoryParams.pointsAt', ({
        factoryParams,
        expected,
      }) => {
        const rateLimit = SignInFailureRateLimit.create(factoryParams)

        const actual = rateLimit.createWindowOpenedAt()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SignInFailureRateLimit', () => {
  describe('#buildWhereClause()', () => {
    describe('should match one normalized address inside the window', () => {
      // The window bound is an operator on the timestamp attribute, so the database applies it
      // and answers with a number - no row is ever loaded here to be counted.
      const cases = [
        {
          factoryParams: {
            pointsAt: new Date('2026-09-10T09:00:00.000Z'),
          },
          params: {
            key: 'Nadia@Example.com',
          },
          expected: {
            email: 'nadia@example.com',
            attemptedAt: {
              [Op.gte]: new Date('2026-09-10T08:45:00.000Z'),
            },
          },
        },
        {
          factoryParams: {
            pointsAt: new Date('2026-09-11T13:20:10.000Z'),
          },
          params: {
            key: 'ROSA@EXAMPLE.COM',
          },
          expected: {
            email: 'rosa@example.com',
            attemptedAt: {
              [Op.gte]: new Date('2026-09-11T13:05:10.000Z'),
            },
          },
        },
      ]

      test.each(cases)('key: $params.key', ({
        factoryParams,
        params,
        expected,
      }) => {
        const rateLimit = SignInFailureRateLimit.create(factoryParams)

        const actual = rateLimit.buildWhereClause(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
