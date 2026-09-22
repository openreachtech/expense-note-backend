import {
  IntegerValueInspector,
  ValueInspector,
} from '@openreachtech/mentsu-value-inspector'

import CorrectExpenseMutationResolver from '../../../../../../../../server/graphql/resolvers/staff/actual/mutations/CorrectExpenseMutationResolver.js'

import CorrectExpenseInputValidator from '../../../../../../../../app/tools/validator/resolvers/staff/mutations/CorrectExpenseInputValidator.js'

import CalendarDateInspector from '../../../../../../../../app/tools/calendar/CalendarDateInspector.js'

import BaseInputValidator from '../../../../../../../../app/tools/validator/BaseInputValidator.js'

/*
 * Nothing here reads a row, and nothing here writes one: a rule of this validator is a function of
 * the input and of the instant handed to it, and that is the whole reason `readAt` is a property
 * rather than a clock the class reaches for.
 *
 * **`expenseId` is read here only as a value, never as a row.** Whether an entry of that id exists,
 * and whether it belongs to the caller, are both rows and both the resolver's to answer -- under
 * one code that cannot tell them apart, which is the security property spec sections 7 and 11 ask
 * for. What this class decides is only whether the value presented is one an identifier could take.
 *
 * **Every instant below is stated, and several of them are stated in UTC on purpose.** The zone
 * calendar dates are read in is `Asia/Tokyo` (`constants/calendarConstants.cjs`, Q49), nine hours
 * ahead, so `2026-09-14T22:00:00.000Z` is already the 15th where this product lives. A case
 * carrying that instant and a `spentOn` of `2026-09-15` therefore passes here and would be refused
 * as a future date by a validator reading UTC -- which is exactly the defect the constant exists to
 * prevent, and it is checked rather than assumed.
 */

describe('CorrectExpenseInputValidator', () => {
  describe('super class', () => {
    test('to be instance of BaseInputValidator', () => {
      const actual = CorrectExpenseInputValidator.prototype

      expect(actual)
        .toBeInstanceOf(BaseInputValidator)
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#input', () => {
        const cases = [
          {
            params: {
              input: {
                expenseId: 10200001,
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
                expenseId: 10200002,
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

        test.each(cases)('params.input.expenseId: $params.input.expenseId', ({
          params,
        }) => {
          const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (params))

          expect(validator)
            .toHaveProperty('input', params.input)
        })
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#errorHash', () => {
        const cases = [
          {
            params: {
              input: {
                expenseId: 10200003,
                spentOn: '2026-09-11',
                amount: 2400,
                expenseCategoryId: 10000003,
                memo: 'notebooks for the design review',
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
                expenseId: 10200004,
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

        test.each(cases)('params.input.expenseId: $params.input.expenseId', ({
          params,
        }) => {
          const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (params))

          expect(validator)
            .toHaveProperty('errorHash', params.errorHash)
        })
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      /*
       * The third property, and the one the base does not hold: `readAt` is why this class declares a
       * constructor and a factory method of its own at all.
       */
      describe('#readAt', () => {
        const cases = [
          {
            params: {
              input: {
                expenseId: 10200005,
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
                expenseId: 10200006,
                spentOn: '2026-09-14',
                amount: 715,
                expenseCategoryId: 10000002,
                memo: 'postage on the signed contract',
              },
              errorHash: {
                FutureSpentOn: 'error-ctor-future-spent-on',
              },
              readAt: new Date('2026-09-15T06:00:00.000Z'),
            },
          },
        ]

        test.each(cases)('params.input.expenseId: $params.input.expenseId', ({
          params,
        }) => {
          const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (params))

          expect(validator)
            .toHaveProperty('readAt', params.readAt)
        })
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200007,
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
              expenseId: 10200008,
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

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
      }) => {
        const actual = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        expect(actual)
          .toBeInstanceOf(CorrectExpenseInputValidator)
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('.create()', () => {
    /*
     * The factory method is declared here rather than inherited -- the base builds its instance
     * from `input` and `errorHash` alone -- so that all three properties reach the constructor is
     * the thing worth pinning.
     */
    describe('should be call by constructor', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200009,
              spentOn: '2026-09-03',
              amount: 260,
              expenseCategoryId: 10000003,
              memo: 'bus ride back from the depot',
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
              expenseId: 10200010,
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

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(CorrectExpenseInputValidator)

        SpyClass.create(/** @type {*} */ (factoryParams))

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(factoryParams)
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#generateValidationEntries()', () => {
    /*
     * Ten rules, in the order they are answered in, because only the first failing rule surfaces: the
     * four presence rules come first so a field left out is never reported as a field of the wrong
     * shape, and `MalformedSpentOn` comes before `FutureSpentOn` because
     * `CalendarDateInspector#isAfterToday()` answers false for a string that is no date at all.
     *
     * **`MissingExpenseId` is declared first of all**, because a correction that names no entry has
     * nothing for any other rule to be about.
     *
     * Each error class stands in as a marker string -- this method only pairs a rule with its error,
     * and a marker makes the pairing readable.
     */
    describe('should declare the ten rules in order', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200011,
              spentOn: '2026-09-05',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
              MissingSpentOn: 'error-ctor-missing-spent-on',
              MissingAmount: 'error-ctor-missing-amount',
              MissingExpenseCategoryId: 'error-ctor-missing-expense-category-id',
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
              MalformedSpentOn: 'error-ctor-malformed-spent-on',
              InvalidAmount: 'error-ctor-invalid-amount',
              InvalidExpenseCategoryId: 'error-ctor-invalid-expense-category-id',
              FutureSpentOn: 'error-ctor-future-spent-on',
              TooLongMemo: 'error-ctor-too-long-memo',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: [
            [expect.any(Function), 'error-ctor-missing-expense-id'],
            [expect.any(Function), 'error-ctor-missing-spent-on'],
            [expect.any(Function), 'error-ctor-missing-amount'],
            [expect.any(Function), 'error-ctor-missing-expense-category-id'],
            [expect.any(Function), 'error-ctor-invalid-expense-id'],
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
              expenseId: 10200012,
              spentOn: '2026-09-06',
              amount: -4500,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
              MissingSpentOn: 'error-ctor-missing-spent-on',
              MissingAmount: 'error-ctor-missing-amount',
              MissingExpenseCategoryId: 'error-ctor-missing-expense-category-id',
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
              MalformedSpentOn: 'error-ctor-malformed-spent-on',
              InvalidAmount: 'error-ctor-invalid-amount',
              InvalidExpenseCategoryId: 'error-ctor-invalid-expense-category-id',
              FutureSpentOn: 'error-ctor-future-spent-on',
              TooLongMemo: 'error-ctor-too-long-memo',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
          expected: [
            [expect.any(Function), 'error-ctor-missing-expense-id'],
            [expect.any(Function), 'error-ctor-missing-spent-on'],
            [expect.any(Function), 'error-ctor-missing-amount'],
            [expect.any(Function), 'error-ctor-missing-expense-category-id'],
            [expect.any(Function), 'error-ctor-invalid-expense-id'],
            [expect.any(Function), 'error-ctor-malformed-spent-on'],
            [expect.any(Function), 'error-ctor-invalid-amount'],
            [expect.any(Function), 'error-ctor-invalid-expense-category-id'],
            [expect.any(Function), 'error-ctor-future-spent-on'],
            [expect.any(Function), 'error-ctor-too-long-memo'],
          ],
        },
      ]

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
        expected,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.generateValidationEntries()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#hasExpenseId()', () => {
    describe('when an entry was named', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200013,
              spentOn: '2026-09-07',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 1,
              spentOn: '2026-09-08',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.hasExpenseId()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#hasExpenseId()', () => {
    /*
     * Both spellings of "no entry": the field sent as null, and the field not sent at all. GraphQL
     * types `expenseId` as `Int!` and would refuse both before a resolver ran, so these are the rule
     * being asked directly -- which is how a caller reaching it any other way would arrive.
     */
    describe('when no entry was named', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: null,
              spentOn: '2026-09-09',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'a correction naming nothing',
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              // expenseId: undefined -- no entry named at all
              spentOn: '2026-09-10',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: 'a correction naming nothing at all',
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.hasExpenseId()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#createExpenseIdPresenceInspector()', () => {
    describe('should read the named entry', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200014,
              spentOn: '2026-09-11',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: expect.objectContaining({
            value: 10200014,
          }),
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200015,
              spentOn: '2026-09-12',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
          expected: expect.objectContaining({
            value: 10200015,
          }),
        },
      ]

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
        expected,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createExpenseIdPresenceInspector()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#createExpenseIdPresenceInspector()', () => {
    /*
     * A plain `ValueInspector` and not the integer one, because presence and shape are two rules with
     * two codes: this one answers only whether anything was named at all.
     */
    describe('should be a plain value inspector', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200016,
              spentOn: '2026-09-13',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200017,
              spentOn: '2026-09-14',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createExpenseIdPresenceInspector()

        expect(actual)
          .toBeInstanceOf(ValueInspector)
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#hasSpentOn()', () => {
    describe('when a date was presented', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200018,
              spentOn: '2026-09-15',
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
              expenseId: 10200019,
              spentOn: '2026-06-01',
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

      test.each(cases)('factoryParams.input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.hasSpentOn()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#hasSpentOn()', () => {
    describe('when no date was presented', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200020,
              spentOn: null,
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'a correction with no date',
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
              expenseId: 10200021,
              // spentOn: undefined -- no date presented at all
              amount: 880,
              expenseCategoryId: 10000002,
              memo: 'a correction with no date at all',
            },
            errorHash: {
              MissingSpentOn: 'error-ctor-missing-spent-on',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.hasSpentOn()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#createSpentOnPresenceInspector()', () => {
    describe('should read the presented date', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200022,
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
              expenseId: 10200023,
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

      test.each(cases)('factoryParams.input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
        expected,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createSpentOnPresenceInspector()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#createSpentOnPresenceInspector()', () => {
    describe('should be a plain value inspector', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200024,
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
              expenseId: 10200025,
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

      test.each(cases)('factoryParams.input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createSpentOnPresenceInspector()

        expect(actual)
          .toBeInstanceOf(ValueInspector)
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#hasAmount()', () => {
    /*
     * **Zero and a negative amount satisfy this rule**, and that is the rule split section 11's first
     * criterion needs: both were presented, so "no amount" is not what is wrong with them.
     * `#isValidAmount()` is the rule that refuses them, under a code of its own.
     */
    describe('when an amount was presented', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200026,
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
              expenseId: 10200027,
              spentOn: '2026-09-02',
              amount: 0,
              expenseCategoryId: 10000002,
              memo: 'a fare of zero yen',
            },
            errorHash: {
              MissingAmount: 'error-ctor-missing-amount',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200028,
              spentOn: '2026-09-03',
              amount: -4500,
              expenseCategoryId: 10000003,
              memo: 'a lunch that paid the payer',
            },
            errorHash: {
              MissingAmount: 'error-ctor-missing-amount',
            },
            readAt: new Date('2026-09-15T03:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.amount: $factoryParams.input.amount', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.hasAmount()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#hasAmount()', () => {
    /*
     * **This is the "an expense with no amount is refused" half of section 11's first criterion.**
     * Both spellings of "no amount" are presented: the field sent as null, and the field not sent at
     * all.
     */
    describe('when no amount was presented', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200029,
              spentOn: '2026-09-04',
              amount: null,
              expenseCategoryId: 10000001,
              memo: 'a fare with no amount beside it',
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
              expenseId: 10200030,
              spentOn: '2026-09-05',
              // amount: undefined -- not presented at all
              expenseCategoryId: 10000002,
              memo: 'a lunch with no amount beside it',
            },
            errorHash: {
              MissingAmount: 'error-ctor-missing-amount',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.hasAmount()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#createAmountPresenceInspector()', () => {
    describe('should read the presented amount', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200031,
              spentOn: '2026-09-06',
              amount: 3450,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              MissingAmount: 'error-ctor-missing-amount',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: expect.objectContaining({
            value: 3450,
          }),
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200032,
              spentOn: '2026-09-07',
              amount: 98000,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              MissingAmount: 'error-ctor-missing-amount',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
          expected: expect.objectContaining({
            value: 98000,
          }),
        },
      ]

      test.each(cases)('factoryParams.input.amount: $factoryParams.input.amount', ({
        factoryParams,
        expected,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createAmountPresenceInspector()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#createAmountPresenceInspector()', () => {
    describe('should be a plain value inspector', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200033,
              spentOn: '2026-09-08',
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
              expenseId: 10200034,
              spentOn: '2026-09-09',
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

      test.each(cases)('factoryParams.input.amount: $factoryParams.input.amount', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createAmountPresenceInspector()

        expect(actual)
          .toBeInstanceOf(ValueInspector)
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#hasExpenseCategoryId()', () => {
    describe('when a category was named', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200035,
              spentOn: '2026-09-10',
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
              expenseId: 10200036,
              spentOn: '2026-09-11',
              amount: 880,
              expenseCategoryId: 10000004,
              memo: null,
            },
            errorHash: {
              MissingExpenseCategoryId: 'error-ctor-missing-expense-category-id',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.expenseCategoryId: $factoryParams.input.expenseCategoryId', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.hasExpenseCategoryId()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#hasExpenseCategoryId()', () => {
    describe('when no category was named', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200037,
              spentOn: '2026-09-12',
              amount: 1200,
              expenseCategoryId: null,
              memo: 'a fare filed under nothing',
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
              expenseId: 10200038,
              spentOn: '2026-09-13',
              amount: 880,
              // expenseCategoryId: undefined -- no category named at all
              memo: 'a lunch filed under nothing',
            },
            errorHash: {
              MissingExpenseCategoryId: 'error-ctor-missing-expense-category-id',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.hasExpenseCategoryId()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#createExpenseCategoryIdPresenceInspector()', () => {
    describe('should read the named category', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200039,
              spentOn: '2026-09-14',
              amount: 1200,
              expenseCategoryId: 10000002,
              memo: 'train fare',
            },
            errorHash: {
              MissingExpenseCategoryId: 'error-ctor-missing-expense-category-id',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: expect.objectContaining({
            value: 10000002,
          }),
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200040,
              spentOn: '2026-09-15',
              amount: 880,
              expenseCategoryId: 10000003,
              memo: null,
            },
            errorHash: {
              MissingExpenseCategoryId: 'error-ctor-missing-expense-category-id',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
          expected: expect.objectContaining({
            value: 10000003,
          }),
        },
      ]

      test.each(cases)('factoryParams.input.expenseCategoryId: $factoryParams.input.expenseCategoryId', ({
        factoryParams,
        expected,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createExpenseCategoryIdPresenceInspector()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#createExpenseCategoryIdPresenceInspector()', () => {
    describe('should be a plain value inspector', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200041,
              spentOn: '2026-08-01',
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
              expenseId: 10200042,
              spentOn: '2026-08-02',
              amount: 880,
              expenseCategoryId: 10000004,
              memo: null,
            },
            errorHash: {
              MissingExpenseCategoryId: 'error-ctor-missing-expense-category-id',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.expenseCategoryId: $factoryParams.input.expenseCategoryId', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createExpenseCategoryIdPresenceInspector()

        expect(actual)
          .toBeInstanceOf(ValueInspector)
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#isValidExpenseId()', () => {
    /*
     * A string-coercible value is accepted as well as a number, because `#isIntegerLike()` and
     * `#isPositiveNumberLike()` read the value rather than its JavaScript type -- and a caller reaching
     * this operation other than through the schema can present `'10200001'`.
     */
    describe('when the named entry is a value an entry identifier can take', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200043,
              spentOn: '2026-08-03',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 1,
              spentOn: '2026-08-04',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: '10200044',
              spentOn: '2026-08-05',
              amount: 640,
              expenseCategoryId: 10000003,
              memo: 'a fare named by a string',
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
            readAt: new Date('2026-09-15T03:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidExpenseId()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#isValidExpenseId()', () => {
    /*
     * Zero, a negative number and a fractional one are all refused, because the column is a positive
     * whole number and nothing else can name a row.
     *
     * **None of these is a "not found".** A value no identifier can take is refused under
     * `203.M005.005` before any row is read at all, so nothing here says whether any entry exists.
     */
    describe('when the named entry is a value no entry identifier can take', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 0,
              spentOn: '2026-08-06',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'an entry numbered zero',
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: -10200001,
              spentOn: '2026-08-07',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: 'an entry numbered backwards',
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200045.5,
              spentOn: '2026-08-08',
              amount: 640,
              expenseCategoryId: 10000003,
              memo: 'half an entry',
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
            readAt: new Date('2026-09-15T03:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 'ten thousand',
              spentOn: '2026-08-09',
              amount: 260,
              expenseCategoryId: 10000004,
              memo: 'an entry named in words',
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
            readAt: new Date('2026-09-15T04:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidExpenseId()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#createExpenseIdInspector()', () => {
    describe('should be an inspector of integers', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200046,
              spentOn: '2026-08-10',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200047,
              spentOn: '2026-08-11',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createExpenseIdInspector()

        expect(actual)
          .toBeInstanceOf(IntegerValueInspector)
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#createExpenseIdInspector()', () => {
    describe('should read the named entry', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200048,
              spentOn: '2026-08-12',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: expect.objectContaining({
            value: 10200048,
          }),
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200049,
              spentOn: '2026-08-13',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
          expected: expect.objectContaining({
            value: 10200049,
          }),
        },
      ]

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
        expected,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createExpenseIdInspector()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#isValidSpentOnFormat()', () => {
    /*
     * A leap day is a calendar date and is accepted, which is what makes this the inspector's verdict
     * rather than a regular expression's.
     */
    describe('when the presented date is a calendar date', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200050,
              spentOn: '2026-09-15',
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
              expenseId: 10200051,
              spentOn: '2024-02-29',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: 'a leap day lunch',
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
              expenseId: 10200052,
              spentOn: '2026-01-01',
              amount: 640,
              expenseCategoryId: 10000003,
              memo: 'the first day of a year',
            },
            errorHash: {
              MalformedSpentOn: 'error-ctor-malformed-spent-on',
            },
            readAt: new Date('2026-09-15T03:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidSpentOnFormat()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#isValidSpentOnFormat()', () => {
    /*
     * A day the month does not have is refused as well as a shape a date does not take, and a date
     * written without its leading zeroes is refused too -- `2026-9-15` is not the `YYYY-MM-DD` the
     * contract declares.
     */
    describe('when the presented date is no calendar date', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200053,
              spentOn: '2024-02-30',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'a day February does not have',
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
              expenseId: 10200054,
              spentOn: '2026-9-15',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: 'a date without its leading zero',
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
              expenseId: 10200055,
              spentOn: 'the fifteenth',
              amount: 640,
              expenseCategoryId: 10000003,
              memo: 'a date written in words',
            },
            errorHash: {
              MalformedSpentOn: 'error-ctor-malformed-spent-on',
            },
            readAt: new Date('2026-09-15T03:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200056,
              spentOn: '2026-13-01',
              amount: 260,
              expenseCategoryId: 10000004,
              memo: 'a thirteenth month',
            },
            errorHash: {
              MalformedSpentOn: 'error-ctor-malformed-spent-on',
            },
            readAt: new Date('2026-09-15T04:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidSpentOnFormat()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#isValidAmount()', () => {
    /*
     * One yen is accepted, which is the smallest amount there is: the boundary is zero, not one.
     */
    describe('when the presented amount is one an expense can carry', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200057,
              spentOn: '2026-08-14',
              amount: 1,
              expenseCategoryId: 10000001,
              memo: 'one envelope, bought singly',
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
              expenseId: 10200058,
              spentOn: '2026-08-15',
              amount: 98000,
              expenseCategoryId: 10000002,
              memo: 'an annual membership',
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
              expenseId: 10200059,
              spentOn: '2026-08-16',
              amount: '2175',
              expenseCategoryId: 10000003,
              memo: 'an amount presented as a string',
            },
            errorHash: {
              InvalidAmount: 'error-ctor-invalid-amount',
            },
            readAt: new Date('2026-09-15T03:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.amount: $factoryParams.input.amount', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidAmount()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#isValidAmount()', () => {
    /*
     * **This is section 11's "an amount of zero, or a negative amount is refused".** A fractional
     * amount is refused under the same rule, because the yen has no minor unit and the column is an
     * `int`.
     *
     * `'0'` is here as well as `0`, because a string-coercible input can arrive as either and a strict
     * comparison would miss one of them.
     */
    describe('when the presented amount is one no expense can carry', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200060,
              spentOn: '2026-08-17',
              amount: 0,
              expenseCategoryId: 10000001,
              memo: 'a fare that cost nothing',
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
              expenseId: 10200061,
              spentOn: '2026-08-18',
              amount: '0',
              expenseCategoryId: 10000002,
              memo: 'a fare of zero, presented as a string',
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
              expenseId: 10200062,
              spentOn: '2026-08-19',
              amount: -4500,
              expenseCategoryId: 10000003,
              memo: 'a lunch that paid the payer',
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
              expenseId: 10200063,
              spentOn: '2026-08-20',
              amount: 1200.5,
              expenseCategoryId: 10000004,
              memo: 'half a yen of stationery',
            },
            errorHash: {
              InvalidAmount: 'error-ctor-invalid-amount',
            },
            readAt: new Date('2026-09-15T04:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidAmount()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#createAmountInspector()', () => {
    describe('should be an inspector of integers', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200064,
              spentOn: '2026-08-21',
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
              expenseId: 10200065,
              spentOn: '2026-08-22',
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

      test.each(cases)('factoryParams.input.amount: $factoryParams.input.amount', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createAmountInspector()

        expect(actual)
          .toBeInstanceOf(IntegerValueInspector)
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#createAmountInspector()', () => {
    describe('should read the presented amount', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200066,
              spentOn: '2026-08-23',
              amount: 2175,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            errorHash: {
              InvalidAmount: 'error-ctor-invalid-amount',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: expect.objectContaining({
            value: 2175,
          }),
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200067,
              spentOn: '2026-08-24',
              amount: 5730,
              expenseCategoryId: 10000002,
              memo: null,
            },
            errorHash: {
              InvalidAmount: 'error-ctor-invalid-amount',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
          expected: expect.objectContaining({
            value: 5730,
          }),
        },
      ]

      test.each(cases)('factoryParams.input.amount: $factoryParams.input.amount', ({
        factoryParams,
        expected,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createAmountInspector()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#isValidExpenseCategoryId()', () => {
    /*
     * **A category that does not exist satisfies this rule.** `10009996` is a value a category id can
     * take and no row holds it, and that is the resolver's to refuse under `204.M005.003` -- a
     * validator reads the input and nothing else.
     */
    describe('when the named category is a value a category id can take', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200068,
              spentOn: '2026-08-25',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'a seeded category',
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
              expenseId: 10200069,
              spentOn: '2026-08-26',
              amount: 880,
              expenseCategoryId: 10009996,
              memo: 'a category no row holds',
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
              expenseId: 10200070,
              spentOn: '2026-08-27',
              amount: 640,
              expenseCategoryId: '10000002',
              memo: 'a category named by a string',
            },
            errorHash: {
              InvalidExpenseCategoryId: 'error-ctor-invalid-expense-category-id',
            },
            readAt: new Date('2026-09-15T03:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.expenseCategoryId: $factoryParams.input.expenseCategoryId', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidExpenseCategoryId()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#isValidExpenseCategoryId()', () => {
    describe('when the named category is a value no category id can take', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200071,
              spentOn: '2026-08-28',
              amount: 1200,
              expenseCategoryId: 0,
              memo: 'a category numbered zero',
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
              expenseId: 10200072,
              spentOn: '2026-08-29',
              amount: 880,
              expenseCategoryId: -10000001,
              memo: 'a category numbered backwards',
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
              expenseId: 10200073,
              spentOn: '2026-08-30',
              amount: 640,
              expenseCategoryId: 10000001.5,
              memo: 'half a category',
            },
            errorHash: {
              InvalidExpenseCategoryId: 'error-ctor-invalid-expense-category-id',
            },
            readAt: new Date('2026-09-15T03:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200074,
              spentOn: '2026-08-31',
              amount: 260,
              expenseCategoryId: 'transport',
              memo: 'a category named in words',
            },
            errorHash: {
              InvalidExpenseCategoryId: 'error-ctor-invalid-expense-category-id',
            },
            readAt: new Date('2026-09-15T04:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.expenseCategoryId: $factoryParams.input.expenseCategoryId', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidExpenseCategoryId()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#createExpenseCategoryIdInspector()', () => {
    describe('should be an inspector of integers', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200075,
              spentOn: '2026-07-01',
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
              expenseId: 10200076,
              spentOn: '2026-07-02',
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

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createExpenseCategoryIdInspector()

        expect(actual)
          .toBeInstanceOf(IntegerValueInspector)
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#createExpenseCategoryIdInspector()', () => {
    describe('should read the named category', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200077,
              spentOn: '2026-07-03',
              amount: 1200,
              expenseCategoryId: 10000003,
              memo: 'train fare',
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
              expenseId: 10200078,
              spentOn: '2026-07-04',
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

      test.each(cases)('factoryParams.input.expenseCategoryId: $factoryParams.input.expenseCategoryId', ({
        factoryParams,
        expected,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createExpenseCategoryIdInspector()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#isSpentOnAtLatestToday()', () => {
    /*
     * **Today itself passes**: the boundary is "after", never "on or after".
     *
     * The second case is the one that pins the zone. `2026-09-14T22:00:00.000Z` is already
     * `2026-09-15 07:00` in Tokyo, so an entry dated `2026-09-15` is today's here and tomorrow's in
     * UTC -- and it is accepted. A validator reading the host's zone rather than the constant refuses
     * it, and no other case can tell the two apart.
     *
     * The last case is a malformed date, which satisfies this rule rather than failing it:
     * `CalendarDateInspector#isAfterToday()` answers false for a string that is no date, and
     * `#isValidSpentOnFormat()` owns that verdict and is declared first.
     */
    describe('when the money was paid today or before it', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200079,
              spentOn: '2026-09-15',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'this evening train fare',
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
              expenseId: 10200080,
              spentOn: '2026-09-15',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: 'a fare paid at seven in the morning in Tokyo',
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
              expenseId: 10200081,
              spentOn: '2026-01-31',
              amount: 640,
              expenseCategoryId: 10000003,
              memo: 'a fare of months ago',
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
              expenseId: 10200082,
              spentOn: '2026-9-15',
              amount: 260,
              expenseCategoryId: 10000004,
              memo: 'a malformed date, refused by the rule above',
            },
            errorHash: {
              FutureSpentOn: 'error-ctor-future-spent-on',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.memo: $factoryParams.input.memo', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isSpentOnAtLatestToday()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#isSpentOnAtLatestToday()', () => {
    /*
     * **This is section 11's "an expense dated after today is refused".**
     *
     * Each case dates its correction one day past the day its own instant falls on in Tokyo, so the
     * boundary is pinned to the day rather than to a year far enough away to be safe:
     *
     *   - `2026-09-15T01:00:00.000Z` is `2026-09-15` in Tokyo, and `2026-09-16` is refused.
     *   - `2026-09-15T14:59:59.000Z` is `2026-09-15 23:59:59` in Tokyo -- the last second of today --
     *     and `2026-09-16` is still refused.
     *   - `2026-09-15T15:30:00.000Z` is `2026-09-16 00:30` in Tokyo, and it is now `2026-09-17` that is
     *     refused.
     *
     * The title interpolates the instant, because two of the three cases present the same date and it
     * is the clock that moved.
     */
    describe('when the money was paid after today', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200083,
              spentOn: '2026-09-16',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'a fare not yet paid',
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
              expenseId: 10200084,
              spentOn: '2026-09-16',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: 'a lunch not yet eaten',
            },
            errorHash: {
              FutureSpentOn: 'error-ctor-future-spent-on',
            },
            readAt: new Date('2026-09-15T14:59:59.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200085,
              spentOn: '2026-09-17',
              amount: 640,
              expenseCategoryId: 10000003,
              memo: 'supplies not yet ordered',
            },
            errorHash: {
              FutureSpentOn: 'error-ctor-future-spent-on',
            },
            readAt: new Date('2026-09-15T15:30:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.readAt: $factoryParams.readAt', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isSpentOnAtLatestToday()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#createCalendarDateInspector()', () => {
    describe('should be a calendar date inspector', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200086,
              spentOn: '2026-07-05',
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
              expenseId: 10200087,
              spentOn: '2026-07-06',
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

      test.each(cases)('factoryParams.input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createCalendarDateInspector()

        expect(actual)
          .toBeInstanceOf(CalendarDateInspector)
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#createCalendarDateInspector()', () => {
    /*
     * The inspector carries this request's instant rather than one of its own, and the zone the
     * product reads calendar dates in -- which is what makes "today" the same day for every rule of
     * this request, and a test able to state it.
     */
    describe('should hold the presented date, this request instant and the product timezone', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200088,
              spentOn: '2026-07-07',
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
            calendarDate: '2026-07-07',
            readAt: new Date('2026-09-15T01:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          }),
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200089,
              spentOn: '2026-07-08',
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
            calendarDate: '2026-07-08',
            readAt: new Date('2026-09-15T02:00:00.000Z'),
            timezone: 'Asia/Tokyo',
          }),
        },
      ]

      test.each(cases)('factoryParams.input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
        expected,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createCalendarDateInspector()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#isValidMemoCharacterCount()', () => {
    /*
     * **The memo being optional is checked here as two cases that pass, not as a rule that fires.** A
     * null memo and an absent one are both nothing to measure, so this rule is satisfied -- and it is
     * the only rule that reads `memo` at all, which is what makes a correction carrying none valid.
     *
     * **A correction carrying none is also a correction that CLEARS the memo**, because the operation
     * is a full replace. That is the resolver's doing, not this rule's: what happens here is only that
     * nothing refuses it.
     *
     * The 191-character case is the boundary the column declares, and it is written in a multi-byte
     * character on purpose: `varchar(191)` bounds characters, not bytes, so a memo of 191 Japanese
     * characters fits and must not be refused.
     */
    describe('when the presented memo fits the column that has to hold it', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200090,
              spentOn: '2026-07-09',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'a memo of ordinary length',
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
              expenseId: 10200091,
              spentOn: '2026-07-10',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: null,
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
              expenseId: 10200092,
              spentOn: '2026-07-11',
              amount: 640,
              expenseCategoryId: 10000003,
              // memo: undefined -- the optional memo, not presented at all
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
              expenseId: 10200093,
              spentOn: '2026-07-12',
              amount: 260,
              expenseCategoryId: 10000004,
              memo: 'あ'.repeat(191),
            },
            errorHash: {
              TooLongMemo: 'error-ctor-too-long-memo',
            },
            readAt: new Date('2026-09-15T04:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidMemoCharacterCount()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#isValidMemoCharacterCount()', () => {
    /*
     * One character past the boundary, in both a single-byte and a multi-byte alphabet, so the count
     * is shown to be of characters rather than of bytes in the failing direction too.
     */
    describe('when the presented memo is longer than the column that has to hold it', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200094,
              spentOn: '2026-07-13',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'x'.repeat(192),
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
              expenseId: 10200095,
              spentOn: '2026-07-14',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: 'あ'.repeat(192),
            },
            errorHash: {
              TooLongMemo: 'error-ctor-too-long-memo',
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
      }) => {
        const validator = CorrectExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidMemoCharacterCount()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('CorrectExpenseInputValidator', () => {
  describe('#validateInput()', () => {
    /*
     * The whole validator against an input no correction can be made of, with the real error classes
     * the resolver declares rather than markers -- this is where the rule order shows, and where
     * section 11's criteria are answered as the codes a caller actually receives.
     *
     * **There is one case per rule, and each breaks only the rule it names**, so a reordering of
     * `#generateValidationEntries()` moves at least one of these answers.
     *
     * The `MalformedSpentOn` case breaks the format rule and the future rule at once and is refused by
     * the format rule, because only the first failing rule surfaces -- which is the ordering
     * `CalendarDateInspector#isAfterToday()` makes necessary rather than merely tidy.
     */
    describe('should refuse an input no correction can be made of', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              // expenseId: undefined -- no entry named at all
              spentOn: '2026-07-15',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'a correction naming no entry',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M005.001',
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200001,
              spentOn: null,
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'a correction with no date at all',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M005.002',
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200002,
              spentOn: '2026-07-16',
              amount: null,
              expenseCategoryId: 10000001,
              memo: 'a correction with no amount',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M005.003',
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200003,
              spentOn: '2026-07-17',
              amount: 1200,
              expenseCategoryId: null,
              memo: 'a correction naming no category',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M005.004',
        },
        {
          factoryParams: {
            input: {
              expenseId: 0,
              spentOn: '2026-07-18',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'an entry numbered zero',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M005.005',
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200004,
              spentOn: '2099-13-45',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'no calendar date, and a future one had it been read as a date',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M005.006',
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200005,
              spentOn: '2026-07-20',
              amount: -4500,
              expenseCategoryId: 10000001,
              memo: 'a negative amount',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M005.007',
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200006,
              spentOn: '2026-07-21',
              amount: 1200,
              expenseCategoryId: 0,
              memo: 'a category numbered zero',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M005.008',
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200007,
              spentOn: '2026-09-16',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'a correction dated after today',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M005.009',
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200008,
              spentOn: '2026-07-22',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'w'.repeat(192),
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M005.010',
        },
      ]

      test.each(cases)('factoryParams.input.spentOn: $factoryParams.input.spentOn', ({
        factoryParams,
        expected,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()
        const validator = CorrectExpenseInputValidator.create({
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

describe('CorrectExpenseInputValidator', () => {
  describe('#validateInput()', () => {
    /*
     * **The memo-less correction is here on purpose**: a correction carrying no memo is accepted, and
     * this is where "accepted" begins -- no rule of this validator refuses it, whether it arrives as
     * null or not at all. What the operation then does with it -- clearing the memo the entry held,
     * because a correction is a full replace -- is the resolver's doing, not a rule's.
     */
    describe('when the presented input satisfies every rule', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200009,
              spentOn: '2026-07-23',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare to the client office',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200010,
              spentOn: '2026-09-15',
              amount: 1,
              expenseCategoryId: 10000002,
              memo: null,
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200011,
              spentOn: '2026-06-01',
              amount: 98000,
              expenseCategoryId: 10000003,
              // memo: undefined -- the optional memo, not presented at all
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()
        const validator = CorrectExpenseInputValidator.create({
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
