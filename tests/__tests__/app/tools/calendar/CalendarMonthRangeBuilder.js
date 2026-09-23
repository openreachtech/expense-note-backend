import CalendarMonthRangeBuilder from '../../../../../app/tools/calendar/CalendarMonthRangeBuilder.js'

describe('CalendarMonthRangeBuilder', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#year', () => {
        const cases = [
          {
            params: {
              year: 2026,
              month: 6,
            },
          },
          {
            params: {
              year: 2024,
              month: 2,
            },
          },
        ]

        test.each(cases)('year: $params.year', ({
          params,
        }) => {
          const actual = CalendarMonthRangeBuilder.create(params)

          expect(actual)
            .toHaveProperty('year', params.year)
        })
      })

      describe('#month', () => {
        const cases = [
          {
            params: {
              year: 2026,
              month: 6,
            },
          },
          {
            params: {
              year: 2024,
              month: 2,
            },
          },
        ]

        test.each(cases)('year: $params.year', ({
          params,
        }) => {
          const actual = CalendarMonthRangeBuilder.create(params)

          expect(actual)
            .toHaveProperty('month', params.month)
        })
      })
    })
  })
})

describe('CalendarMonthRangeBuilder', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          factoryParams: {
            year: 2026,
            month: 6,
          },
        },
        {
          factoryParams: {
            year: 2024,
            month: 2,
          },
        },
      ]

      test.each(cases)('year: $factoryParams.year', ({
        factoryParams,
      }) => {
        const actual = CalendarMonthRangeBuilder.create(factoryParams)

        expect(actual)
          .toBeInstanceOf(CalendarMonthRangeBuilder)
      })
    })

    describe('should be call by constructor', () => {
      const cases = [
        {
          params: {
            year: 2026,
            month: 6,
          },
        },
        {
          params: {
            year: 2024,
            month: 2,
          },
        },
      ]

      test.each(cases)('year: $params.year', ({
        params,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(CalendarMonthRangeBuilder)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(params)
      })
    })
  })
})

describe('CalendarMonthRangeBuilder', () => {
  describe('#buildCalendarDateRange()', () => {
    const cases = [
      {
        factoryParams: {
          year: 2026,
          month: 6,
        },
        expected: {
          firstCalendarDate: '2026-06-01',
          lastCalendarDate: '2026-06-30',
        },
      },
      {
        factoryParams: {
          year: 2024,
          month: 2,
        },
        expected: {
          firstCalendarDate: '2024-02-01',
          lastCalendarDate: '2024-02-29',
        },
      },
      {
        factoryParams: {
          year: 2025,
          month: 2,
        },
        expected: {
          firstCalendarDate: '2025-02-01',
          lastCalendarDate: '2025-02-28',
        },
      },
      {
        factoryParams: {
          year: 2022,
          month: 1,
        },
        expected: {
          firstCalendarDate: '2022-01-01',
          lastCalendarDate: '2022-01-31',
        },
      },
      {
        factoryParams: {
          year: 2021,
          month: 12,
        },
        expected: {
          firstCalendarDate: '2021-12-01',
          lastCalendarDate: '2021-12-31',
        },
      },
      {
        factoryParams: {
          year: 2023,
          month: 7,
        },
        expected: {
          firstCalendarDate: '2023-07-01',
          lastCalendarDate: '2023-07-31',
        },
      },
      {
        factoryParams: {
          year: 2027,
          month: 4,
        },
        expected: {
          firstCalendarDate: '2027-04-01',
          lastCalendarDate: '2027-04-30',
        },
      },
    ]

    test.each(cases)('year: $factoryParams.year', ({
      factoryParams,
      expected,
    }) => {
      const builder = CalendarMonthRangeBuilder.create(factoryParams)

      const actual = builder.buildCalendarDateRange()

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('CalendarMonthRangeBuilder', () => {
  describe('#generateFirstCalendarDate()', () => {
    const cases = [
      {
        factoryParams: {
          year: 2026,
          month: 6,
        },
        expected: '2026-06-01',
      },
      {
        factoryParams: {
          year: 2024,
          month: 2,
        },
        expected: '2024-02-01',
      },
      {
        factoryParams: {
          year: 2022,
          month: 1,
        },
        expected: '2022-01-01',
      },
      {
        factoryParams: {
          year: 2021,
          month: 12,
        },
        expected: '2021-12-01',
      },
      {
        factoryParams: {
          year: 2025,
          month: 11,
        },
        expected: '2025-11-01',
      },
      {
        factoryParams: {
          year: 2023,
          month: 9,
        },
        expected: '2023-09-01',
      },
    ]

    test.each(cases)('year: $factoryParams.year', ({
      factoryParams,
      expected,
    }) => {
      const builder = CalendarMonthRangeBuilder.create(factoryParams)

      const actual = builder.generateFirstCalendarDate()

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('CalendarMonthRangeBuilder', () => {
  describe('#generateLastCalendarDate()', () => {
    const cases = [
      {
        factoryParams: {
          year: 2024,
          month: 2,
        },
        expected: '2024-02-29',
      },
      {
        factoryParams: {
          year: 2026,
          month: 2,
        },
        expected: '2026-02-28',
      },
      {
        factoryParams: {
          year: 2000,
          month: 2,
        },
        expected: '2000-02-29',
      },
      {
        factoryParams: {
          year: 1900,
          month: 2,
        },
        expected: '1900-02-28',
      },
      {
        factoryParams: {
          year: 2025,
          month: 6,
        },
        expected: '2025-06-30',
      },
      {
        factoryParams: {
          year: 2023,
          month: 7,
        },
        expected: '2023-07-31',
      },
      {
        factoryParams: {
          year: 2022,
          month: 1,
        },
        expected: '2022-01-31',
      },
      {
        factoryParams: {
          year: 2021,
          month: 12,
        },
        expected: '2021-12-31',
      },
      {
        factoryParams: {
          year: 2027,
          month: 4,
        },
        expected: '2027-04-30',
      },
    ]

    test.each(cases)('year: $factoryParams.year', ({
      factoryParams,
      expected,
    }) => {
      const builder = CalendarMonthRangeBuilder.create(factoryParams)

      const actual = builder.generateLastCalendarDate()

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('CalendarMonthRangeBuilder', () => {
  describe('#generateLastDayOfMonth()', () => {
    const cases = [
      {
        factoryParams: {
          year: 2024,
          month: 2,
        },
        expected: 29,
      },
      {
        factoryParams: {
          year: 2026,
          month: 2,
        },
        expected: 28,
      },
      {
        factoryParams: {
          year: 2000,
          month: 2,
        },
        expected: 29,
      },
      {
        factoryParams: {
          year: 1900,
          month: 2,
        },
        expected: 28,
      },
      {
        factoryParams: {
          year: 2022,
          month: 1,
        },
        expected: 31,
      },
      {
        factoryParams: {
          year: 2025,
          month: 6,
        },
        expected: 30,
      },
      {
        factoryParams: {
          year: 2023,
          month: 7,
        },
        expected: 31,
      },
      {
        factoryParams: {
          year: 2027,
          month: 4,
        },
        expected: 30,
      },
      {
        factoryParams: {
          year: 2028,
          month: 11,
        },
        expected: 30,
      },
      {
        factoryParams: {
          year: 2029,
          month: 9,
        },
        expected: 30,
      },
      {
        factoryParams: {
          year: 2030,
          month: 8,
        },
        expected: 31,
      },
      {
        factoryParams: {
          year: 2021,
          month: 12,
        },
        expected: 31,
      },
    ]

    test.each(cases)('year: $factoryParams.year', ({
      factoryParams,
      expected,
    }) => {
      const builder = CalendarMonthRangeBuilder.create(factoryParams)

      const actual = builder.generateLastDayOfMonth()

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('CalendarMonthRangeBuilder', () => {
  describe('#generateCalendarDate()', () => {
    const cases = [
      {
        factoryParams: {
          year: 2026,
          month: 6,
        },
        params: {
          day: 1,
        },
        expected: '2026-06-01',
      },
      {
        factoryParams: {
          year: 2024,
          month: 2,
        },
        params: {
          day: 29,
        },
        expected: '2024-02-29',
      },
      {
        factoryParams: {
          year: 2022,
          month: 1,
        },
        params: {
          day: 31,
        },
        expected: '2022-01-31',
      },
      {
        factoryParams: {
          year: 2021,
          month: 12,
        },
        params: {
          day: 9,
        },
        expected: '2021-12-09',
      },
      {
        factoryParams: {
          year: 2025,
          month: 10,
        },
        params: {
          day: 15,
        },
        expected: '2025-10-15',
      },
    ]

    test.each(cases)('day: $params.day', ({
      factoryParams,
      params,
      expected,
    }) => {
      const builder = CalendarMonthRangeBuilder.create(factoryParams)

      const actual = builder.generateCalendarDate(params)

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('CalendarMonthRangeBuilder', () => {
  describe('#generateZeroPaddedText()', () => {
    const cases = [
      {
        factoryParams: {
          year: 2026,
          month: 6,
        },
        params: {
          value: 6,
          digitCount: 2,
        },
        expected: '06',
      },
      {
        factoryParams: {
          year: 2026,
          month: 6,
        },
        params: {
          value: 12,
          digitCount: 2,
        },
        expected: '12',
      },
      {
        factoryParams: {
          year: 2026,
          month: 6,
        },
        params: {
          value: 2026,
          digitCount: 4,
        },
        expected: '2026',
      },
      {
        factoryParams: {
          year: 2026,
          month: 6,
        },
        params: {
          value: 7,
          digitCount: 4,
        },
        expected: '0007',
      },
      {
        factoryParams: {
          year: 2026,
          month: 6,
        },
        params: {
          value: 31,
          digitCount: 2,
        },
        expected: '31',
      },
      {
        factoryParams: {
          year: 2026,
          month: 6,
        },
        params: {
          value: 123,
          digitCount: 2,
        },
        expected: '123',
      },
    ]

    test.each(cases)('value: $params.value', ({
      factoryParams,
      params,
      expected,
    }) => {
      const builder = CalendarMonthRangeBuilder.create(factoryParams)

      const actual = builder.generateZeroPaddedText(params)

      expect(actual)
        .toBe(expected)
    })
  })
})
