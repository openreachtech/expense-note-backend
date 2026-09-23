import {
  IntegerValueInspector,
} from '@openreachtech/mentsu-value-inspector'

import MonthlyExpensesQueryResolver from '../../../../../../../../server/graphql/resolvers/staff/actual/queries/MonthlyExpensesQueryResolver.js'

import MonthlyExpensesInputValidator from '../../../../../../../../app/tools/validator/resolvers/staff/queries/MonthlyExpensesInputValidator.js'

import BaseInputValidator from '../../../../../../../../app/tools/validator/BaseInputValidator.js'

describe('MonthlyExpensesInputValidator', () => {
  describe('super class', () => {
    test('to be instance of BaseInputValidator', () => {
      const actual = MonthlyExpensesInputValidator.prototype

      expect(actual)
        .toBeInstanceOf(BaseInputValidator)
    })
  })
})

describe('MonthlyExpensesInputValidator', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 6,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2025,
              month: 11,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
      ]

      test.each(cases)('input.year: $factoryParams.input.year', ({
        factoryParams,
      }) => {
        const actual = MonthlyExpensesInputValidator.create(factoryParams)

        expect(actual)
          .toBeInstanceOf(MonthlyExpensesInputValidator)
      })
    })
  })
})

describe('MonthlyExpensesInputValidator', () => {
  describe('#generateValidationEntries()', () => {
    /*
     * Two rules, and no third one. There is no rule pairing the year with the month, because there
     * is no month of a year this operation declines to answer for; and there is no rule refusing a
     * future month or a very old one, because the specification declares neither and a month that
     * holds nothing reads as empty, which is the truth. Each error class stands in as a marker
     * string -- this method only pairs a rule with its error, and a marker makes the pairing
     * readable.
     *
     * The order is the year first, which is the order the input declares the two in. Neither rule
     * masks the other, so only one of them can surface for an input that breaks both, and this is
     * where which one is stated.
     */
    describe('should declare the two rules in order', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 6,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
          expected: [
            [expect.any(Function), 'error-ctor-invalid-year'],
            [expect.any(Function), 'error-ctor-invalid-month'],
          ],
        },
        {
          factoryParams: {
            input: {
              year: 1999,
              month: 12,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
          expected: [
            [expect.any(Function), 'error-ctor-invalid-year'],
            [expect.any(Function), 'error-ctor-invalid-month'],
          ],
        },
      ]

      test.each(cases)('input.year: $factoryParams.input.year', ({
        factoryParams,
        expected,
      }) => {
        const validator = MonthlyExpensesInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.generateValidationEntries()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MonthlyExpensesInputValidator', () => {
  describe('#isValidYear()', () => {
    /*
     * A year a `YYYY-MM-DD` date can hold. The two ends of the four-digit range are here rather
     * than only the plausible years, because the bound is the date format's and not a business
     * rule -- a rule that accepted 2026 and rejected 3000 would be a policy nobody decided.
     *
     * The string cases are here because GraphQL input reaches a resolver string-coercible in
     * places, which is what `isIntegerLike()` is for.
     */
    describe('when the presented year is one a calendar date can name', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 6,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 1,
              month: 6,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 9999,
              month: 6,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 3000, // far in the future, and accepted: no maximum of that kind is declared
              month: 6,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 1970, // long before any row of this product, and accepted for the same reason
              month: 6,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: '2024', // string-coercible, as GraphQL input can arrive
              month: 6,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
      ]

      test.each(cases)('input.year: $factoryParams.input.year', ({
        factoryParams,
      }) => {
        const validator = MonthlyExpensesInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidYear()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('MonthlyExpensesInputValidator', () => {
  describe('#isValidYear()', () => {
    /*
     * A year no calendar date can be written with, or no year at all. `0` and `10000` are the two
     * values one past each end of the four-digit range, so a bound written with the comparison the
     * wrong way round fails here.
     *
     * `2026.5` is an integer check rather than a range one, and `''` is here because the inspector
     * normalizes an empty string to `0` -- so an emptiness that looks harmless is refused by the
     * lower end of the range rather than slipping through as a number.
     */
    describe('when the presented year is one no calendar date can name', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              year: 0,
              month: 6,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 10000,
              month: 6,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: -5,
              month: 6,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2026.5,
              month: 6,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 'twenty twenty six',
              month: 6,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: '', // normalizes to 0, so the range refuses it rather than the integer check
              month: 6,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: null,
              month: 6,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
      ]

      test.each(cases)('input.year: $factoryParams.input.year', ({
        factoryParams,
      }) => {
        const validator = MonthlyExpensesInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidYear()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('MonthlyExpensesInputValidator', () => {
  describe('#createYearInspector()', () => {
    describe('should read the presented year', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              year: 2021,
              month: 6,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
          expected: expect.objectContaining({
            value: 2021,
          }),
        },
        {
          factoryParams: {
            input: {
              year: 2022,
              month: 7,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
          expected: expect.objectContaining({
            value: 2022,
          }),
        },
      ]

      test.each(cases)('input.year: $factoryParams.input.year', ({
        factoryParams,
        expected,
      }) => {
        const validator = MonthlyExpensesInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createYearInspector()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MonthlyExpensesInputValidator', () => {
  describe('#createYearInspector()', () => {
    describe('should be an inspector of integers', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              year: 2023,
              month: 8,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2024,
              month: 9,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
      ]

      test.each(cases)('input.year: $factoryParams.input.year', ({
        factoryParams,
      }) => {
        const validator = MonthlyExpensesInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createYearInspector()

        expect(actual)
          .toBeInstanceOf(IntegerValueInspector)
      })
    })
  })
})

describe('MonthlyExpensesInputValidator', () => {
  describe('#isValidMonth()', () => {
    /*
     * The twelve months, enumerated rather than sampled: the set is finite and small, and both
     * ends of it are a boundary a comparison can be written the wrong way round at. The
     * string-coercible case is here for the same reason it is on the year.
     */
    describe('when the presented month is one of the twelve', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 1,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 2,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 3,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 4,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 5,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 6,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 7,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 8,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 9,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 10,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 11,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 12,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: '3', // string-coercible, as GraphQL input can arrive
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
      ]

      test.each(cases)('input.month: $factoryParams.input.month', ({
        factoryParams,
      }) => {
        const validator = MonthlyExpensesInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidMonth()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('MonthlyExpensesInputValidator', () => {
  describe('#isValidMonth()', () => {
    /*
     * A value that names no month. `0` and `13` are the two values one past each end of the
     * twelve, and `13` is the one that would not fail if it were let through -- it would be built
     * into the pair `2026-13-01` / `2026-13-31` and match nothing, so the caller would be told
     * their month was empty about a month that does not exist.
     */
    describe('when the presented month names no month', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 0,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 13,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: -1,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 6.5,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 'June',
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: '', // normalizes to 0, so the range refuses it rather than the integer check
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: null,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
      ]

      test.each(cases)('input.month: $factoryParams.input.month', ({
        factoryParams,
      }) => {
        const validator = MonthlyExpensesInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidMonth()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('MonthlyExpensesInputValidator', () => {
  describe('#createMonthInspector()', () => {
    describe('should read the presented month', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 4,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
          expected: expect.objectContaining({
            value: 4,
          }),
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 10,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
          expected: expect.objectContaining({
            value: 10,
          }),
        },
      ]

      test.each(cases)('input.month: $factoryParams.input.month', ({
        factoryParams,
        expected,
      }) => {
        const validator = MonthlyExpensesInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createMonthInspector()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MonthlyExpensesInputValidator', () => {
  describe('#createMonthInspector()', () => {
    describe('should be an inspector of integers', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 2,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 11,
            },
            errorHash: {
              InvalidYear: 'error-ctor-invalid-year',
              InvalidMonth: 'error-ctor-invalid-month',
            },
          },
        },
      ]

      test.each(cases)('input.month: $factoryParams.input.month', ({
        factoryParams,
      }) => {
        const validator = MonthlyExpensesInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createMonthInspector()

        expect(actual)
          .toBeInstanceOf(IntegerValueInspector)
      })
    })
  })
})

describe('MonthlyExpensesInputValidator', () => {
  describe('#validateInput()', () => {
    /*
     * The whole validator against a month nobody could be answered for, with the real error
     * classes the resolver declares rather than markers -- this is where the rule order shows: an
     * input that breaks both rules is refused by the year's, because only the first failing rule
     * surfaces.
     *
     * The error arrives created, and its message is the code, which is how a resolver's refusal
     * reaches a caller.
     */
    describe('should refuse a month nobody could be answered for', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              year: 0,
              month: 6,
            },
          },
          label: 'a year before the first a calendar date can name',
          expected: '203.Q004.001',
        },
        {
          factoryParams: {
            input: {
              year: 10000,
              month: 6,
            },
          },
          label: 'a year past the last a calendar date can name',
          expected: '203.Q004.001',
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 13,
            },
          },
          label: 'a thirteenth month',
          expected: '203.Q004.002',
        },
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 0,
            },
          },
          label: 'a zeroth month',
          expected: '203.Q004.002',
        },
        {
          factoryParams: {
            input: {
              year: -1,
              month: 13,
            },
          },
          label: 'both wrong at once, refused by the year',
          expected: '203.Q004.001',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        expected,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()
        const validator = MonthlyExpensesInputValidator.create({
          input: /** @type {*} */ (factoryParams.input),
          errorHash: resolver.errorHash,
        })

        const actual = validator.validateInput()

        expect(actual)
          .toHaveProperty('message', expected)
      })
    })
  })
})

describe('MonthlyExpensesInputValidator', () => {
  describe('#validateInput()', () => {
    /*
     * A month far in the future and a month long before this product existed both pass, and that
     * is the decision rather than an oversight: the specification declares no bound of either
     * kind, and a month holding nothing is answered as an empty month with a total of zero.
     */
    describe('when the presented month satisfies every rule', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              year: 2026,
              month: 6,
            },
          },
          label: 'an ordinary month',
        },
        {
          factoryParams: {
            input: {
              year: 2999,
              month: 12,
            },
          },
          label: 'a month far in the future',
        },
        {
          factoryParams: {
            input: {
              year: 1970,
              month: 1,
            },
          },
          label: 'a month long before this product existed',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()
        const validator = MonthlyExpensesInputValidator.create({
          input: /** @type {*} */ (factoryParams.input),
          errorHash: resolver.errorHash,
        })

        const actual = validator.validateInput()

        expect(actual)
          .toBeNull()
      })
    })
  })
})
