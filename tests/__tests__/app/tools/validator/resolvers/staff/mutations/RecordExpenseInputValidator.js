import {
  IntegerValueInspector,
  ValueInspector,
} from '@openreachtech/mentsu-value-inspector'

import RecordExpenseMutationResolver from '../../../../../../../../server/graphql/resolvers/staff/actual/mutations/RecordExpenseMutationResolver.js'

import RecordExpenseInputValidator from '../../../../../../../../app/tools/validator/resolvers/staff/mutations/RecordExpenseInputValidator.js'

import CalendarDateInspector from '../../../../../../../../app/tools/calendar/CalendarDateInspector.js'

import BaseInputValidator from '../../../../../../../../app/tools/validator/BaseInputValidator.js'

/*
 * Nothing here reads a row, and nothing here writes one: a rule of this validator is a function of
 * the input and of the instant handed to it, and that is the whole reason `readAt` is a property
 * rather than a clock the class reaches for.
 *
 * **Every instant below is stated, and several of them are stated in UTC on purpose.** The zone
 * calendar dates are read in is `Asia/Tokyo` (`constants/calendarConstants.cjs`, Q49), nine hours
 * ahead, so `2026-09-14T22:00:00.000Z` is already the 15th where this product lives. A case
 * carrying that instant and a `spentOn` of `2026-09-15` therefore passes here and would be refused
 * as a future date by a validator reading UTC — which is exactly the defect the constant exists to
 * prevent, and it is checked rather than assumed.
 */

describe('RecordExpenseInputValidator', () => {
  describe('super class', () => {
    test('to be instance of BaseInputValidator', () => {
      const actual = RecordExpenseInputValidator.prototype

      expect(actual)
        .toBeInstanceOf(BaseInputValidator)
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#input', () => {
        const cases = [
          {
            params: {
              input: {
                spentOn: '2026-09-10',
                amount: 1200,
                expenseCategoryId: 10000001,
                memo: 'train fare to the client',
              },
              errorHash: {
                MissingAmount: 'error-ctor-missing-amount',
              },
              readAt: new Date('2026-09-15T01:00:00.000Z'),
            },
          },
          {
            params: {
              input: {
                spentOn: '2026-08-04',
                amount: 880,
                expenseCategoryId: 10000002,
                memo: null,
              },
              errorHash: {
                MissingAmount: 'error-ctor-missing-amount',
              },
              readAt: new Date('2026-09-15T02:00:00.000Z'),
            },
          },
        ]

        test.each(cases)('input.spentOn: $params.input.spentOn', ({
          params,
        }) => {
          const validator = RecordExpenseInputValidator.create(/** @type {*} */ (params))

          expect(validator)
            .toHaveProperty('input', params.input)
        })
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#errorHash', () => {
        const cases = [
          {
            params: {
              input: {
                spentOn: '2026-09-11',
                amount: 2400,
                expenseCategoryId: 10000003,
                memo: 'notebooks',
              },
              errorHash: {
                MissingAmount: 'error-ctor-missing-amount',
              },
              readAt: new Date('2026-09-15T03:00:00.000Z'),
            },
          },
          {
            params: {
              input: {
                spentOn: '2026-09-12',
                amount: 3600,
                expenseCategoryId: 10000004,
                memo: 'conference ticket',
              },
              errorHash: {
                InvalidAmount: 'error-ctor-invalid-amount',
              },
              readAt: new Date('2026-09-15T04:00:00.000Z'),
            },
          },
        ]

        test.each(cases)('input.spentOn: $params.input.spentOn', ({
          params,
        }) => {
          const validator = RecordExpenseInputValidator.create(/** @type {*} */ (params))

          expect(validator)
            .toHaveProperty('errorHash', params.errorHash)
        })
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      /*
       * The third property, and the one the base does not hold: `readAt` is why this class declares
       * a constructor and a factory method of its own at all.
       */
      describe('#readAt', () => {
        const cases = [
          {
            params: {
              input: {
                spentOn: '2026-09-13',
                amount: 640,
                expenseCategoryId: 10000001,
                memo: 'taxi from the station',
              },
              errorHash: {
                FutureSpentOn: 'error-ctor-future-spent-on',
              },
              readAt: new Date('2026-09-15T05:00:00.000Z'),
            },
          },
          {
            params: {
              input: {
                spentOn: '2026-09-14',
                amount: 715,
                expenseCategoryId: 10000002,
                memo: 'postage',
              },
              errorHash: {
                FutureSpentOn: 'error-ctor-future-spent-on',
              },
              readAt: new Date('2026-09-16T06:00:00.000Z'),
            },
          },
        ]

        test.each(cases)('readAt: $params.readAt', ({
          params,
        }) => {
          const validator = RecordExpenseInputValidator.create(/** @type {*} */ (params))

          expect(validator)
            .toHaveProperty('readAt', params.readAt)
        })
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-01',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              MissingAmount: 'error-ctor-missing-amount',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-02',
              amount: 4800,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              MissingAmount: 'error-ctor-missing-amount',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const actual = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        expect(actual)
          .toBeInstanceOf(RecordExpenseInputValidator)
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('.create()', () => {
    /*
     * The factory method is declared here rather than inherited — the base builds its instance from
     * `input` and `errorHash` alone — so that all three properties reach the constructor is the
     * thing worth pinning.
     */
    describe('should be call by constructor', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-03',
              amount: 260,
              expenseCategoryId: 10000003,
              memo: 'bus ride',
            },
            errorHash: {
              MissingAmount: 'error-ctor-missing-amount',
            },
            readAt: new Date('2026-09-15T03:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-04',
              amount: 5730,
              expenseCategoryId: 10000004,
              memo: 'team breakfast',
            },
            errorHash: {
              MissingAmount: 'error-ctor-missing-amount',
            },
            readAt: new Date('2026-09-15T04:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(RecordExpenseInputValidator)

        SpyClass.create(/** @type {*} */ (factoryParams))

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(factoryParams)
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#generateValidationEntries()', () => {
    /*
     * Eight rules, in the order they are answered in, because only the first failing rule surfaces:
     * the three presence rules come first so a field left out is never reported as a field of the
     * wrong shape, and `MalformedSpentOn` comes before `FutureSpentOn` because
     * `CalendarDateInspector#isAfterToday()` answers false for a string that is no date at all.
     *
     * Each error class stands in as a marker string — this method only pairs a rule with its error,
     * and a marker makes the pairing readable.
     */
    describe('should declare the eight rules in order', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-05',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              MissingSpentOn: 'error-ctor-missing-spent-on',
              MissingAmount: 'error-ctor-missing-amount',
              MissingExpenseCategoryId: 'error-ctor-missing-expense-category-id',
              MalformedSpentOn: 'error-ctor-malformed-spent-on',
              InvalidAmount: 'error-ctor-invalid-amount',
              InvalidExpenseCategoryId: 'error-ctor-invalid-expense-category-id',
              FutureSpentOn: 'error-ctor-future-spent-on',
              TooLongMemo: 'error-ctor-too-long-memo',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: [
            [expect.any(Function), 'error-ctor-missing-spent-on'],
            [expect.any(Function), 'error-ctor-missing-amount'],
            [expect.any(Function), 'error-ctor-missing-expense-category-id'],
            [expect.any(Function), 'error-ctor-malformed-spent-on'],
            [expect.any(Function), 'error-ctor-invalid-amount'],
            [expect.any(Function), 'error-ctor-invalid-expense-category-id'],
            [expect.any(Function), 'error-ctor-future-spent-on'],
            [expect.any(Function), 'error-ctor-too-long-memo'],
          ],
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-06',
              amount: -4500,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              MissingSpentOn: 'error-ctor-missing-spent-on',
              MissingAmount: 'error-ctor-missing-amount',
              MissingExpenseCategoryId: 'error-ctor-missing-expense-category-id',
              MalformedSpentOn: 'error-ctor-malformed-spent-on',
              InvalidAmount: 'error-ctor-invalid-amount',
              InvalidExpenseCategoryId: 'error-ctor-invalid-expense-category-id',
              FutureSpentOn: 'error-ctor-future-spent-on',
              TooLongMemo: 'error-ctor-too-long-memo',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
          expected: [
            [expect.any(Function), 'error-ctor-missing-spent-on'],
            [expect.any(Function), 'error-ctor-missing-amount'],
            [expect.any(Function), 'error-ctor-missing-expense-category-id'],
            [expect.any(Function), 'error-ctor-malformed-spent-on'],
            [expect.any(Function), 'error-ctor-invalid-amount'],
            [expect.any(Function), 'error-ctor-invalid-expense-category-id'],
            [expect.any(Function), 'error-ctor-future-spent-on'],
            [expect.any(Function), 'error-ctor-too-long-memo'],
          ],
        },
      ]

      test.each(cases)('input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
        expected,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.generateValidationEntries()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#hasSpentOn()', () => {
    describe('when a date was presented', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              MissingSpentOn: 'error-ctor-missing-spent-on',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: 'not a date at all', // present, and the format rule refuses it
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              MissingSpentOn: 'error-ctor-missing-spent-on',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.hasSpentOn()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#hasSpentOn()', () => {
    describe('when no date was presented', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: null,
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              MissingSpentOn: 'error-ctor-missing-spent-on',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              // spentOn: undefined
              amount: 880,
              expenseCategoryId: 10000002,
              memo: 'lunch while on site',
            },
            errorHash: {
              MissingSpentOn: 'error-ctor-missing-spent-on',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.amount: $factoryParams.input.amount', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.hasSpentOn()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#createSpentOnPresenceInspector()', () => {
    describe('should read the presented date', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-08',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              MissingSpentOn: 'error-ctor-missing-spent-on',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: expect.objectContaining({
            value: '2026-09-08',
          }),
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-09',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              MissingSpentOn: 'error-ctor-missing-spent-on',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
          expected: expect.objectContaining({
            value: '2026-09-09',
          }),
        },
      ]

      test.each(cases)('input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
        expected,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createSpentOnPresenceInspector()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#createSpentOnPresenceInspector()', () => {
    describe('should be a plain value inspector', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-10',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              MissingSpentOn: 'error-ctor-missing-spent-on',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-11',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              MissingSpentOn: 'error-ctor-missing-spent-on',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createSpentOnPresenceInspector()

        expect(actual)
          .toBeInstanceOf(ValueInspector)
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#hasAmount()', () => {
    /*
     * **Zero and a negative amount satisfy this rule**, and that is the rule split section 11's
     * first criterion needs: both were presented, so "no amount" is not what is wrong with them.
     * `#isValidAmount()` is what refuses them.
     */
    describe('when an amount was presented', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              MissingAmount: 'error-ctor-missing-amount',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: 0, // presented, and refused by the amount rule rather than by this one
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              MissingAmount: 'error-ctor-missing-amount',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: -4500, // presented, and refused by the amount rule rather than by this one
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              MissingAmount: 'error-ctor-missing-amount',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.amount: $factoryParams.input.amount', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.hasAmount()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#hasAmount()', () => {
    /*
     * **This is "an expense with no amount" — the first third of section 11's first criterion.**
     */
    describe('when no amount was presented', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: null,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              MissingAmount: 'error-ctor-missing-amount',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-08',
              // amount: undefined
              expenseCategoryId: 10000002,
              memo: 'lunch while on site',
            },
            errorHash: {
              MissingAmount: 'error-ctor-missing-amount',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.hasAmount()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#createAmountPresenceInspector()', () => {
    describe('should read the presented amount', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              MissingAmount: 'error-ctor-missing-amount',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: expect.objectContaining({
            value: 1200,
          }),
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-08',
              amount: 0,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              MissingAmount: 'error-ctor-missing-amount',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
          expected: expect.objectContaining({
            value: 0,
          }),
        },
      ]

      test.each(cases)('input.amount: $factoryParams.input.amount', ({
        factoryParams,
        expected,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createAmountPresenceInspector()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#createAmountPresenceInspector()', () => {
    describe('should be a plain value inspector', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: 640,
              expenseCategoryId: 10000001,
              memo: 'taxi from the station',
            },
            errorHash: {
              MissingAmount: 'error-ctor-missing-amount',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-08',
              amount: 2175,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              MissingAmount: 'error-ctor-missing-amount',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.amount: $factoryParams.input.amount', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createAmountPresenceInspector()

        expect(actual)
          .toBeInstanceOf(ValueInspector)
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#hasExpenseCategoryId()', () => {
    describe('when a category was named', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              MissingExpenseCategoryId: 'error-ctor-missing-expense-category-id',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-08',
              amount: 880,
              expenseCategoryId: 10009992, // named, and no row of that id exists — the resolver's answer
              memo: null,
            },
            errorHash: {
              MissingExpenseCategoryId: 'error-ctor-missing-expense-category-id',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.expenseCategoryId: $factoryParams.input.expenseCategoryId', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.hasExpenseCategoryId()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#hasExpenseCategoryId()', () => {
    describe('when no category was named', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: 1200,
              expenseCategoryId: null,
              memo: 'train fare',
            },
            errorHash: {
              MissingExpenseCategoryId: 'error-ctor-missing-expense-category-id',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-08',
              amount: 880,
              // expenseCategoryId: undefined
              memo: null,
            },
            errorHash: {
              MissingExpenseCategoryId: 'error-ctor-missing-expense-category-id',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.hasExpenseCategoryId()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#createExpenseCategoryIdPresenceInspector()', () => {
    describe('should read the named category', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: 1200,
              expenseCategoryId: 10000003,
              memo: 'notebooks',
            },
            errorHash: {
              MissingExpenseCategoryId: 'error-ctor-missing-expense-category-id',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: expect.objectContaining({
            value: 10000003,
          }),
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-08',
              amount: 880,
              expenseCategoryId: 10000004,
              memo: null,
            },
            errorHash: {
              MissingExpenseCategoryId: 'error-ctor-missing-expense-category-id',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
          expected: expect.objectContaining({
            value: 10000004,
          }),
        },
      ]

      test.each(cases)('input.expenseCategoryId: $factoryParams.input.expenseCategoryId', ({
        factoryParams,
        expected,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createExpenseCategoryIdPresenceInspector()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#createExpenseCategoryIdPresenceInspector()', () => {
    describe('should be a plain value inspector', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              MissingExpenseCategoryId: 'error-ctor-missing-expense-category-id',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-08',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              MissingExpenseCategoryId: 'error-ctor-missing-expense-category-id',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.expenseCategoryId: $factoryParams.input.expenseCategoryId', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createExpenseCategoryIdPresenceInspector()

        expect(actual)
          .toBeInstanceOf(ValueInspector)
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#isValidSpentOnFormat()', () => {
    /*
     * The leap day is here because it is the case a hand-written regular expression gets wrong in
     * the other direction: `2024-02-29` exists and must be accepted.
     */
    describe('when the presented date is a calendar date', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              MalformedSpentOn: 'error-ctor-malformed-spent-on',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2024-02-29', // a leap day, which exists
              amount: 880,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              MalformedSpentOn: 'error-ctor-malformed-spent-on',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-06-30', // the last day of a thirty-day month
              amount: 1,
              expenseCategoryId: 10000003,
              memo: 'one envelope',
            },
            errorHash: {
              MalformedSpentOn: 'error-ctor-malformed-spent-on',
            },
            readAt: new Date('2026-09-15T03:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidSpentOnFormat()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#isValidSpentOnFormat()', () => {
    describe('when the presented date is no calendar date', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2024-02-30', // a day February does not have
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              MalformedSpentOn: 'error-ctor-malformed-spent-on',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-9-15', // not zero-padded
              amount: 880,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              MalformedSpentOn: 'error-ctor-malformed-spent-on',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: 'yesterday',
              amount: 640,
              expenseCategoryId: 10000003,
              memo: 'taxi from the station',
            },
            errorHash: {
              MalformedSpentOn: 'error-ctor-malformed-spent-on',
            },
            readAt: new Date('2026-09-15T03:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidSpentOnFormat()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#isValidAmount()', () => {
    describe('when the presented amount is one an expense can carry', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              InvalidAmount: 'error-ctor-invalid-amount',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-08',
              amount: 1, // the smallest amount accepted at all
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              InvalidAmount: 'error-ctor-invalid-amount',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-09',
              amount: 98000,
              expenseCategoryId: 10000003,
              memo: 'annual membership',
            },
            errorHash: {
              InvalidAmount: 'error-ctor-invalid-amount',
            },
            readAt: new Date('2026-09-15T03:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.amount: $factoryParams.input.amount', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidAmount()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#isValidAmount()', () => {
    /*
     * **Zero and a negative amount — the other two thirds of section 11's first criterion.** The
     * fractional case is here because the yen has no minor unit and the column is an `int`, and the
     * string case because a `*Like` predicate is what a GraphQL input asks for: `'-2500'` must be
     * refused exactly as `-2500` is.
     */
    describe('when the presented amount is one no expense can carry', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: 0,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              InvalidAmount: 'error-ctor-invalid-amount',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-08',
              amount: -4500,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              InvalidAmount: 'error-ctor-invalid-amount',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-09',
              amount: 1200.5, // the yen has no minor unit
              expenseCategoryId: 10000003,
              memo: 'notebooks',
            },
            errorHash: {
              InvalidAmount: 'error-ctor-invalid-amount',
            },
            readAt: new Date('2026-09-15T03:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-10',
              amount: '-2500', // string-coercible, and refused exactly as the number would be
              expenseCategoryId: 10000004,
              memo: 'conference ticket',
            },
            errorHash: {
              InvalidAmount: 'error-ctor-invalid-amount',
            },
            readAt: new Date('2026-09-15T04:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.amount: $factoryParams.input.amount', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidAmount()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#createAmountInspector()', () => {
    describe('should be an inspector of integers', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: 3450,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              InvalidAmount: 'error-ctor-invalid-amount',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-08',
              amount: 12000,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              InvalidAmount: 'error-ctor-invalid-amount',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.amount: $factoryParams.input.amount', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createAmountInspector()

        expect(actual)
          .toBeInstanceOf(IntegerValueInspector)
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#createAmountInspector()', () => {
    describe('should read the presented amount', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: 715,
              expenseCategoryId: 10000001,
              memo: 'postage',
            },
            errorHash: {
              InvalidAmount: 'error-ctor-invalid-amount',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: expect.objectContaining({
            value: 715,
          }),
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-08',
              amount: 4390,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              InvalidAmount: 'error-ctor-invalid-amount',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
          expected: expect.objectContaining({
            value: 4390,
          }),
        },
      ]

      test.each(cases)('input.amount: $factoryParams.input.amount', ({
        factoryParams,
        expected,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createAmountInspector()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#isValidExpenseCategoryId()', () => {
    describe('when the named category is a value a category id can take', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              InvalidExpenseCategoryId: 'error-ctor-invalid-expense-category-id',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-08',
              amount: 880,
              expenseCategoryId: 10009992, // a value, and no row — existence is the resolver's answer
              memo: null,
            },
            errorHash: {
              InvalidExpenseCategoryId: 'error-ctor-invalid-expense-category-id',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.expenseCategoryId: $factoryParams.input.expenseCategoryId', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidExpenseCategoryId()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#isValidExpenseCategoryId()', () => {
    describe('when the named category is a value no category id can take', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: 1200,
              expenseCategoryId: 0,
              memo: 'train fare',
            },
            errorHash: {
              InvalidExpenseCategoryId: 'error-ctor-invalid-expense-category-id',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-08',
              amount: 880,
              expenseCategoryId: -3,
              memo: null,
            },
            errorHash: {
              InvalidExpenseCategoryId: 'error-ctor-invalid-expense-category-id',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-09',
              amount: 640,
              expenseCategoryId: 10000001.5,
              memo: 'taxi from the station',
            },
            errorHash: {
              InvalidExpenseCategoryId: 'error-ctor-invalid-expense-category-id',
            },
            readAt: new Date('2026-09-15T03:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.expenseCategoryId: $factoryParams.input.expenseCategoryId', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidExpenseCategoryId()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#createExpenseCategoryIdInspector()', () => {
    describe('should be an inspector of integers', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              InvalidExpenseCategoryId: 'error-ctor-invalid-expense-category-id',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-08',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              InvalidExpenseCategoryId: 'error-ctor-invalid-expense-category-id',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.expenseCategoryId: $factoryParams.input.expenseCategoryId', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createExpenseCategoryIdInspector()

        expect(actual)
          .toBeInstanceOf(IntegerValueInspector)
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#createExpenseCategoryIdInspector()', () => {
    describe('should read the named category', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: 1200,
              expenseCategoryId: 10000003,
              memo: 'notebooks',
            },
            errorHash: {
              InvalidExpenseCategoryId: 'error-ctor-invalid-expense-category-id',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: expect.objectContaining({
            value: 10000003,
          }),
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-08',
              amount: 880,
              expenseCategoryId: 10000004,
              memo: null,
            },
            errorHash: {
              InvalidExpenseCategoryId: 'error-ctor-invalid-expense-category-id',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
          expected: expect.objectContaining({
            value: 10000004,
          }),
        },
      ]

      test.each(cases)('input.expenseCategoryId: $factoryParams.input.expenseCategoryId', ({
        factoryParams,
        expected,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createExpenseCategoryIdInspector()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#isSpentOnAtLatestToday()', () => {
    /*
     * **Today itself passes**, which is the ordinary case this feature exists for: a member of
     * staff recording this evening's train fare.
     *
     * The third case is the timezone, checked rather than assumed. `2026-09-14T22:00:00.000Z` is
     * `2026-09-15T07:00` in Tokyo, so a `spentOn` of `2026-09-15` is today — and would be tomorrow,
     * and refused, to a validator reading the instant in UTC.
     *
     * The fourth is the malformed date: it satisfies this rule rather than failing it, because the
     * format rule declared ahead of it owns that verdict.
     */
    describe('when the money was paid today or before it', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-14',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              FutureSpentOn: 'error-ctor-future-spent-on',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-15', // today in Tokyo, where this product reads calendar dates
              amount: 880,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              FutureSpentOn: 'error-ctor-future-spent-on',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-15', // still today: 22:00Z is 07:00 the next morning in Tokyo
              amount: 640,
              expenseCategoryId: 10000003,
              memo: 'taxi from the station',
            },
            errorHash: {
              FutureSpentOn: 'error-ctor-future-spent-on',
            },
            readAt: new Date('2026-09-14T22:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: 'not a date at all', // the format rule refuses it; this rule does not
              amount: 715,
              expenseCategoryId: 10000004,
              memo: 'postage',
            },
            errorHash: {
              FutureSpentOn: 'error-ctor-future-spent-on',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.amount: $factoryParams.input.amount', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isSpentOnAtLatestToday()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#isSpentOnAtLatestToday()', () => {
    /*
     * **This is section 11's "an expense dated after today is refused".** The first case is
     * tomorrow — the boundary, one day past what is accepted — and the second a date far enough
     * ahead that no reading of any zone could call it today.
     *
     * The third is the same boundary read an hour before Tokyo rolls over: at
     * `2026-09-15T14:00:00.000Z` it is 23:00 on the 15th there, so `2026-09-16` is still tomorrow
     * and still refused. An hour later the same date is today and is accepted — which is the
     * boundary moving with the zone rather than with the host's own clock.
     */
    describe('when the money was paid after today', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-16', // tomorrow: one day past the boundary
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              FutureSpentOn: 'error-ctor-future-spent-on',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2099-12-31',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              FutureSpentOn: 'error-ctor-future-spent-on',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-16', // still tomorrow at 23:00 in Tokyo, an hour before it rolls over
              amount: 640,
              expenseCategoryId: 10000003,
              memo: 'taxi from the station',
            },
            errorHash: {
              FutureSpentOn: 'error-ctor-future-spent-on',
            },
            readAt: new Date('2026-09-15T14:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.amount: $factoryParams.input.amount', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isSpentOnAtLatestToday()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#createCalendarDateInspector()', () => {
    describe('should be a calendar date inspector', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              FutureSpentOn: 'error-ctor-future-spent-on',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-08',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              FutureSpentOn: 'error-ctor-future-spent-on',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createCalendarDateInspector()

        expect(actual)
          .toBeInstanceOf(CalendarDateInspector)
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#createCalendarDateInspector()', () => {
    /*
     * The inspector carries this request's instant rather than one of its own, and the zone the
     * product reads calendar dates in — which is what makes "today" the same day for every rule of
     * this request, and a test able to state it.
     */
    describe('should hold the presented date, this request instant and the product timezone', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-09',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              FutureSpentOn: 'error-ctor-future-spent-on',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: expect.objectContaining({
            calendarDate: '2026-09-09',
            readAt: new Date('2026-09-15T01:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          }),
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-10',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              FutureSpentOn: 'error-ctor-future-spent-on',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
          expected: expect.objectContaining({
            calendarDate: '2026-09-10',
            readAt: new Date('2026-09-15T02:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          }),
        },
      ]

      test.each(cases)('input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
        expected,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createCalendarDateInspector()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#isValidMemoCharacterCount()', () => {
    /*
     * **The memo being optional is checked here as two cases that pass, not as a rule that fires.**
     * A null memo and an absent one are both nothing to measure, so this rule is satisfied — and it
     * is the only rule that reads `memo` at all, which is what makes an input carrying none
     * acceptable to the whole validator.
     *
     * The 191-character case is the column exactly filled, and the multi-byte one is why the count
     * is in code points: `varchar(191)` bounds characters, and a memo of 191 Japanese characters
     * fits.
     */
    describe('when the presented memo fits the column that has to hold it', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare to the client in Shinagawa',
            },
            errorHash: {
              TooLongMemo: 'error-ctor-too-long-memo',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-08',
              amount: 880,
              memo: null, // the optional memo, left out
              expenseCategoryId: 10000002,
            },
            errorHash: {
              TooLongMemo: 'error-ctor-too-long-memo',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-09',
              amount: 640,
              expenseCategoryId: 10000003,
              // memo: undefined -- the optional memo, not sent at all
            },
            errorHash: {
              TooLongMemo: 'error-ctor-too-long-memo',
            },
            readAt: new Date('2026-09-15T03:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-10',
              amount: 715,
              expenseCategoryId: 10000004,
              memo: 'x'.repeat(191), // the column exactly filled
            },
            errorHash: {
              TooLongMemo: 'error-ctor-too-long-memo',
            },
            readAt: new Date('2026-09-15T04:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-11',
              amount: 2175,
              expenseCategoryId: 10000001,
              memo: '領'.repeat(191), // 191 characters, 573 bytes: characters are what the column counts
            },
            errorHash: {
              TooLongMemo: 'error-ctor-too-long-memo',
            },
            readAt: new Date('2026-09-15T05:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidMemoCharacterCount()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#isValidMemoCharacterCount()', () => {
    describe('when the presented memo is longer than the column that has to hold it', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-07',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'y'.repeat(192), // one character past the column
            },
            errorHash: {
              TooLongMemo: 'error-ctor-too-long-memo',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-08',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: 'z'.repeat(400),
            },
            errorHash: {
              TooLongMemo: 'error-ctor-too-long-memo',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const validator = RecordExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidMemoCharacterCount()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#validateInput()', () => {
    /*
     * The whole validator against an input no expense can be made of, with the real error classes
     * the resolver declares rather than markers — this is where the rule order shows, and where
     * section 11's first two criteria are answered as the codes a caller actually receives.
     *
     * The last case breaks the format rule and the future rule at once and is refused by the
     * format rule, because only the first failing rule surfaces — which is the ordering
     * `CalendarDateInspector#isAfterToday()` makes necessary rather than merely tidy.
     */
    describe('should refuse an input no expense can be made of', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-14',
              amount: null, // an expense with no amount
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M004.002',
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-13',
              amount: 0, // an amount of zero
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M004.005',
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-12',
              amount: -4500, // a negative amount
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M004.005',
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-16', // dated after today
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M004.007',
        },
        {
          factoryParams: {
            input: {
              spentOn: null, // no date at all
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M004.001',
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-11',
              amount: 1200,
              expenseCategoryId: null, // no category at all
              memo: 'train fare',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M004.003',
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-10',
              amount: 1200,
              expenseCategoryId: -3,
              memo: 'train fare',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M004.006',
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-09',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'w'.repeat(192),
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M004.008',
        },
        {
          factoryParams: {
            input: {
              spentOn: '2099-13-45', // no calendar date, and a future one had it been read as a date
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M004.004',
        },
      ]

      test.each(cases)('input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
        expected,
      }) => {
        const resolver = RecordExpenseMutationResolver.create()
        const validator = RecordExpenseInputValidator.create({
          input: /** @type {*} */ (factoryParams.input),
          errorHash: /** @type {*} */ (resolver.errorHash),
          readAt: factoryParams.readAt,
        })

        const actual = validator.validateInput()

        expect(actual)
          .toHaveProperty('message', expected)
      })
    })
  })
})

describe('RecordExpenseInputValidator', () => {
  describe('#validateInput()', () => {
    /*
     * **The memo-less input is here on purpose**: section 11 requires an expense recorded without a
     * memo to be accepted, and this is where "accepted" begins — no rule of this validator refuses
     * it, whether it arrives as null or not at all.
     */
    describe('when the presented input satisfies every rule', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-14',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare to the client in Shinagawa',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-09-15', // today, which is accepted
              amount: 1,
              expenseCategoryId: 10000002,
              memo: null, // the optional memo, sent empty
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              spentOn: '2026-06-01',
              amount: 98000,
              expenseCategoryId: 10000003,
              // memo: undefined -- the optional memo, not sent at all
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const resolver = RecordExpenseMutationResolver.create()
        const validator = RecordExpenseInputValidator.create({
          input: /** @type {*} */ (factoryParams.input),
          errorHash: /** @type {*} */ (resolver.errorHash),
          readAt: factoryParams.readAt,
        })

        const actual = validator.validateInput()

        expect(actual)
          .toBeNull()
      })
    })
  })
})
