import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

import CorrectExpenseMutationResolver from '../../../../../../../../server/graphql/resolvers/staff/actual/mutations/CorrectExpenseMutationResolver.js'

import CorrectExpenseInputValidator from '../../../../../../../../app/tools/validator/resolvers/staff/mutations/CorrectExpenseInputValidator.js'

import Expense from '../../../../../../../../sequelize/models/Expense.js'
import ExpenseCategory from '../../../../../../../../sequelize/models/ExpenseCategory.js'

/*
 * The methods of this resolver that do **not** write, which is everything but `#resolve()`,
 * `#saveExpense()` and `#updateExpense()` — those three are in
 * `tests/_orders/Expense/CorrectExpenseMutationResolver.js`, because placement here is per method
 * and not per class.
 *
 * `#findExpense()` and `#findExpenseCategory()` both read and write nothing, so both belong here.
 * They are exercised against the seeded rows rather than against fabricated ones: the fourteen
 * entries of `sequelize/seeders/development/20260914120004-000004-expenses.cjs` and the four
 * categories of the master seeder.
 *
 * **`#findExpense()` is where the security property is most directly visible**, and it is asserted
 * here rather than only through the operation: the method narrows by owner and identifier together,
 * so another member of staff's entry and an entry nobody holds are the same `null`. The describes
 * below assert that both answer `null`, which is what leaves the resolver one refusal to give.
 *
 * **No row of `expenses` is written anywhere in this file, and none is created.** `Expense.build()`
 * makes an unsaved instance to hand a formatter; it issues no statement, spends no auto-incremented
 * id and leaves nothing behind.
 */

describe('CorrectExpenseMutationResolver', () => {
  describe('super class', () => {
    test('to be instance of BaseMutationResolver', () => {
      const actual = CorrectExpenseMutationResolver.prototype

      expect(actual)
        .toBeInstanceOf(BaseMutationResolver)
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
  describe('.get:schema', () => {
    test('to be fixed value', () => {
      const expected = 'correctExpense'

      const actual = CorrectExpenseMutationResolver.schema

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
  describe('.get:errorCodeHash', () => {
    /*
     * `M005` is this operation's stable id, fixed in `server/graphql/resolver-id-hash-staff.js`.
     * The literals are pinned here because a renumbered code is a silently changed contract: the
     * frontend reads the code, not the message. The ten `203` names are the ones
     * `CorrectExpenseInputValidator` reads off `this.errorHash`, so a rename here would refuse
     * nothing and throw on an undefined constructor instead.
     *
     * **The whole hash is compared with one `toEqual`, which is what pins the absence of a second
     * not-found code.** `ExpenseNotFound` answers both "somebody else holds it" and "nobody holds
     * it"; an `ExpenseNotOwned` added beside it would be the existence leak written down, and this
     * assertion is what fails the moment one appears.
     */
    test('to be fixed value', () => {
      const expected = {
        MissingExpenseId: '203.M005.001',
        MissingSpentOn: '203.M005.002',
        MissingAmount: '203.M005.003',
        MissingExpenseCategoryId: '203.M005.004',
        InvalidExpenseId: '203.M005.005',
        MalformedSpentOn: '203.M005.006',
        InvalidAmount: '203.M005.007',
        InvalidExpenseCategoryId: '203.M005.008',
        FutureSpentOn: '203.M005.009',
        TooLongMemo: '203.M005.010',
        StaffMemberNotFound: '204.M005.001',
        ExpenseNotFound: '204.M005.002',
        ExpenseCategoryNotFound: '204.M005.003',
      }

      const actual = CorrectExpenseMutationResolver.errorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
  describe('.get:CorrectExpenseInputValidatorCtor', () => {
    test('to be the validator holding this operation input rules', () => {
      const expected = CorrectExpenseInputValidator

      const actual = CorrectExpenseMutationResolver.CorrectExpenseInputValidatorCtor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
  describe('#get:Ctor', () => {
    describe('should answer the class itself', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M005.901',
            },
          },
          expected: CorrectExpenseMutationResolver,
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M005.902',
            },
          },
          expected: CorrectExpenseMutationResolver,
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', ({
        factoryParams,
        expected,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create(factoryParams)

        const actual = resolver.Ctor

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
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
              StandInError: '204.M005.903',
            },
          },
          expected: Expense,
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M005.904',
            },
          },
          expected: Expense,
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', ({
        factoryParams,
        expected,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create(factoryParams)

        const actual = resolver.ExpenseModel

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
  describe('#get:ExpenseCategoryModel', () => {
    describe('should answer the ExpenseCategory model', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M005.905',
            },
          },
          expected: ExpenseCategory,
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M005.906',
            },
          },
          expected: ExpenseCategory,
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', ({
        factoryParams,
        expected,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create(factoryParams)

        const actual = resolver.ExpenseCategoryModel

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
  describe('#createInputValidator()', () => {
    describe('should be the validator holding this operation input rules', () => {
      const cases = [
        {
          params: {
            input: {
              expenseId: 10200001,
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
              expenseId: 10200002,
              spentOn: '2026-09-13',
              amount: 880,
              expenseCategoryId: 10000002,
              memo: null,
            },
            readAt: new Date('2026-09-15T02:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', ({
        params,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()

        const actual = resolver.createInputValidator(/** @type {*} */ (params))

        expect(actual)
          .toBeInstanceOf(CorrectExpenseInputValidator)
      })
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
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
              expenseId: 10200003,
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
              expenseId: 10200004,
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

      test.each(cases)('input.expenseId: $params.input.expenseId', ({
        params,
        expected,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()

        const actual = resolver.createInputValidator(/** @type {*} */ (params))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
  describe('#validateInput()', () => {
    /*
     * The validator returns the error rather than throwing it, so what comes back here is an
     * already-created error whose message is the code a caller sees. Section 11's acceptance
     * criteria are these codes: `203.M005.003` for no amount, `203.M005.007` for zero and for a
     * negative one, `203.M005.009` for a date after today, and `203.M005.001` for a correction that
     * names no entry at all.
     */
    describe('should refuse an input no correction can be made of', () => {
      const cases = [
        {
          params: {
            input: {
              // expenseId: undefined -- no entry named at all
              spentOn: '2026-09-14',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M005.001',
        },
        {
          params: {
            input: {
              expenseId: 10200001,
              spentOn: '2026-09-13',
              amount: null,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M005.003',
        },
        {
          params: {
            input: {
              expenseId: 10200002,
              spentOn: '2026-09-12',
              amount: 0,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M005.007',
        },
        {
          params: {
            input: {
              expenseId: 10200003,
              spentOn: '2026-09-11',
              amount: -4500,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M005.007',
        },
        {
          params: {
            input: {
              expenseId: 10200004,
              spentOn: '2026-09-16',
              amount: 1200,
              expenseCategoryId: 10000001,
              memo: 'train fare',
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
          expected: '203.M005.009',
        },
      ]

      test.each(cases)('input.spentOn: $params.input.spentOn', ({
        params,
        expected,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()

        const actual = resolver.validateInput(/** @type {*} */ (params))

        expect(actual)
          .toHaveProperty('message', expected)
      })
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
  describe('#validateInput()', () => {
    describe('when the presented input satisfies every rule', () => {
      const cases = [
        {
          params: {
            input: {
              expenseId: 10200001,
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
              expenseId: 10200002,
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
              expenseId: 10200003,
              spentOn: '2026-06-01',
              amount: 98000,
              expenseCategoryId: 10000003,
              // memo: undefined -- the optional memo, not sent at all
            },
            readAt: new Date('2026-09-15T01:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', ({
        params,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()

        const actual = resolver.validateInput(/** @type {*} */ (params))

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
  describe('#findExpense()', () => {
    /*
     * Read against the seeded entries. The transaction is null because this method is being
     * exercised on its own, outside the one `#saveExpense()` opens around it.
     *
     * Both members of staff the seeder gave entries to are read, each for one of their own rows, so
     * "the caller's own entry comes back" is not a property of one owner.
     */
    describe('should answer the caller own entry of that id', () => {
      const cases = [
        {
          params: {
            expenseId: 10200008,
            staffMemberId: 10110001,
            transaction: null,
          },
          expected: expect.objectContaining({
            id: 10200008,
            StaffMemberId: 10110001,
            ExpenseCategoryId: 10000004,
            spentOn: '2026-09-09',
            amount: 98000,
            memo: 'annual membership of the standards body',
            status: 'recorded',
          }),
        },
        {
          params: {
            expenseId: 10200012,
            staffMemberId: 10110002,
            transaction: null,
          },
          expected: expect.objectContaining({
            id: 10200012,
            StaffMemberId: 10110002,
            ExpenseCategoryId: 10000004,
            spentOn: '2026-07-09',
            amount: 715,
            memo: 'postage on the signed contract',
            status: 'recorded',
          }),
        },
      ]

      test.each(cases)('expenseId: $params.expenseId', async ({
        params,
        expected,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()

        const actual = await resolver.findExpense(/** @type {*} */ (params))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
  describe('#findExpense()', () => {
    /*
     * **The security property, at the one line that carries it.**
     *
     * The four cases are two of each kind and all of them answer `null`:
     *
     *   - `10200011` and `10200013` are rows that genuinely exist and belong to `10110002`, asked
     *     for by `10110001`;
     *   - `10200098` and `10200099` are ids no row of the table holds, asked for by the same caller.
     *
     * Because the `where` carries the owner beside the identifier, the query never selects the first
     * pair at all — so this method has nothing with which to tell the two kinds apart, and the
     * resolver above it has one refusal to give rather than a choice of two. A version that read by
     * id and compared the owner afterwards would answer `null` here too and would have the choice;
     * it is the shape of the query, asserted by these four cases together, that removes it.
     */
    describe('when the caller holds no entry of that id', () => {
      const cases = [
        {
          params: {
            expenseId: 10200011, // exists, and belongs to 10110002
            staffMemberId: 10110001,
            transaction: null,
          },
        },
        {
          params: {
            expenseId: 10200013, // exists, and belongs to 10110002
            staffMemberId: 10110001,
            transaction: null,
          },
        },
        {
          params: {
            expenseId: 10200098, // no row of the table holds it
            staffMemberId: 10110001,
            transaction: null,
          },
        },
        {
          params: {
            expenseId: 10200099, // nor this one
            staffMemberId: 10110001,
            transaction: null,
          },
        },
      ]

      test.each(cases)('expenseId: $params.expenseId', async ({
        params,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()

        const actual = await resolver.findExpense(/** @type {*} */ (params))

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
  describe('#findExpenseCategory()', () => {
    /*
     * Read against the seeded master, whose four rows are the only categories this version has.
     */
    describe('should answer the category named', () => {
      const cases = [
        {
          params: {
            expenseCategoryId: 10000002,
            transaction: null,
          },
          expected: expect.objectContaining({
            id: 10000002,
            name: 'meals',
            displayOrder: 2,
          }),
        },
        {
          params: {
            expenseCategoryId: 10000003,
            transaction: null,
          },
          expected: expect.objectContaining({
            id: 10000003,
            name: 'supplies',
            displayOrder: 3,
          }),
        },
      ]

      test.each(cases)('expenseCategoryId: $params.expenseCategoryId', async ({
        params,
        expected,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()

        const actual = await resolver.findExpenseCategory(/** @type {*} */ (params))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
  describe('#findExpenseCategory()', () => {
    describe('when no category of that id exists', () => {
      const cases = [
        {
          params: {
            expenseCategoryId: 10009996,
            transaction: null,
          },
        },
        {
          params: {
            expenseCategoryId: 10009997,
            transaction: null,
          },
        },
      ]

      test.each(cases)('expenseCategoryId: $params.expenseCategoryId', async ({
        params,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()

        const actual = await resolver.findExpenseCategory(/** @type {*} */ (params))

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('CorrectExpenseMutationResolver', () => {
  describe('#formatResponse()', () => {
    /*
     * The identifier of the entry corrected and nothing else — spec section 11.1's shape for every
     * mutation of this feature, and CQRS as the architecture rule states it.
     *
     * **The id is read off the row rather than echoed from the input**, which is why the entity
     * handed in is what carries it: a formatter reading the input could answer with an id this
     * operation never touched. The entity is built, never saved — `Expense.build()` issues no
     * statement and spends no auto-incremented id.
     */
    describe('should answer the identifier of the entry corrected', () => {
      const cases = [
        {
          params: {
            expenseAttributes: {
              id: 10200001,
              StaffMemberId: 10110001,
              ExpenseCategoryId: 10000001,
              spentOn: '2026-09-14',
              amount: 1200,
              memo: 'train fare to the client',
              status: 'recorded',
            },
          },
          expected: {
            expenseId: 10200001,
          },
        },
        {
          params: {
            expenseAttributes: {
              id: 10200011,
              StaffMemberId: 10110002,
              ExpenseCategoryId: 10000002,
              spentOn: '2026-09-13',
              amount: 880,
              memo: null,
              status: 'recorded',
            },
          },
          expected: {
            expenseId: 10200011,
          },
        },
      ]

      test.each(cases)('expenseAttributes.id: $params.expenseAttributes.id', ({
        params,
        expected,
      }) => {
        const resolver = CorrectExpenseMutationResolver.create()

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
