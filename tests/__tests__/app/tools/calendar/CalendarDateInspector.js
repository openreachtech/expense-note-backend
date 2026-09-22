import {
  DateToDateonlyValueConverter,
  DateonlyToDateValueConverter,
} from '@openreachtech/mentsu-deep-value-converter'

import CalendarDateInspector from '../../../../../app/tools/calendar/CalendarDateInspector.js'

describe('CalendarDateInspector', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#calendarDate', () => {
        const cases = [
          {
            params: {
              calendarDate: '2026-09-15',
              readAt: new Date('2026-09-14T22:00:00.000Z'),
              timezone: 'Asia/Tokyo',
            },
          },
          {
            params: {
              calendarDate: '2026-01-31',
              readAt: new Date('2026-01-30T10:00:00.000Z'),
              timezone: 'UTC',
            },
          },
        ]

        test.each(cases)('calendarDate: $params.calendarDate', ({
          params,
        }) => {
          const actual = CalendarDateInspector.create(params)

          expect(actual)
            .toHaveProperty('calendarDate', params.calendarDate)
        })
      })

      describe('#readAt', () => {
        const cases = [
          {
            params: {
              calendarDate: '2026-09-15',
              readAt: new Date('2026-09-14T22:00:00.000Z'),
              timezone: 'Asia/Tokyo',
            },
          },
          {
            params: {
              calendarDate: '2026-01-31',
              readAt: new Date('2026-01-30T10:00:00.000Z'),
              timezone: 'UTC',
            },
          },
        ]

        test.each(cases)('readAt: $params.readAt', ({
          params,
        }) => {
          const actual = CalendarDateInspector.create(params)

          expect(actual)
            .toHaveProperty('readAt', params.readAt)
        })
      })

      describe('#timezone', () => {
        const cases = [
          {
            params: {
              calendarDate: '2026-09-15',
              readAt: new Date('2026-09-14T22:00:00.000Z'),
              timezone: 'Asia/Tokyo',
            },
          },
          {
            params: {
              calendarDate: '2026-01-31',
              readAt: new Date('2026-01-30T10:00:00.000Z'),
              timezone: 'UTC',
            },
          },
        ]

        test.each(cases)('timezone: $params.timezone', ({
          params,
        }) => {
          const actual = CalendarDateInspector.create(params)

          expect(actual)
            .toHaveProperty('timezone', params.timezone)
        })
      })
    })
  })
})

describe('CalendarDateInspector', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          factoryParams: {
            calendarDate: '2026-02-28',
            readAt: new Date('2026-02-27T05:00:00.000Z'),
            timezone: 'UTC',
          },
        },
      ]

      test.each(cases)('calendarDate: $factoryParams.calendarDate', ({
        factoryParams,
      }) => {
        const actual = CalendarDateInspector.create(factoryParams)

        expect(actual)
          .toBeInstanceOf(CalendarDateInspector)
      })
    })

    describe('should be call by constructor', () => {
      const cases = [
        {
          params: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          params: {
            calendarDate: '2026-02-28',
            readAt: new Date('2026-02-27T05:00:00.000Z'),
            timezone: 'UTC',
          },
        },
      ]

      test.each(cases)('calendarDate: $params.calendarDate', ({
        params,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(CalendarDateInspector)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(params)
      })
    })

    describe('should use default readAt value', () => {
      const cases = [
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            timezone: 'Asia/Tokyo',
          },
          mockCurrentDateTime: new Date('2026-09-14T22:00:00.000Z'),
        },
        {
          factoryParams: {
            calendarDate: '2026-02-28',
            timezone: 'UTC',
          },
          mockCurrentDateTime: new Date('2026-02-27T05:06:07.008Z'),
        },
      ]

      test.each(cases)('mockCurrentDateTime: $mockCurrentDateTime', ({
        factoryParams,
        mockCurrentDateTime,
      }) => {
        const generateCurrentDateTimeSpy = jest.spyOn(CalendarDateInspector, 'generateCurrentDateTime')
          .mockReturnValue(mockCurrentDateTime)

        const actual = CalendarDateInspector.create(factoryParams)

        expect(actual)
          .toHaveProperty('readAt', mockCurrentDateTime)
        expect(generateCurrentDateTimeSpy)
          .toHaveBeenCalledWith()
      })
    })

    describe('should use default timezone value', () => {
      const cases = [
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
          },
          expected: 'Asia/Tokyo',
        },
        {
          factoryParams: {
            calendarDate: '2026-02-28',
            readAt: new Date('2026-02-27T05:00:00.000Z'),
          },
          expected: 'Asia/Tokyo',
        },
      ]

      test.each(cases)('calendarDate: $factoryParams.calendarDate', ({
        factoryParams,
        expected,
      }) => {
        const actual = CalendarDateInspector.create(factoryParams)

        expect(actual)
          .toHaveProperty('timezone', expected)
      })
    })
  })
})

describe('CalendarDateInspector', () => {
  describe('.generateCurrentDateTime()', () => {
    test('should answer an instant', () => {
      const actual = CalendarDateInspector.generateCurrentDateTime()

      expect(actual)
        .toBeInstanceOf(Date)
    })
  })
})

describe('CalendarDateInspector', () => {
  describe('.get:DateToDateonlyValueConverterCtor', () => {
    test('should answer the converter reading an instant', () => {
      const expected = DateToDateonlyValueConverter

      const actual = CalendarDateInspector.DateToDateonlyValueConverterCtor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('CalendarDateInspector', () => {
  describe('.get:DateonlyToDateValueConverterCtor', () => {
    test('should answer the converter reading a calendar date', () => {
      const expected = DateonlyToDateValueConverter

      const actual = CalendarDateInspector.DateonlyToDateValueConverterCtor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('CalendarDateInspector', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        factoryParams: {
          calendarDate: '2026-09-15',
          readAt: new Date('2026-09-14T22:00:00.000Z'),
          timezone: 'Asia/Tokyo',
        },
      },
      {
        factoryParams: {
          calendarDate: '2026-02-28',
          readAt: new Date('2026-02-27T05:00:00.000Z'),
          timezone: 'UTC',
        },
      },
    ]

    test.each(cases)('calendarDate: $factoryParams.calendarDate', ({
      factoryParams,
    }) => {
      const inspector = CalendarDateInspector.create(factoryParams)
      const expected = CalendarDateInspector

      const actual = inspector.Ctor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('CalendarDateInspector', () => {
  describe('#isAfterToday()', () => {
    describe('when the date falls after today', () => {
      const cases = [
        {
          factoryParams: {
            calendarDate: '2026-09-16',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          factoryParams: {
            calendarDate: '2026-10-01',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          factoryParams: {
            calendarDate: '2027-01-01',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
      ]

      test.each(cases)('calendarDate: $factoryParams.calendarDate', ({
        factoryParams,
      }) => {
        const inspector = CalendarDateInspector.create(factoryParams)

        const actual = inspector.isAfterToday()

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('when the date is today itself, or earlier', () => {
      const cases = [
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          factoryParams: {
            calendarDate: '2026-09-14',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          factoryParams: {
            calendarDate: '2026-01-01',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
      ]

      test.each(cases)('calendarDate: $factoryParams.calendarDate', ({
        factoryParams,
      }) => {
        const inspector = CalendarDateInspector.create(factoryParams)

        const actual = inspector.isAfterToday()

        expect(actual)
          .toBeFalsy()
      })
    })

    describe('when the zone alone decides, and it reads the instant as the day before', () => {
      const cases = [
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'UTC',
          },
        },
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-09-14T23:59:59.999Z'),
            timezone: 'UTC',
          },
        },
      ]

      test.each(cases)('readAt: $factoryParams.readAt', ({
        factoryParams,
      }) => {
        const inspector = CalendarDateInspector.create(factoryParams)

        const actual = inspector.isAfterToday()

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('when the zone alone decides, and it reads the instant as the same day', () => {
      const cases = [
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-09-14T23:59:59.999Z'),
            timezone: 'Asia/Tokyo',
          },
        },
      ]

      test.each(cases)('readAt: $factoryParams.readAt', ({
        factoryParams,
      }) => {
        const inspector = CalendarDateInspector.create(factoryParams)

        const actual = inspector.isAfterToday()

        expect(actual)
          .toBeFalsy()
      })
    })

    describe('when the value is no calendar date', () => {
      const cases = [
        {
          factoryParams: {
            calendarDate: '2024-02-30',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          factoryParams: {
            calendarDate: '2026-13-01',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          factoryParams: {
            calendarDate: '2026-9-15',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          factoryParams: {
            calendarDate: 'tomorrow',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
      ]

      test.each(cases)('calendarDate: $factoryParams.calendarDate', ({
        factoryParams,
      }) => {
        const inspector = CalendarDateInspector.create(factoryParams)

        const actual = inspector.isAfterToday()

        expect(actual)
          .toBeFalsy()
      })
    })

    describe('when the instant is no instant', () => {
      const cases = [
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('there is no such instant'),
            timezone: 'Asia/Tokyo',
          },
          expected: 'CalendarDateInspector#buildTodayCalendarDate() cannot read a calendar date from readAt',
        },
        {
          factoryParams: {
            calendarDate: '2026-02-28',
            readAt: new Date('there is no such instant'),
            timezone: 'UTC',
          },
          expected: 'CalendarDateInspector#buildTodayCalendarDate() cannot read a calendar date from readAt',
        },
      ]

      test.each(cases)('calendarDate: $factoryParams.calendarDate', ({
        factoryParams,
        expected,
      }) => {
        const inspector = CalendarDateInspector.create(factoryParams)

        const actual = () => inspector.isAfterToday()

        expect(actual)
          .toThrow(expected)
      })
    })
  })
})

describe('CalendarDateInspector', () => {
  describe('#isWellFormed()', () => {
    describe('when the value names a day that exists', () => {
      const cases = [
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          factoryParams: {
            calendarDate: '2024-02-29',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          factoryParams: {
            calendarDate: '2026-12-31',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          factoryParams: {
            calendarDate: '2026-01-01',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'UTC',
          },
        },
      ]

      test.each(cases)('calendarDate: $factoryParams.calendarDate', ({
        factoryParams,
      }) => {
        const inspector = CalendarDateInspector.create(factoryParams)

        const actual = inspector.isWellFormed()

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('when the value names a day that does not exist', () => {
      const cases = [
        {
          factoryParams: {
            calendarDate: '2024-02-30',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          factoryParams: {
            calendarDate: '2023-02-29',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          factoryParams: {
            calendarDate: '2026-09-31',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          factoryParams: {
            calendarDate: '2026-13-01',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
      ]

      test.each(cases)('calendarDate: $factoryParams.calendarDate', ({
        factoryParams,
      }) => {
        const inspector = CalendarDateInspector.create(factoryParams)

        const actual = inspector.isWellFormed()

        expect(actual)
          .toBeFalsy()
      })
    })

    describe('when the value does not take the shape of a calendar date', () => {
      const cases = [
        {
          factoryParams: {
            calendarDate: '2026-9-15',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          factoryParams: {
            calendarDate: '26-09-15',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          factoryParams: {
            calendarDate: '2026-09-15T00:00:00.000Z',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          factoryParams: {
            calendarDate: 'tomorrow',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          factoryParams: {
            calendarDate: '',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
      ]

      test.each(cases)('calendarDate: $factoryParams.calendarDate', ({
        factoryParams,
      }) => {
        const inspector = CalendarDateInspector.create(factoryParams)

        const actual = inspector.isWellFormed()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('CalendarDateInspector', () => {
  describe('#buildTodayCalendarDate()', () => {
    describe('read in Asia/Tokyo', () => {
      const cases = [
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-09-14T14:59:59.999Z'),
            timezone: 'Asia/Tokyo',
          },
          expected: '2026-09-14',
        },
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-09-14T15:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
          expected: '2026-09-15',
        },
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
          expected: '2026-09-15',
        },
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-12-31T15:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
          expected: '2027-01-01',
        },
      ]

      test.each(cases)('readAt: $factoryParams.readAt', ({
        factoryParams,
        expected,
      }) => {
        const inspector = CalendarDateInspector.create(factoryParams)

        const actual = inspector.buildTodayCalendarDate()

        expect(actual)
          .toBe(expected)
      })
    })

    describe('read in UTC', () => {
      const cases = [
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'UTC',
          },
          expected: '2026-09-14',
        },
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-09-14T23:59:59.999Z'),
            timezone: 'UTC',
          },
          expected: '2026-09-14',
        },
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-09-15T00:00:00.000Z'),
            timezone: 'UTC',
          },
          expected: '2026-09-15',
        },
      ]

      test.each(cases)('readAt: $factoryParams.readAt', ({
        factoryParams,
        expected,
      }) => {
        const inspector = CalendarDateInspector.create(factoryParams)

        const actual = inspector.buildTodayCalendarDate()

        expect(actual)
          .toBe(expected)
      })
    })

    describe('when the instant is no instant', () => {
      const cases = [
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('there is no such instant'),
            timezone: 'Asia/Tokyo',
          },
          expected: 'CalendarDateInspector#buildTodayCalendarDate() cannot read a calendar date from readAt',
        },
        {
          factoryParams: {
            calendarDate: '2026-02-28',
            readAt: new Date('there is no such instant'),
            timezone: 'UTC',
          },
          expected: 'CalendarDateInspector#buildTodayCalendarDate() cannot read a calendar date from readAt',
        },
      ]

      test.each(cases)('calendarDate: $factoryParams.calendarDate', ({
        factoryParams,
        expected,
      }) => {
        const inspector = CalendarDateInspector.create(factoryParams)

        const actual = () => inspector.buildTodayCalendarDate()

        expect(actual)
          .toThrow(expected)
      })
    })
  })
})

describe('CalendarDateInspector', () => {
  describe('#createInstantConverter()', () => {
    describe('should be an instance of the instant converter', () => {
      const cases = [
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          factoryParams: {
            calendarDate: '2026-02-28',
            readAt: new Date('2026-02-27T05:00:00.000Z'),
            timezone: 'UTC',
          },
        },
      ]

      test.each(cases)('timezone: $factoryParams.timezone', ({
        factoryParams,
      }) => {
        const inspector = CalendarDateInspector.create(factoryParams)

        const actual = inspector.createInstantConverter()

        expect(actual)
          .toBeInstanceOf(DateToDateonlyValueConverter)
      })
    })

    describe('should hold the instant as its source value', () => {
      const cases = [
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
          expected: new Date('2026-09-14T22:00:00.000Z'),
        },
        {
          factoryParams: {
            calendarDate: '2026-02-28',
            readAt: new Date('2026-02-27T05:00:00.000Z'),
            timezone: 'UTC',
          },
          expected: new Date('2026-02-27T05:00:00.000Z'),
        },
      ]

      test.each(cases)('readAt: $factoryParams.readAt', ({
        factoryParams,
        expected,
      }) => {
        const inspector = CalendarDateInspector.create(factoryParams)

        const actual = inspector.createInstantConverter()

        expect(actual)
          .toHaveProperty('sourceValue', expected)
      })
    })

    describe('should bind this inspector timezone', () => {
      const cases = [
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
          expected: 'Asia/Tokyo',
        },
        {
          factoryParams: {
            calendarDate: '2026-02-28',
            readAt: new Date('2026-02-27T05:00:00.000Z'),
            timezone: 'UTC',
          },
          expected: 'UTC',
        },
      ]

      test.each(cases)('timezone: $factoryParams.timezone', ({
        factoryParams,
        expected,
      }) => {
        const inspector = CalendarDateInspector.create(factoryParams)

        const actual = inspector.createInstantConverter()

        expect(actual.Ctor)
          .toHaveProperty('timezone', expected)
      })
    })
  })
})

describe('CalendarDateInspector', () => {
  describe('#createCalendarDateConverter()', () => {
    describe('should be an instance of the calendar date converter', () => {
      const cases = [
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
        },
        {
          factoryParams: {
            calendarDate: '2026-02-28',
            readAt: new Date('2026-02-27T05:00:00.000Z'),
            timezone: 'UTC',
          },
        },
      ]

      test.each(cases)('calendarDate: $factoryParams.calendarDate', ({
        factoryParams,
      }) => {
        const inspector = CalendarDateInspector.create(factoryParams)

        const actual = inspector.createCalendarDateConverter()

        expect(actual)
          .toBeInstanceOf(DateonlyToDateValueConverter)
      })
    })

    describe('should hold the calendar date as its source value', () => {
      const cases = [
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
          expected: '2026-09-15',
        },
        {
          factoryParams: {
            calendarDate: '2026-02-28',
            readAt: new Date('2026-02-27T05:00:00.000Z'),
            timezone: 'UTC',
          },
          expected: '2026-02-28',
        },
      ]

      test.each(cases)('calendarDate: $factoryParams.calendarDate', ({
        factoryParams,
        expected,
      }) => {
        const inspector = CalendarDateInspector.create(factoryParams)

        const actual = inspector.createCalendarDateConverter()

        expect(actual)
          .toHaveProperty('sourceValue', expected)
      })
    })

    describe('should bind this inspector timezone', () => {
      const cases = [
        {
          factoryParams: {
            calendarDate: '2026-09-15',
            readAt: new Date('2026-09-14T22:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          },
          expected: 'Asia/Tokyo',
        },
        {
          factoryParams: {
            calendarDate: '2026-02-28',
            readAt: new Date('2026-02-27T05:00:00.000Z'),
            timezone: 'UTC',
          },
          expected: 'UTC',
        },
      ]

      test.each(cases)('timezone: $factoryParams.timezone', ({
        factoryParams,
        expected,
      }) => {
        const inspector = CalendarDateInspector.create(factoryParams)

        const actual = inspector.createCalendarDateConverter()

        expect(actual.Ctor)
          .toHaveProperty('timezone', expected)
      })
    })
  })
})
