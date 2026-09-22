import {
  IntegerValueInspector,
  ValueInspector,
} from '@openreachtech/mentsu-value-inspector'

import RemoveExpenseInputValidator from '../../../../../../../../app/tools/validator/resolvers/staff/mutations/RemoveExpenseInputValidator.js'

import BaseInputValidator from '../../../../../../../../app/tools/validator/BaseInputValidator.js'

/*
 * Nothing here reads a row, and nothing here writes one: a rule of this validator is a function of
 * the one field the input carries.
 *
 * **`expenseId` is read here only as a value, never as a row.** Whether an entry of that id
 * exists, whether it belongs to the caller, and whether it was removed a moment ago are three rows
 * -- or three absences of one -- and all three are the resolver's to answer, under a single code
 * that cannot tell them apart. That is spec section 11's criterion, and it is met one layer up:
 * what this class decides is only whether the value presented is one an identifier could take.
 *
 * **No instant appears anywhere below**, which is the visible difference from
 * `CorrectExpenseInputValidator` and `RecordExpenseInputValidator`. A removal presents no date, so
 * there is no clock to read and no `readAt` property to keep -- which is why this class declares
 * neither a constructor nor a factory method of its own, and why `.create()` below is the base's.
 */

describe('RemoveExpenseInputValidator', () => {
  describe('super class', () => {
    test('to be instance of BaseInputValidator', () => {
      const actual = RemoveExpenseInputValidator.prototype

      expect(actual)
        .toBeInstanceOf(BaseInputValidator)
    })
  })
})

describe('RemoveExpenseInputValidator', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#input', () => {
        const cases = [
          {
            params: {
              input: {
                expenseId: 10200001,
              },
              errorHash: {
                MissingExpenseId: 'error-ctor-missing-expense-id',
              },
            },
          },
          {
            params: {
              input: {
                expenseId: 10200002,
              },
              errorHash: {
                MissingExpenseId: 'error-ctor-missing-expense-id',
              },
            },
          },
        ]

        test.each(cases)('params.input.expenseId: $params.input.expenseId', ({
          params,
        }) => {
          const validator = RemoveExpenseInputValidator.create(/** @type {*} */ (params))

          expect(validator)
            .toHaveProperty('input', params.input)
        })
      })
    })
  })
})

describe('RemoveExpenseInputValidator', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#errorHash', () => {
        const cases = [
          {
            params: {
              input: {
                expenseId: 10200003,
              },
              errorHash: {
                MissingExpenseId: 'error-ctor-missing-expense-id',
              },
            },
          },
          {
            params: {
              input: {
                expenseId: 10200004,
              },
              errorHash: {
                InvalidExpenseId: 'error-ctor-invalid-expense-id',
              },
            },
          },
        ]

        test.each(cases)('params.input.expenseId: $params.input.expenseId', ({
          params,
        }) => {
          const validator = RemoveExpenseInputValidator.create(/** @type {*} */ (params))

          expect(validator)
            .toHaveProperty('errorHash', params.errorHash)
        })
      })
    })
  })
})

describe('RemoveExpenseInputValidator', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200005,
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
            },
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200006,
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
            },
          },
        },
      ]

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
      }) => {
        const actual = RemoveExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        expect(actual)
          .toBeInstanceOf(RemoveExpenseInputValidator)
      })
    })
  })
})

describe('RemoveExpenseInputValidator', () => {
  describe('.create()', () => {
    /*
     * The factory method is the base's, inherited rather than declared -- this validator holds the
     * two properties the base builds an instance from and no third one -- so what is worth pinning
     * is that both of them reach the constructor unchanged.
     */
    describe('should be call by constructor', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200007,
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
            },
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200008,
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
          },
        },
      ]

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(RemoveExpenseInputValidator)

        SpyClass.create(/** @type {*} */ (factoryParams))

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(factoryParams)
      })
    })
  })
})

describe('RemoveExpenseInputValidator', () => {
  describe('#generateValidationEntries()', () => {
    /*
     * Two rules, in the order they are answered in, because only the first failing rule surfaces:
     * the presence rule comes first so an entry left out is never reported as an entry of the wrong
     * shape.
     *
     * **Two and not ten**, which is the whole difference from `CorrectExpenseInputValidator`: a
     * removal carries one field, so eight of that validator's rules have nothing here to be about.
     *
     * Each error class stands in as a marker string -- this method only pairs a rule with its
     * error, and a marker makes the pairing readable.
     */
    describe('should declare the two rules in order', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200009,
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
          },
          expected: [
            [expect.any(Function), 'error-ctor-missing-expense-id'],
            [expect.any(Function), 'error-ctor-invalid-expense-id'],
          ],
        },
        {
          factoryParams: {
            input: {
              expenseId: -10200010,
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
          },
          expected: [
            [expect.any(Function), 'error-ctor-missing-expense-id'],
            [expect.any(Function), 'error-ctor-invalid-expense-id'],
          ],
        },
      ]

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
        expected,
      }) => {
        const validator = RemoveExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.generateValidationEntries()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RemoveExpenseInputValidator', () => {
  describe('#hasExpenseId()', () => {
    /*
     * **A value no identifier could take still satisfies this rule**, which is the third case: `0`
     * was presented, so presence is answered `true` and the shape rule below is what refuses it.
     * Merging the two would report a caller who sent nothing and a caller who sent zero with one
     * code.
     */
    describe('when an entry was named', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200011,
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
            },
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 1,
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
            },
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 0,
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
            },
          },
        },
      ]

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
      }) => {
        const validator = RemoveExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.hasExpenseId()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('RemoveExpenseInputValidator', () => {
  describe('#hasExpenseId()', () => {
    /*
     * Both spellings of "no entry": the field sent as null, and the field not sent at all. GraphQL
     * types `expenseId` as `Int!` and would refuse both before a resolver ran, so these are the
     * rule being asked directly -- which is how a caller reaching it any other way would arrive.
     *
     * The title interpolates the whole input, because neither case has a value to name.
     */
    describe('when no entry was named', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: null,
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
            },
          },
        },
        {
          factoryParams: {
            input: {
              // expenseId: undefined -- no entry named at all
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
            },
          },
        },
      ]

      test.each(cases)('factoryParams.input: $factoryParams.input', ({
        factoryParams,
      }) => {
        const validator = RemoveExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.hasExpenseId()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('RemoveExpenseInputValidator', () => {
  describe('#createExpenseIdPresenceInspector()', () => {
    describe('should read the named entry', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200012,
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
            },
          },
          expected: expect.objectContaining({
            value: 10200012,
          }),
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200013,
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
            },
          },
          expected: expect.objectContaining({
            value: 10200013,
          }),
        },
      ]

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
        expected,
      }) => {
        const validator = RemoveExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createExpenseIdPresenceInspector()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RemoveExpenseInputValidator', () => {
  describe('#createExpenseIdPresenceInspector()', () => {
    /*
     * A plain `ValueInspector` and not the integer one, because presence and shape are two rules
     * with two codes: this one answers only whether anything was named at all.
     */
    describe('should be a plain value inspector', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200014,
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
            },
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200015,
            },
            errorHash: {
              MissingExpenseId: 'error-ctor-missing-expense-id',
            },
          },
        },
      ]

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
      }) => {
        const validator = RemoveExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createExpenseIdPresenceInspector()

        expect(actual)
          .toBeInstanceOf(ValueInspector)
      })
    })
  })
})

describe('RemoveExpenseInputValidator', () => {
  describe('#isValidExpenseId()', () => {
    /*
     * A string-coercible value is accepted as well as a number, because `#isIntegerLike()` and
     * `#isPositiveNumberLike()` read the value rather than its JavaScript type -- and a caller
     * reaching this operation other than through the schema can present `'10200016'`.
     *
     * **The last case names an id no row of the table holds, and passes.** A value is not a row:
     * whether anything of that id is there is the resolver's question, and it answers it with the
     * same code it answers somebody else's entry and an entry already removed with.
     */
    describe('when the named entry is a value an entry identifier can take', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200016,
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 1,
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: '10200017',
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200093, // no row of the table holds it, and this rule does not care
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
          },
        },
      ]

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
      }) => {
        const validator = RemoveExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidExpenseId()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('RemoveExpenseInputValidator', () => {
  describe('#isValidExpenseId()', () => {
    /*
     * Zero, a negative number, a fractional one and a value that is no number at all are all
     * refused, because the column is a positive whole number and nothing else can name a row.
     *
     * **None of these is a "not found".** A value no identifier can take is refused under
     * `203.M006.002` before any row is read at all, so nothing here says whether any entry exists,
     * belonged to somebody else, or was removed a moment ago.
     */
    describe('when the named entry is a value no entry identifier can take', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 0,
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: -10200018,
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200019.5,
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 'seven',
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
          },
        },
      ]

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
      }) => {
        const validator = RemoveExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidExpenseId()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('RemoveExpenseInputValidator', () => {
  describe('#createExpenseIdInspector()', () => {
    describe('should read the named entry', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200020,
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
          },
          expected: expect.objectContaining({
            value: 10200020,
          }),
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200021,
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
          },
          expected: expect.objectContaining({
            value: 10200021,
          }),
        },
      ]

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
        expected,
      }) => {
        const validator = RemoveExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createExpenseIdInspector()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RemoveExpenseInputValidator', () => {
  describe('#createExpenseIdInspector()', () => {
    /*
     * The integer inspector and not the plain one, because this rule reads the shape of the value
     * rather than whether anything was presented at all.
     */
    describe('should be an integer value inspector', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              expenseId: 10200022,
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
          },
        },
        {
          factoryParams: {
            input: {
              expenseId: 10200023,
            },
            errorHash: {
              InvalidExpenseId: 'error-ctor-invalid-expense-id',
            },
          },
        },
      ]

      test.each(cases)('factoryParams.input.expenseId: $factoryParams.input.expenseId', ({
        factoryParams,
      }) => {
        const validator = RemoveExpenseInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createExpenseIdInspector()

        expect(actual)
          .toBeInstanceOf(IntegerValueInspector)
      })
    })
  })
})
