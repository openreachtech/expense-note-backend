import {
  IntegerValueInspector,
} from '@openreachtech/mentsu-value-inspector'

import ExpensesQueryResolver from '../../../../../../../../server/graphql/resolvers/staff/actual/queries/ExpensesQueryResolver.js'

import ExpensesInputValidator from '../../../../../../../../app/tools/validator/resolvers/staff/queries/ExpensesInputValidator.js'

import BaseInputValidator from '../../../../../../../../app/tools/validator/BaseInputValidator.js'

describe('ExpensesInputValidator', () => {
  describe('super class', () => {
    test('to be instance of BaseInputValidator', () => {
      const received = ExpensesInputValidator.prototype

      expect(received)
        .toBeInstanceOf(BaseInputValidator)
    })
  })
})

describe('ExpensesInputValidator', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 10,
                offset: 0,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 25,
                offset: 50,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
      ]

      test.each(cases)('pagination.limit: $factoryParams.input.pagination.limit', ({
        factoryParams,
      }) => {
        const actual = ExpensesInputValidator.create(factoryParams)

        expect(actual)
          .toBeInstanceOf(ExpensesInputValidator)
      })
    })
  })
})

describe('ExpensesInputValidator', () => {
  describe('#generateValidationEntries()', () => {
    /*
     * Three rules, and no fourth one for `sort`: the pinned contract says no operation of 1.0.0
     * lets a caller choose a sort, and the resolver never hands it to the query, so there is
     * nothing about it to be valid or invalid against. Each error class stands in as a marker
     * string — this method only pairs a rule with its error, and a marker makes the pairing
     * readable.
     *
     * **The order is the contract, not an accident.** `ExcessiveLimit` is asked AFTER
     * `InvalidLimit`, so a caller presenting `-3` is told the size is invalid rather than that it
     * is over the maximum — the more specific complaint is the earlier one, and a negative limit
     * is not "too large" in any sense a reader would accept. Swapping them would pass a test that
     * only checked which errors exist.
     */
    describe('should declare the three rules in order', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 10,
                offset: 0,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
          expected: [
            [expect.any(Function), 'error-ctor-invalid-limit'],
            [expect.any(Function), 'error-ctor-excessive-limit'],
            [expect.any(Function), 'error-ctor-invalid-offset'],
          ],
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 5,
                offset: 5,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
          expected: [
            [expect.any(Function), 'error-ctor-invalid-limit'],
            [expect.any(Function), 'error-ctor-excessive-limit'],
            [expect.any(Function), 'error-ctor-invalid-offset'],
          ],
        },
      ]

      test.each(cases)('pagination.limit: $factoryParams.input.pagination.limit', ({
        factoryParams,
        expected,
      }) => {
        const validator = ExpensesInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.generateValidationEntries()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('ExpensesInputValidator', () => {
  describe('#isValidLimit()', () => {
    /*
     * A page has a positive whole number of rows. The string cases are here because GraphQL input
     * reaches a resolver string-coercible in places, which is what `isIntegerLike()` is for.
     */
    describe('when the presented limit is a size a page can have', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 1,
                offset: 0,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 20,
                offset: 0,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: '30',
                offset: 0,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
      ]

      test.each(cases)('pagination.limit: $factoryParams.input.pagination.limit', ({
        factoryParams,
      }) => {
        const validator = ExpensesInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidLimit()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('ExpensesInputValidator', () => {
  describe('#isValidLimit()', () => {
    /*
     * Zero and a negative are both `Int!`, so GraphQL lets them through and this rule is what
     * refuses them. A fractional page size and a missing `pagination` fail for the same reason:
     * neither normalizes to a whole number of rows.
     */
    describe('when the presented limit is a size no page can have', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 0,
                offset: 0,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: -3,
                offset: 0,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 2.5,
                offset: 0,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: null,
                offset: 0,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
        {
          factoryParams: {
            input: {
              // pagination: undefined
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
      ]

      test.each(cases)('pagination.limit: $factoryParams.input.pagination.limit', ({
        factoryParams,
      }) => {
        const validator = ExpensesInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidLimit()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('ExpensesInputValidator', () => {
  describe('#createLimitInspector()', () => {
    describe('should read the presented limit', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 7,
                offset: 0,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
          expected: expect.objectContaining({
            value: 7,
          }),
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 13,
                offset: 0,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
          expected: expect.objectContaining({
            value: 13,
          }),
        },
      ]

      test.each(cases)('pagination.limit: $factoryParams.input.pagination.limit', ({
        factoryParams,
        expected,
      }) => {
        const validator = ExpensesInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createLimitInspector()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('ExpensesInputValidator', () => {
  describe('#createLimitInspector()', () => {
    describe('should be an inspector of integers', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 9,
                offset: 0,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 11,
                offset: 0,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
      ]

      test.each(cases)('pagination.limit: $factoryParams.input.pagination.limit', ({
        factoryParams,
      }) => {
        const validator = ExpensesInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createLimitInspector()

        expect(actual)
          .toBeInstanceOf(IntegerValueInspector)
      })
    })
  })
})

describe('ExpensesInputValidator', () => {
  describe('#isValidOffset()', () => {
    /*
     * **Zero passes, and it is the case this rule exists to get right.** It is the first page,
     * which is what a screen asks for on open, so the offset rule asks for "not negative" where
     * the limit rule asks for "positive".
     */
    describe('when the presented offset names a row the page can start at', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 10,
                offset: 0,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 10,
                offset: 1,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 10,
                offset: 900,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 10,
                offset: '40',
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
      ]

      test.each(cases)('pagination.offset: $factoryParams.input.pagination.offset', ({
        factoryParams,
      }) => {
        const validator = ExpensesInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidOffset()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('ExpensesInputValidator', () => {
  describe('#isValidOffset()', () => {
    /*
     * A negative offset left unrefused reaches `RequestPagination#resolveOffset()`, which quietly
     * answers `0` for it — so the caller would be served the first page and told they were served
     * theirs.
     */
    describe('when the presented offset names no row the page could start at', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 10,
                offset: -1,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 10,
                offset: -250,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 10,
                offset: 3.5,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 10,
                offset: null,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
      ]

      test.each(cases)('pagination.offset: $factoryParams.input.pagination.offset', ({
        factoryParams,
      }) => {
        const validator = ExpensesInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.isValidOffset()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('ExpensesInputValidator', () => {
  describe('#createOffsetInspector()', () => {
    describe('should read the presented offset', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 10,
                offset: 60,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
          expected: expect.objectContaining({
            value: 60,
          }),
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 10,
                offset: 80,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
          expected: expect.objectContaining({
            value: 80,
          }),
        },
      ]

      test.each(cases)('pagination.offset: $factoryParams.input.pagination.offset', ({
        factoryParams,
        expected,
      }) => {
        const validator = ExpensesInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createOffsetInspector()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('ExpensesInputValidator', () => {
  describe('#createOffsetInspector()', () => {
    describe('should be an inspector of integers', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 10,
                offset: 100,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 10,
                offset: 120,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
      ]

      test.each(cases)('pagination.offset: $factoryParams.input.pagination.offset', ({
        factoryParams,
      }) => {
        const validator = ExpensesInputValidator.create(/** @type {*} */ (factoryParams))

        const actual = validator.createOffsetInspector()

        expect(actual)
          .toBeInstanceOf(IntegerValueInspector)
      })
    })
  })
})

describe('ExpensesInputValidator', () => {
  describe('#validateInput()', () => {
    /*
     * The whole validator against a malformed page, with the real error classes the resolver
     * declares rather than markers — this is where the rule order shows: an input that breaks both
     * rules is refused by the limit's, because only the first failing rule surfaces.
     *
     * The error arrives created, and its message is the code, which is how a resolver's refusal
     * reaches a caller.
     */
    describe('should refuse a page nobody could be served', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 0,
                offset: 0,
              },
            },
          },
          expected: '203.Q002.001',
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 10,
                offset: -1,
              },
            },
          },
          expected: '203.Q002.002',
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: -2,
                offset: -2,
              },
            },
          },
          expected: '203.Q002.001',
        },
      ]

      test.each(cases)('pagination.limit: $factoryParams.input.pagination.limit', ({
        factoryParams,
        expected,
      }) => {
        const resolver = ExpensesQueryResolver.create()
        const validator = ExpensesInputValidator.create({
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

describe('ExpensesInputValidator', () => {
  describe('#validateInput()', () => {
    describe('when the presented page satisfies every rule', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 10,
                offset: 0,
              },
            },
          },
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 1,
                offset: 13,
              },
            },
          },
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 25,
                offset: 25,
                sort: {
                  key: 'amount',
                  direction: 'ASC',
                },
              },
            },
          },
        },
      ]

      test.each(cases)('pagination.offset: $factoryParams.input.pagination.offset', ({
        factoryParams,
      }) => {
        const resolver = ExpensesQueryResolver.create()
        const validator = ExpensesInputValidator.create({
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

describe('ExpensesInputValidator', () => {
  describe('#isWithinMaximumLimit()', () => {
    /*
     * Q50's cap. The maximum is `PAGINATION.MAXIMUM_LIMIT` in `constants/paginationConstants.cjs`,
     * chosen at 100 and not yet confirmed by the user -- so the literal below is deliberately
     * written out rather than read from the constant. A test that read the value under test would
     * assert nothing, and would go on passing if somebody changed the cap by accident.
     *
     * The boundary is the point: 100 is served and 101 is not.
     */
    describe('when the presented limit is no larger than the maximum', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 1,
                offset: 0,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 99,
                offset: 0,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 100,
                offset: 0,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
      ]

      test.each(cases)('pagination.limit: $factoryParams.input.pagination.limit', ({
        factoryParams,
      }) => {
        const validator = ExpensesInputValidator.create(factoryParams)

        const actual = validator.isWithinMaximumLimit()

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('when the presented limit is larger than the maximum', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 101,
                offset: 0,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 500,
                offset: 0,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
        {
          factoryParams: {
            input: {
              pagination: {
                limit: 100000,
                offset: 0,
              },
            },
            errorHash: {
              InvalidLimit: 'error-ctor-invalid-limit',
              ExcessiveLimit: 'error-ctor-excessive-limit',
              InvalidOffset: 'error-ctor-invalid-offset',
            },
          },
        },
      ]

      test.each(cases)('pagination.limit: $factoryParams.input.pagination.limit', ({
        factoryParams,
      }) => {
        const validator = ExpensesInputValidator.create(factoryParams)

        const actual = validator.isWithinMaximumLimit()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})
