import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

import RemoveExpenseMutationResolver from '../../../../../../../../server/graphql/resolvers/staff/actual/mutations/RemoveExpenseMutationResolver.js'

import RemoveExpenseInputValidator from '../../../../../../../../app/tools/validator/resolvers/staff/mutations/RemoveExpenseInputValidator.js'

import Expense from '../../../../../../../../sequelize/models/Expense.js'

/*
 * The methods of this resolver that do **not** write, which is everything but `#resolve()`,
 * `#removeExpense()` and `#destroyExpense()` — those three are in
 * `tests/_orders/Expense/RemoveExpenseMutationResolver.js`, because placement here is per method
 * and not per class.
 *
 * `#findExpense()` reads and writes nothing, so it belongs here. It is exercised against the
 * seeded rows rather than against fabricated ones: the fourteen entries of
 * `sequelize/seeders/development/20260914120004-000004-expenses.cjs`. **This phase runs before
 * `tests/_orders/`**, so every row the seeder wrote is still there when these describes read it —
 * which is why they may name `10200005` and `10200007`, rows the `_orders` suite removes later.
 *
 * **`#findExpense()` is where the security property is most directly visible**, and it is asserted
 * here rather than only through the operation: the method narrows by owner and identifier
 * together, so another member of staff's entry and an entry nobody holds are the same `null`. The
 * third situation this operation folds into that — an entry the caller removed a moment ago — is
 * the same absence again, and is asserted where a removal can actually happen, in `_orders`.
 *
 * **No row of `expenses` is written anywhere in this file, and none is removed.** `Expense.build()`
 * makes an unsaved instance to hand a formatter; it issues no statement, spends no auto-incremented
 * id and leaves nothing behind.
 */

describe('RemoveExpenseMutationResolver', () => {
  describe('super class', () => {
    test('to be instance of BaseMutationResolver', () => {
      const actual = RemoveExpenseMutationResolver.prototype

      expect(actual)
        .toBeInstanceOf(BaseMutationResolver)
    })
  })
})

describe('RemoveExpenseMutationResolver', () => {
  describe('.get:schema', () => {
    test('to be fixed value', () => {
      const expected = 'removeExpense'

      const actual = RemoveExpenseMutationResolver.schema

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('RemoveExpenseMutationResolver', () => {
  describe('.get:errorCodeHash', () => {
    /*
     * `M006` is this operation's stable id, fixed in `server/graphql/resolver-id-hash-staff.js`.
     * The literals are pinned here because a renumbered code is a silently changed contract: the
     * frontend reads the code, not the message. The two `203` names are the ones
     * `RemoveExpenseInputValidator` reads off `this.errorHash`, so a rename here would refuse
     * nothing and throw on an undefined constructor instead.
     *
     * **The whole hash is compared with one `toEqual`, and for this operation that assertion is
     * the acceptance criterion itself.** `ExpenseNotFound` answers all three of "somebody else
     * holds it", "nobody holds it" and "this caller removed it a moment ago". An
     * `ExpenseAlreadyRemoved` — or an `ExpenseNotOwned` — added beside it would be the existence
     * leak written down, and section 11 says the three must be indistinguishable. A `toEqual` over
     * the whole hash is what turns red the moment a fourth name appears; a
     * `toEqual(expect.objectContaining(...))` would let one in quietly.
     */
    test('to be fixed value', () => {
      const expected = {
        MissingExpenseId: '203.M006.001',
        InvalidExpenseId: '203.M006.002',
        StaffMemberNotFound: '204.M006.001',
        ExpenseNotFound: '204.M006.002',
      }

      const actual = RemoveExpenseMutationResolver.errorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('RemoveExpenseMutationResolver', () => {
  describe('.get:RemoveExpenseInputValidatorCtor', () => {
    test('to be the validator holding this operation input rules', () => {
      const expected = RemoveExpenseInputValidator

      const actual = RemoveExpenseMutationResolver.RemoveExpenseInputValidatorCtor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('RemoveExpenseMutationResolver', () => {
  describe('#get:Ctor', () => {
    describe('should answer the class itself', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M006.901',
            },
          },
          expected: RemoveExpenseMutationResolver,
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M006.902',
            },
          },
          expected: RemoveExpenseMutationResolver,
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', ({
        factoryParams,
        expected,
      }) => {
        const resolver = RemoveExpenseMutationResolver.create(factoryParams)

        const actual = resolver.Ctor

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('RemoveExpenseMutationResolver', () => {
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
              StandInError: '204.M006.903',
            },
          },
          expected: Expense,
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M006.904',
            },
          },
          expected: Expense,
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', ({
        factoryParams,
        expected,
      }) => {
        const resolver = RemoveExpenseMutationResolver.create(factoryParams)

        const actual = resolver.ExpenseModel

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('RemoveExpenseMutationResolver', () => {
  describe('#createInputValidator()', () => {
    describe('should be the validator holding this operation input rules', () => {
      const cases = [
        {
          params: {
            input: {
              expenseId: 10200001,
            },
          },
        },
        {
          params: {
            input: {
              expenseId: 10200002,
            },
          },
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', ({
        params,
      }) => {
        const resolver = RemoveExpenseMutationResolver.create()

        const actual = resolver.createInputValidator(/** @type {*} */ (params))

        expect(actual)
          .toBeInstanceOf(RemoveExpenseInputValidator)
      })
    })
  })
})

describe('RemoveExpenseMutationResolver', () => {
  describe('#createInputValidator()', () => {
    /*
     * The presented input reaches the validator, and **no instant goes with it**: a removal names
     * no date, so this operation consults no clock and the validator this one builds holds only
     * `input` and `errorHash`. `CorrectExpenseMutationResolver` hands a third argument here, and
     * the difference is the whole reason this validator declares no constructor of its own.
     */
    describe('should hand the presented input to the validator', () => {
      const cases = [
        {
          params: {
            input: {
              expenseId: 10200003,
            },
          },
          expected: expect.objectContaining({
            input: {
              expenseId: 10200003,
            },
          }),
        },
        {
          params: {
            input: {
              expenseId: 10200004,
            },
          },
          expected: expect.objectContaining({
            input: {
              expenseId: 10200004,
            },
          }),
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', ({
        params,
        expected,
      }) => {
        const resolver = RemoveExpenseMutationResolver.create()

        const actual = resolver.createInputValidator(/** @type {*} */ (params))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RemoveExpenseMutationResolver', () => {
  describe('#validateInput()', () => {
    /*
     * The validator returns the error rather than throwing it, so what comes back here is an
     * already-created error whose message is the code a caller sees.
     *
     * Two codes, because the input carries one field and it is asked about twice: `203.M006.001`
     * for a removal that names no entry at all, and `203.M006.002` for one whose named entry is a
     * value no identifier could take. **Neither says anything about any row** — an id that is
     * merely implausible is refused here, and an id that is perfectly plausible but names nothing
     * the caller holds is refused by the resolver, under one `204` code shared with two other
     * situations.
     */
    describe('should refuse an input no removal can be made of', () => {
      const cases = [
        {
          params: {
            input: {
              expenseId: null,
            },
          },
          expected: '203.M006.001',
        },
        {
          params: {
            input: {
              // expenseId: undefined -- no entry named at all
            },
          },
          expected: '203.M006.001',
        },
        {
          params: {
            input: {
              expenseId: 0,
            },
          },
          expected: '203.M006.002',
        },
        {
          params: {
            input: {
              expenseId: -5,
            },
          },
          expected: '203.M006.002',
        },
        {
          params: {
            input: {
              expenseId: 12.5,
            },
          },
          expected: '203.M006.002',
        },
        {
          params: {
            input: {
              expenseId: 'seven',
            },
          },
          expected: '203.M006.002',
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', ({
        params,
        expected,
      }) => {
        const resolver = RemoveExpenseMutationResolver.create()

        const actual = resolver.validateInput(/** @type {*} */ (params))

        expect(actual)
          .toHaveProperty('message', expected)
      })
    })
  })
})

describe('RemoveExpenseMutationResolver', () => {
  describe('#validateInput()', () => {
    /*
     * **A plausible identifier satisfies every rule, whether or not anything of that id exists.**
     * The third case names an id no row of the table holds and is accepted here just as the first
     * two are: a value is not a row, and the refusal it earns comes one layer up.
     */
    describe('when the presented input satisfies every rule', () => {
      const cases = [
        {
          params: {
            input: {
              expenseId: 10200005,
            },
          },
        },
        {
          params: {
            input: {
              expenseId: 1, // the smallest identifier a row could carry
            },
          },
        },
        {
          params: {
            input: {
              expenseId: 10200091, // no row of the table holds it, and this rule does not care
            },
          },
        },
      ]

      test.each(cases)('input.expenseId: $params.input.expenseId', ({
        params,
      }) => {
        const resolver = RemoveExpenseMutationResolver.create()

        const actual = resolver.validateInput(/** @type {*} */ (params))

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('RemoveExpenseMutationResolver', () => {
  describe('#findExpense()', () => {
    /*
     * Read against the seeded entries. The transaction is null because this method is being
     * exercised on its own, outside the one `#removeExpense()` opens around it.
     *
     * Both members of staff the seeder gave entries to are read, each for one of their own rows,
     * so "the caller's own entry comes back" is not a property of one owner.
     */
    describe('should answer the caller own entry of that id', () => {
      const cases = [
        {
          params: {
            expenseId: 10200007,
            staffMemberId: 10110001,
            transaction: null,
          },
          expected: expect.objectContaining({
            id: 10200007,
            StaffMemberId: 10110001,
            ExpenseCategoryId: 10000003,
            spentOn: '2026-06-30',
            amount: 1,
            memo: 'one envelope, bought singly',
            status: 'recorded',
          }),
        },
        {
          params: {
            expenseId: 10200013,
            staffMemberId: 10110002,
            transaction: null,
          },
          expected: expect.objectContaining({
            id: 10200013,
            StaffMemberId: 10110002,
            ExpenseCategoryId: 10000001,
            spentOn: '2026-09-05',
            amount: 33500,
            memo: null,
            status: 'recorded',
          }),
        },
      ]

      test.each(cases)('expenseId: $params.expenseId', async ({
        params,
        expected,
      }) => {
        const resolver = RemoveExpenseMutationResolver.create()

        const actual = await resolver.findExpense(/** @type {*} */ (params))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('RemoveExpenseMutationResolver', () => {
  describe('#findExpense()', () => {
    /*
     * **The security property, at the one line that carries it.**
     *
     * The four cases are two of each kind and all of them answer `null`:
     *
     *   - `10200012` and `10200014` are rows that genuinely exist and belong to `10110002`, asked
     *     for by `10110001`;
     *   - `10200091` and `10200092` are ids no row of the table holds, asked for by the same
     *     caller.
     *
     * Because the `where` carries the owner beside the identifier, the query never selects the
     * first pair at all — so this method has nothing with which to tell the two kinds apart, and
     * the resolver above it has one refusal to give rather than a choice of two. A version that
     * read by id and compared the owner afterwards would answer `null` here too and would have the
     * choice; it is the shape of the query, asserted by these four cases together, that removes
     * it.
     *
     * **The third situation this operation folds in — an entry the caller removed a moment ago —
     * reaches this same `null` by the row simply not being there any more**, which is the hard
     * delete. It cannot be shown in this file, because nothing here removes anything; it is shown
     * in `tests/_orders/Expense/RemoveExpenseMutationResolver.js`, where all three are asserted to
     * carry one identical code.
     */
    describe('when the caller holds no entry of that id', () => {
      const cases = [
        {
          params: {
            expenseId: 10200012, // exists, and belongs to 10110002
            staffMemberId: 10110001,
            transaction: null,
          },
        },
        {
          params: {
            expenseId: 10200014, // exists, and belongs to 10110002
            staffMemberId: 10110001,
            transaction: null,
          },
        },
        {
          params: {
            expenseId: 10200091, // no row of the table holds it
            staffMemberId: 10110001,
            transaction: null,
          },
        },
        {
          params: {
            expenseId: 10200092, // nor this one
            staffMemberId: 10110001,
            transaction: null,
          },
        },
      ]

      test.each(cases)('expenseId: $params.expenseId', async ({
        params,
      }) => {
        const resolver = RemoveExpenseMutationResolver.create()

        const actual = await resolver.findExpense(/** @type {*} */ (params))

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('RemoveExpenseMutationResolver', () => {
  describe('#formatResponse()', () => {
    /*
     * The identifier of the entry removed and nothing else — spec section 11.1's shape for every
     * mutation of this feature, and CQRS as the architecture rule states it. The row is gone by the
     * time this runs in the operation, and the identifier is what the screen reconciles its list
     * against.
     *
     * **The id is read off the row rather than echoed from the input**, which is why the entity
     * handed in is what carries it: the stub this resolver replaces echoed the input, which reads
     * the same on the happy path and says nothing on any other. The entity is built, never saved —
     * `Expense.build()` issues no statement and spends no auto-incremented id.
     */
    describe('should answer the identifier of the entry removed', () => {
      const cases = [
        {
          params: {
            expenseAttributes: {
              id: 10200001,
              StaffMemberId: 10110001,
              ExpenseCategoryId: 10000001,
              spentOn: '2026-07-03',
              amount: 1200,
              memo: 'train fare to the client in Shinagawa',
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
              ExpenseCategoryId: 10000003,
              spentOn: '2026-08-27',
              amount: 4390,
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
        const resolver = RemoveExpenseMutationResolver.create()

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
