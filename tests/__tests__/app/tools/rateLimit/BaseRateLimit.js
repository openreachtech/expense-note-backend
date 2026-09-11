import {
  Op,
} from 'sequelize'

import BaseRateLimit from '../../../../../app/tools/rateLimit/BaseRateLimit.js'

describe('BaseRateLimit', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#pointsAt', () => {
        const cases = [
          {
            params: {
              pointsAt: new Date('2026-09-10T09:00:00.000Z'),
            },
          },
          {
            params: {
              pointsAt: new Date('2026-09-11T23:59:59.999Z'),
            },
          },
        ]

        test.each(cases)('pointsAt: $params.pointsAt', ({
          params,
        }) => {
          const actual = BaseRateLimit.create(params)

          expect(actual)
            .toHaveProperty('pointsAt', params.pointsAt)
        })
      })
    })
  })
})

describe('BaseRateLimit', () => {
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
            pointsAt: new Date('2026-09-10T10:30:00.000Z'),
          },
        },
      ]

      test.each(cases)('pointsAt: $factoryParams.pointsAt', ({
        factoryParams,
      }) => {
        const actual = BaseRateLimit.create(factoryParams)

        expect(actual)
          .toBeInstanceOf(BaseRateLimit)
      })
    })

    describe('should be call by constructor', () => {
      const cases = [
        {
          params: {
            pointsAt: new Date('2026-09-12T08:15:00.000Z'),
          },
        },
        {
          params: {
            pointsAt: new Date('2026-09-13T18:45:00.000Z'),
          },
        },
      ]

      test.each(cases)('pointsAt: $params.pointsAt', ({
        params,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(BaseRateLimit)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(params)
      })
    })

    describe('should use default pointsAt value', () => {
      const cases = [
        {
          mockCurrentDateTime: new Date('2026-09-14T07:00:00.000Z'),
        },
        {
          mockCurrentDateTime: new Date('2026-09-15T21:22:23.024Z'),
        },
      ]

      test.each(cases)('mockCurrentDateTime: $mockCurrentDateTime', ({
        mockCurrentDateTime,
      }) => {
        const generateCurrentDateTimeSpy = jest.spyOn(BaseRateLimit, 'generateCurrentDateTime')
          .mockReturnValue(mockCurrentDateTime)

        const actual = BaseRateLimit.create()

        expect(actual)
          .toHaveProperty('pointsAt', mockCurrentDateTime)
        expect(generateCurrentDateTimeSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('BaseRateLimit', () => {
  describe('.generateCurrentDateTime()', () => {
    test('should answer an instant', () => {
      const actual = BaseRateLimit.generateCurrentDateTime()

      expect(actual)
        .toBeInstanceOf(Date)
    })
  })
})

describe('BaseRateLimit', () => {
  describe('#get:EventModel', () => {
    test('should refuse to answer on the base', () => {
      const rateLimit = BaseRateLimit.create({
        pointsAt: new Date('2026-09-10T09:00:00.000Z'),
      })
      const expected = 'BaseRateLimit#get:EventModel must be inherited'

      const actual = () => rateLimit.EventModel

      expect(actual)
        .toThrow(expected)
    })
  })
})

describe('BaseRateLimit', () => {
  describe('#get:keyFieldName', () => {
    test('should refuse to answer on the base', () => {
      const rateLimit = BaseRateLimit.create({
        pointsAt: new Date('2026-09-10T09:00:00.000Z'),
      })
      const expected = 'BaseRateLimit#get:keyFieldName must be inherited'

      const actual = () => rateLimit.keyFieldName

      expect(actual)
        .toThrow(expected)
    })
  })
})

describe('BaseRateLimit', () => {
  describe('#get:timestampFieldName', () => {
    test('should refuse to answer on the base', () => {
      const rateLimit = BaseRateLimit.create({
        pointsAt: new Date('2026-09-10T09:00:00.000Z'),
      })
      const expected = 'BaseRateLimit#get:timestampFieldName must be inherited'

      const actual = () => rateLimit.timestampFieldName

      expect(actual)
        .toThrow(expected)
    })
  })
})

describe('BaseRateLimit', () => {
  describe('#get:windowMilliseconds', () => {
    test('should refuse to answer on the base', () => {
      const rateLimit = BaseRateLimit.create({
        pointsAt: new Date('2026-09-10T09:00:00.000Z'),
      })
      const expected = 'BaseRateLimit#get:windowMilliseconds must be inherited'

      const actual = () => rateLimit.windowMilliseconds

      expect(actual)
        .toThrow(expected)
    })
  })
})

describe('BaseRateLimit', () => {
  describe('#get:maxEventCount', () => {
    test('should refuse to answer on the base', () => {
      const rateLimit = BaseRateLimit.create({
        pointsAt: new Date('2026-09-10T09:00:00.000Z'),
      })
      const expected = 'BaseRateLimit#get:maxEventCount must be inherited'

      const actual = () => rateLimit.maxEventCount

      expect(actual)
        .toThrow(expected)
    })
  })
})

describe('BaseRateLimit', () => {
  describe('#get:sequelizeOperators', () => {
    test('should answer the operators sequelize publishes', () => {
      const rateLimit = BaseRateLimit.create({
        pointsAt: new Date('2026-09-10T09:00:00.000Z'),
      })

      const actual = rateLimit.sequelizeOperators

      expect(actual)
        .toBe(Op) // same reference
    })
  })
})

describe('BaseRateLimit', () => {
  describe('#generateStoredKey()', () => {
    describe('should answer the key untouched', () => {
      // The base normalizes nothing. A limit whose table transforms the key on the way in
      // overrides this; one whose table stores what it is handed must not be given a
      // transformation it never asked for.
      const cases = [
        {
          params: {
            key: 'Nadia@Example.com',
          },
          expected: 'Nadia@Example.com',
        },
        {
          params: {
            key: 'A1B2C3D4E5F6',
          },
          expected: 'A1B2C3D4E5F6',
        },
      ]

      test.each(cases)('key: $params.key', ({
        params,
        expected,
      }) => {
        const rateLimit = BaseRateLimit.create({
          pointsAt: new Date('2026-09-10T09:00:00.000Z'),
        })

        const actual = rateLimit.generateStoredKey(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})
