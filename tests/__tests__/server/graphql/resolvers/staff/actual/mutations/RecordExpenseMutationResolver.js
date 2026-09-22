import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

import RecordExpenseMutationResolver from '../../../../../../../../server/graphql/resolvers/staff/actual/mutations/RecordExpenseMutationResolver.js'

import RecordExpenseInputValidator from '../../../../../../../../app/tools/validator/resolvers/staff/mutations/RecordExpenseInputValidator.js'

import Expense from '../../../../../../../../sequelize/models/Expense.js'
import ExpenseCategory from '../../../../../../../../sequelize/models/ExpenseCategory.js'

/*
 * The methods of this resolver that do **not** write, which is everything but `resolve()`,
 * `#saveExpense()` and `#createExpense()` — those three are in
 * `tests/_orders/Expense/RecordExpenseMutationResolver.js`, because placement here is per method
 * and not per class.
 *
 * `#findExpenseCategory()` reads the four rows of the expense-category master and writes nothing,
 * so it belongs here. It is exercised against the seeded master rather than against a fabricated
 * one: a category is a seeded row with an id of its own (spec section 9.2), and the ids below are
 * the master seeder's.
 *
 * **No row of `expenses` is created anywhere in this file, and none is given an explicit id.**
 * `Expense.build()` makes an unsaved instance to hand a formatter; it issues no statement, spends
 * no auto-incremented id and leaves nothing behind.
 */

describe('RecordExpenseMutationResolver', () => {
  describe('super class', () => {
    test('to be instance of BaseMutationResolver', () => {
      const actual = RecordExpenseMutationResolver.prototype

      expect(actual)
        .toBeInstanceOf(BaseMutationResolver)
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('.get:schema', () => {
    test('to be fixed value', () => {
      const expected = 'recordExpense'

      const actual = RecordExpenseMutationResolver.schema

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('.get:errorCodeHash', () => {
    /*
     * `M004` is this operation's stable id, fixed in `server/graphql/resolver-id-hash-staff.js`.
     * The literals are pinned here because a renumbered code is a silently changed contract: the
     * frontend reads the code, not the message. The eight `203` names are the ones
     * `RecordExpenseInputValidator` reads off `this.errorHash`, so a rename here would refuse
     * nothing and throw on an undefined constructor instead.
     */
    test('to be fixed value', () => {
      const expected = {
        MissingSpentOn: '203.M004.001',
        MissingAmount: '203.M004.002',
        MissingExpenseCategoryId: '203.M004.003',
        MalformedSpentOn: '203.M004.004',
        InvalidAmount: '203.M004.005',
        InvalidExpenseCategoryId: '203.M004.006',
        FutureSpentOn: '203.M004.007',
        TooLongMemo: '203.M004.008',
        StaffMemberNotFound: '204.M004.001',
        ExpenseCategoryNotFound: '204.M004.002',
      }

      const actual = RecordExpenseMutationResolver.errorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('.get:RecordExpenseInputValidatorCtor', () => {
    test('to be the validator holding this operation input rules', () => {
      const expected = RecordExpenseInputValidator

      const actual = RecordExpenseMutationResolver.RecordExpenseInputValidatorCtor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#get:Ctor', () => {
    describe('should answer the class itself', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M004.901',
            },
          },
          expected: RecordExpenseMutationResolver,
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M004.902',
            },
          },
          expected: RecordExpenseMutationResolver,
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', ({
        factoryParams,
        expected,
      }) => {
        const resolver = RecordExpenseMutationResolver.create(factoryParams)

        const actual = resolver.Ctor

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#get:ExpenseModel', () => {
    /*
     * The seam answers the same model whatever the instance holds, so what varies case to case is
     * the instance: each is created with a different stand-in error code, and so holds a different
     * `errorHash`.
     */
    describe('should answer the Expense model', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M004.903',
            },
          },
          expected: Expense,
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M004.904',
            },
          },
          expected: Expense,
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', ({
        factoryParams,
        expected,
      }) => {
        const resolver = RecordExpenseMutationResolver.create(factoryParams)

        const actual = resolver.ExpenseModel

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#get:ExpenseCategoryModel', () => {
    describe('should answer the ExpenseCategory model', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M004.905',
            },
          },
          expected: ExpenseCategory,
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M004.906',
            },
          },
          expected: ExpenseCategory,
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', ({
        factoryParams,
        expected,
      }) => {
        const resolver = RecordExpenseMutationResolver.create(factoryParams)

        const actual = resolver.ExpenseCategoryModel

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#createInputValidator()', () => {
    describe('should be the validator holding this operation input rules', () => {
      const cases = [
        {
          params: {
            input: {
              spentOn: '2026-09-14',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare to the client',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          params: {
            input: {
              spentOn: '2026-09-13',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: null,
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.spentOn: $params.input.spentOn', ({
        params,
      }) => {
        const resolver = RecordExpenseMutationResolver.create()

        const actual = resolver.createInputValidator(/** @type {*} */ (params))

        expect(actual)
          .toBeInstanceOf(RecordExpenseInputValidator)
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#createInputValidator()', () => {
    /*
     * The request's own instant reaches the validator, which is what makes "dated after today" a
     * question about when the request arrived rather than about when a rule happened to run.
     */
    describe('should hand this request instant to the validator', () => {
      const cases = [
        {
          params: {
            input: {
              spentOn: '2026-09-12',
              amount: 640,
              expenseCategoryId: 10000003,
              memo: 'taxi from the station',
            },
            readAt: new Date('2026-09-15T03:00:00.000Z'),
          },
          expected: expect.objectContaining({
            readAt: new Date('2026-09-15T03:00:00.000Z'),
          }),
        },
        {
          params: {
            input: {
              spentOn: '2026-09-11',
              amount: 715,
              expenseCategoryId: 10000004,
              memo: 'postage on the signed contract',
            },
            readAt: new Date('2026-09-15T04:00:00.000Z'),
          },
          expected: expect.objectContaining({
            readAt: new Date('2026-09-15T04:00:00.000Z'),
          }),
        },
      ]

      test.each(cases)('input.spentOn: $params.input.spentOn', ({
        params,
        expected,
      }) => {
        const resolver = RecordExpenseMutationResolver.create()

        const actual = resolver.createInputValidator(/** @type {*} */ (params))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#validateInput()', () => {
    /*
     * The validator returns the error rather than throwing it, so what comes back here is an
     * already-created error whose message is the code a caller sees. Section 11's first two
     * acceptance criteria are these codes: `203.M004.002` for no amount, `203.M004.005` for zero
     * and for a negative one, `203.M004.007` for a date after today.
     */
    describe('should refuse an input no expense can be made of', () => {
      const cases = [
        {
          params: {
            input: {
              spentOn: '2026-09-14',
              amount: null,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M004.002',
        },
        {
          params: {
            input: {
              spentOn: '2026-09-13',
              amount: 0,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M004.005',
        },
        {
          params: {
            input: {
              spentOn: '2026-09-12',
              amount: -4500,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M004.005',
        },
        {
          params: {
            input: {
              spentOn: '2026-09-16',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M004.007',
        },
      ]

      test.each(cases)('input.spentOn: $params.input.spentOn', ({
        params,
        expected,
      }) => {
        const resolver = RecordExpenseMutationResolver.create()

        const actual = resolver.validateInput(/** @type {*} */ (params))

        expect(actual)
          .toHaveProperty('message', expected)
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#validateInput()', () => {
    describe('when the presented input satisfies every rule', () => {
      const cases = [
        {
          params: {
            input: {
              spentOn: '2026-09-14',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare to the client',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
        {
          params: {
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
          params: {
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

      test.each(cases)('input.spentOn: $params.input.spentOn', ({
        params,
      }) => {
        const resolver = RecordExpenseMutationResolver.create()

        const actual = resolver.validateInput(/** @type {*} */ (params))

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#findExpenseCategory()', () => {
    /*
     * Read against the seeded master, whose four rows are the only categories this version has. The
     * transaction is null because this method is being exercised on its own, outside the one
     * `#saveExpense()` opens around it.
     */
    describe('should answer the category named', () => {
      const cases = [
        {
          params: {
            expenseCategoryId: 10000001,
            transaction: null,
          },
          expected: expect.objectContaining({
            id: 10000001,
            name: 'transport',
            displayOrder: 1,
          }),
        },
        {
          params: {
            expenseCategoryId: 10000004,
            transaction: null,
          },
          expected: expect.objectContaining({
            id: 10000004,
            name: 'other',
            displayOrder: 4,
          }),
        },
      ]

      test.each(cases)('expenseCategoryId: $params.expenseCategoryId', async ({
        params,
        expected,
      }) => {
        const resolver = RecordExpenseMutationResolver.create()

        const actual = await resolver.findExpenseCategory(/** @type {*} */ (params))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#findExpenseCategory()', () => {
    describe('when no category of that id exists', () => {
      const cases = [
        {
          params: {
            expenseCategoryId: 10009992,
            transaction: null,
          },
        },
        {
          params: {
            expenseCategoryId: 10009993,
            transaction: null,
          },
        },
      ]

      test.each(cases)('expenseCategoryId: $params.expenseCategoryId', async ({
        params,
      }) => {
        const resolver = RecordExpenseMutationResolver.create()

        const actual = await resolver.findExpenseCategory(/** @type {*} */ (params))

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('RecordExpenseMutationResolver', () => {
  describe('#formatResponse()', () => {
    /*
     * The identifier of the entry written and nothing else — spec section 11.1's shape for every
     * mutation of this feature, and CQRS as the architecture rule states it. The entity is built,
     * never saved: `Expense.build()` issues no statement and spends no auto-incremented id.
     */
    describe('should answer the identifier of the entry recorded', () => {
      const cases = [
        {
          params: {
            expenseAttributes: {
              id: 10200101,
              StaffMemberId: 10110005,
              ExpenseCategoryId: 10000001,
              spentOn: '2026-09-14',
              amount: 1200,
              memo: 'train fare to the client',
              status: 'recorded',
            },
          },
          expected: {
            expenseId: 10200101,
          },
        },
        {
          params: {
            expenseAttributes: {
              id: 10200102,
              StaffMemberId: 10110006,
              ExpenseCategoryId: 10000002,
              spentOn: '2026-09-13',
              amount: 880,
              memo: null,
              status: 'recorded',
            },
          },
          expected: {
            expenseId: 10200102,
          },
        },
      ]

      test.each(cases)('expenseAttributes.id: $params.expenseAttributes.id', ({
        params,
        expected,
      }) => {
        const resolver = RecordExpenseMutationResolver.create()

        const formatArgs = {
          expenseEntity: Expense.build(params.expenseAttributes),
        }

        const actual = resolver.formatResponse(/** @type {*} */ (formatArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
