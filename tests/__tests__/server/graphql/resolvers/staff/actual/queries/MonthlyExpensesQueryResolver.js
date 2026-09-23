import {
  BaseQueryResolver,
} from '@openreachtech/renchan'

import {
  Op,
} from 'sequelize'

import MonthlyExpensesQueryResolver from '../../../../../../../../server/graphql/resolvers/staff/actual/queries/MonthlyExpensesQueryResolver.js'

import CalendarMonthRangeBuilder from '../../../../../../../../app/tools/calendar/CalendarMonthRangeBuilder.js'
import MonthlyExpensesInputValidator from '../../../../../../../../app/tools/validator/resolvers/staff/queries/MonthlyExpensesInputValidator.js'

import Expense from '../../../../../../../../sequelize/models/Expense.js'
import ExpenseCategory from '../../../../../../../../sequelize/models/ExpenseCategory.js'

/*
 * Every row this file reads comes from
 * `sequelize/seeders/development/20260914120004-000004-expenses.cjs` and the expense-category
 * master beside it. Nothing here writes a row and nothing here spells an explicit `expenses` id
 * into the table: that seeder is the sole writer of one, and its docblock explains why a test
 * adding a second would manufacture a collision.
 *
 * -----------------------------------------------------------------------------------------------
 * The two months this file reads, and what each of them is for
 * -----------------------------------------------------------------------------------------------
 *
 * **June 2026 of staff member 10110001** holds exactly two rows -- `10200003` on the **first** day
 * of the month (3450 yen) and `10200007` on the **last** (1 yen) -- so one read carries section
 * 12's first criterion (the total is 3451, the sum of the two amounts shown) and the inclusive half
 * of its second (both boundary days are in the month).
 *
 * **June 2026 of staff member 10110002** holds exactly one row, `10200014` at 1860 yen, dated
 * `2026-06-18` -- inside the same month as the two above and belonging to somebody else. It is
 * section 12's fifth criterion: reading either member of staff's June must answer that member's
 * rows and that member's total, and nothing of the other's. Dropping the owner from the `where`
 * makes both of those reads wrong at once, in the rows and in the total.
 *
 * **July 2026 of staff member 10110001** holds three rows, and the day before it -- `2026-06-30`,
 * `10200007` -- is seeded. So a range whose lower end is one day early lets a fourth row in and
 * changes the total from 2100 to 2101. That is the exclusive half of section 12's second criterion,
 * as far as the seeded fixtures can carry it.
 *
 * **What this file cannot check, and where that is checked instead.** The seeder has no row on the
 * day *after* a month whose entries it also holds, and no member of staff with two rows on one date
 * -- deliberately, for reasons its own docblock states. Both need rows recorded in a stated order,
 * which means writing them, which puts the test in `tests/_orders/`. It is
 * `tests/_orders/Expense/MonthlyExpensesQueryResolver.js`, and it is the only place the day after a
 * month, the same-date tie, and "recorded, corrected or removed is reflected on the next read" are
 * answerable for.
 *
 * `createdAt` and `updatedAt` are asserted as `expect.any(Date)` wherever a seeded row is read. The
 * seeder stamps them at `db:refresh` time, so their values are the moment the database was last
 * refreshed -- real, but not a constant a test may pin. Their being `Date`s rather than strings is
 * what matters, because that is what the `DateTime` scalar serializes on the way out.
 */

describe('MonthlyExpensesQueryResolver', () => {
  describe('super class', () => {
    test('to be instance of BaseQueryResolver', () => {
      const actual = MonthlyExpensesQueryResolver.prototype

      expect(actual)
        .toBeInstanceOf(BaseQueryResolver)
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('.get:schema', () => {
    /*
     * The stub at `stub/queries/MonthlyExpensesQueryResolver.js` answers the same name, which is
     * what lets the two pools be swapped. It is also what
     * `tests/__tests__/server/graphql/reconcile-stub-resolvers-with-actual.js` reconciles: a name
     * that disagreed here would leave the operation served unfiltered from the stub pool.
     */
    test('to be fixed value', () => {
      const expected = 'monthlyExpenses'

      const actual = MonthlyExpensesQueryResolver.schema

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('.get:errorCodeHash', () => {
    /*
     * `Q004` is this operation's stable id, fixed in `server/graphql/resolver-id-hash-staff.js`.
     * The literals are pinned here because a renumbered code is a silently changed contract: the
     * frontend reads the code, not the message. The two `203` names are the ones
     * `MonthlyExpensesInputValidator` reads off `this.errorHash`, so a rename here would refuse
     * nothing and throw on an undefined constructor instead.
     */
    test('to be fixed value', () => {
      const expected = {
        InvalidYear: '203.Q004.001',
        InvalidMonth: '203.Q004.002',
        StaffMemberNotFound: '204.Q004.001',
      }

      const actual = MonthlyExpensesQueryResolver.errorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('.get:MonthlyExpensesInputValidatorCtor', () => {
    test('to be the validator holding this operation input rules', () => {
      const expected = MonthlyExpensesInputValidator

      const actual = MonthlyExpensesQueryResolver.MonthlyExpensesInputValidatorCtor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('.get:CalendarMonthRangeBuilderCtor', () => {
    test('to be the builder of a calendar month range', () => {
      const expected = CalendarMonthRangeBuilder

      const actual = MonthlyExpensesQueryResolver.CalendarMonthRangeBuilderCtor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
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
              StandInError: '204.Q004.901',
            },
          },
          expected: Expense,
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.Q004.902',
            },
          },
          expected: Expense,
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', ({
        factoryParams,
        expected,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create(factoryParams)

        const actual = resolver.ExpenseModel

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#get:ExpenseCategoryModel', () => {
    describe('should answer the ExpenseCategory model', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.Q004.903',
            },
          },
          expected: ExpenseCategory,
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.Q004.904',
            },
          },
          expected: ExpenseCategory,
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', ({
        factoryParams,
        expected,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create(factoryParams)

        const actual = resolver.ExpenseCategoryModel

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#createInputValidator()', () => {
    /*
     * The resolver hands the validator its own `errorHash`, which is what makes each rule refuse
     * with this resolver's `203.Q004.*` code rather than with an error of the validator's own.
     */
    describe('should hand this resolver own error hash to the validator', () => {
      const cases = [
        {
          params: {
            input: {
              year: 2026,
              month: 6,
            },
          },
        },
        {
          params: {
            input: {
              year: 2025,
              month: 11,
            },
          },
        },
      ]

      test.each(cases)('input.year: $params.input.year', ({
        params,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()

        const inputValidator = resolver.createInputValidator(/** @type {*} */ (params))
        const actual = inputValidator.errorHash

        expect(actual)
          .toBe(resolver.errorHash) // same reference
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#createInputValidator()', () => {
    describe('should be the validator holding this operation input rules', () => {
      const cases = [
        {
          params: {
            input: {
              year: 2024,
              month: 3,
            },
          },
        },
        {
          params: {
            input: {
              year: 2023,
              month: 9,
            },
          },
        },
      ]

      test.each(cases)('input.year: $params.input.year', ({
        params,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()

        const actual = resolver.createInputValidator(/** @type {*} */ (params))

        expect(actual)
          .toBeInstanceOf(MonthlyExpensesInputValidator)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#validateInput()', () => {
    /*
     * The error arrives already created, and its message is the code the caller receives.
     */
    describe('should refuse a month nobody could be answered for', () => {
      const cases = [
        {
          params: {
            input: {
              year: 0,
              month: 6,
            },
          },
          label: 'a year no calendar date can name',
          expected: '203.Q004.001',
        },
        {
          params: {
            input: {
              year: 2026,
              month: 13,
            },
          },
          label: 'a thirteenth month',
          expected: '203.Q004.002',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
        expected,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()

        const actual = resolver.validateInput(/** @type {*} */ (params))

        expect(actual)
          .toHaveProperty('message', expected)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#validateInput()', () => {
    describe('when the presented month satisfies every rule', () => {
      const cases = [
        {
          params: {
            input: {
              year: 2026,
              month: 6,
            },
          },
        },
        {
          params: {
            input: {
              year: 2026,
              month: 12,
            },
          },
        },
        {
          params: {
            input: {
              year: 2999,
              month: 1,
            },
          },
        },
      ]

      test.each(cases)('input.month: $params.input.month', ({
        params,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()

        const actual = resolver.validateInput(/** @type {*} */ (params))

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#createCalendarMonthRangeBuilder()', () => {
    describe('should be a builder of a calendar month range', () => {
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

      test.each(cases)('month: $params.month', ({
        params,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()

        const actual = resolver.createCalendarMonthRangeBuilder(params)

        expect(actual)
          .toBeInstanceOf(CalendarMonthRangeBuilder)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#buildCalendarDateRange()', () => {
    /*
     * The two ends of the chosen month, as the `where` will compare them. February of a leap year
     * and of a common year are both here, because a month whose last day is computed rather than
     * looked up is the one place the two ends can silently disagree with the calendar.
     */
    describe('should answer the first and the last day of the chosen month', () => {
      const cases = [
        {
          params: {
            year: 2026,
            month: 6,
          },
          expected: {
            firstCalendarDate: '2026-06-01',
            lastCalendarDate: '2026-06-30',
          },
        },
        {
          params: {
            year: 2026,
            month: 7,
          },
          expected: {
            firstCalendarDate: '2026-07-01',
            lastCalendarDate: '2026-07-31',
          },
        },
        {
          params: {
            year: 2024,
            month: 2,
          },
          expected: {
            firstCalendarDate: '2024-02-01',
            lastCalendarDate: '2024-02-29',
          },
        },
        {
          params: {
            year: 2026,
            month: 2,
          },
          expected: {
            firstCalendarDate: '2026-02-01',
            lastCalendarDate: '2026-02-28',
          },
        },
      ]

      test.each(cases)('year: $params.year, month: $params.month', ({
        params,
        expected,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()

        const actual = resolver.buildCalendarDateRange(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#findMonthlyExpenses()', () => {
    /*
     * **The whole query this operation issues, asserted as the arguments handed to the model.**
     *
     * Three of the things section 12 and section 7 require are stated here and nowhere else in a
     * form a wrong one could not imitate:
     *
     *   - the `where` names the owner, so another member of staff's rows are OUTSIDE the query
     *     rather than filtered out of its result;
     *   - `spentOn` is compared as a **range over the bare column**, not wrapped in a function --
     *     section 7's single indexed read against section 9.3's `(staff_member_id, spent_on)`, and
     *     the only predicate SQLite and MariaDB both answer from that index;
     *   - the `order` carries **both** keys of section 6's `entry order`.
     *
     * **The second key is not observable through this database**, which was measured on the sibling
     * operation rather than assumed: SQLite serves `spent_on DESC` by walking the composite index
     * backwards and hands tied rows back rowid descending, which is already the order section 6
     * asks for. So a test that only read rows back could not tell a missing `['id', 'DESC']` apart
     * from a present one here. **This is the describe that fails if the second key is deleted**,
     * and `tests/_orders/Expense/MonthlyExpensesQueryResolver.js` asserts the behaviour it buys
     * against rows genuinely recorded one after another, which is the half a caller can see.
     *
     * The eager-loaded category is in the same assertion, so dropping it -- which would turn a
     * month into one query per row -- is caught here too.
     */
    describe('should hand the model the owner, the month range and both order keys', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            year: 2026,
            month: 6,
          },
          expected: {
            where: {
              StaffMemberId: 10110001,
              spentOn: {
                [Op.between]: [
                  '2026-06-01',
                  '2026-06-30',
                ],
              },
            },
            include: [
              ExpenseCategory,
            ],
            order: [
              ['spentOn', 'DESC'],
              ['id', 'DESC'],
            ],
          },
        },
        {
          params: {
            staffMemberId: 10110002,
            year: 2024,
            month: 2,
          },
          expected: {
            where: {
              StaffMemberId: 10110002,
              spentOn: {
                [Op.between]: [
                  '2024-02-01',
                  '2024-02-29',
                ],
              },
            },
            include: [
              ExpenseCategory,
            ],
            order: [
              ['spentOn', 'DESC'],
              ['id', 'DESC'],
            ],
          },
        },
      ]

      test.each(cases)('staffMemberId: $params.staffMemberId', async ({
        params,
        expected,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()
        const findAllSpy = jest.spyOn(Expense, 'findAll')
          .mockResolvedValue(/** @type {*} */ ([]))

        await resolver.findMonthlyExpenses(params)

        expect(findAllSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#findMonthlyExpenses()', () => {
    /*
     * Against the seeded database, with the ids written out rather than counted, so both the month
     * boundary and the ordering are asserted by which rows arrive and in which order.
     *
     * The first case is June 2026 of the member of staff who has a row on the first day and a row
     * on the last: the inclusive half of section 12's second criterion. The second is July 2026 of
     * the same member of staff, whose lower boundary is the interesting one -- `10200007` sits on
     * `2026-06-30`, the day before, and a range one day wide at that end would put it here.
     */
    describe('should answer the owner own entries of the chosen month, newest spentOn first', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            year: 2026,
            month: 6,
          },
          label: 'June 2026, whose two rows are its first and last day',
          expected: [
            expect.objectContaining({
              id: 10200007,
              spentOn: '2026-06-30',
            }),
            expect.objectContaining({
              id: 10200003,
              spentOn: '2026-06-01',
            }),
          ],
        },
        {
          params: {
            staffMemberId: 10110001,
            year: 2026,
            month: 7,
          },
          label: 'July 2026, the day after a month whose last day is seeded',
          expected: [
            expect.objectContaining({
              id: 10200005,
              spentOn: '2026-07-31',
            }),
            expect.objectContaining({
              id: 10200009,
              spentOn: '2026-07-16',
            }),
            expect.objectContaining({
              id: 10200001,
              spentOn: '2026-07-03',
            }),
          ],
        },
        {
          params: {
            staffMemberId: 10110002,
            year: 2026,
            month: 6,
          },
          label: 'June 2026 of the other member of staff, one row of their own',
          expected: [
            expect.objectContaining({
              id: 10200014,
              spentOn: '2026-06-18',
            }),
          ],
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
        expected,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()

        const actual = await resolver.findMonthlyExpenses(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#findMonthlyExpenses()', () => {
    /*
     * The eager-loaded category, asserted on the association as it arrives on the row rather than
     * on the formatted output -- this is the read that keeps a month a bounded number of queries
     * instead of one per row.
     */
    describe('should eager-load the category of each entry', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            year: 2026,
            month: 6,
          },
          expected: [
            expect.objectContaining({
              id: 10200007,
              ExpenseCategory: expect.objectContaining({
                id: 10000003,
                name: 'supplies',
                displayOrder: 3,
              }),
            }),
            expect.objectContaining({
              id: 10200003,
              ExpenseCategory: expect.objectContaining({
                id: 10000003,
                name: 'supplies',
                displayOrder: 3,
              }),
            }),
          ],
        },
        {
          params: {
            staffMemberId: 10110002,
            year: 2026,
            month: 6,
          },
          expected: [
            expect.objectContaining({
              id: 10200014,
              ExpenseCategory: expect.objectContaining({
                id: 10000002,
                name: 'meals',
                displayOrder: 2,
              }),
            }),
          ],
        },
      ]

      test.each(cases)('staffMemberId: $params.staffMemberId', async ({
        params,
        expected,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()

        const actual = await resolver.findMonthlyExpenses(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#findMonthlyExpenses()', () => {
    /*
     * A month in which nothing was recorded. May 2026 lies between two months that both hold rows
     * for this member of staff, so an answer of anything at all here would mean the range reaches
     * past its own ends; the other two are a member of staff who has recorded nothing and a month
     * years away from every seeded row.
     */
    describe('when the chosen month holds no entry at all', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            year: 2026,
            month: 5,
          },
          label: 'the month between two months that both hold rows',
        },
        {
          params: {
            staffMemberId: 10110003,
            year: 2026,
            month: 6,
          },
          label: 'a member of staff who has recorded nothing',
        },
        {
          params: {
            staffMemberId: 10110001,
            year: 2019,
            month: 3,
          },
          label: 'a month years before every seeded row',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()

        const actual = await resolver.findMonthlyExpenses(params)

        expect(actual)
          .toHaveLength(0)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#formatExpenseCategory()', () => {
    describe('should answer the three fields the contract declares', () => {
      const cases = [
        {
          params: {
            expenseCategoryAttributes: {
              id: 10000001,
              name: 'transport',
              displayOrder: 1,
            },
          },
          expected: {
            id: 10000001,
            name: 'transport',
            displayOrder: 1,
          },
        },
        {
          params: {
            expenseCategoryAttributes: {
              id: 10000004,
              name: 'other',
              displayOrder: 4,
            },
          },
          expected: {
            id: 10000004,
            name: 'other',
            displayOrder: 4,
          },
        },
      ]

      test.each(cases)('expenseCategoryAttributes.id: $params.expenseCategoryAttributes.id', ({
        params,
        expected,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()

        const formatArgs = {
          expenseCategoryEntity: ExpenseCategory.build(params.expenseCategoryAttributes),
        }

        const actual = resolver.formatExpenseCategory(/** @type {*} */ (formatArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#formatExpense()', () => {
    /*
     * The entities are built rather than fetched: this method reads properties and touches no
     * table, so the timestamps can be pinned here where the seeded ones cannot.
     *
     * The second case carries a **null memo**, the one genuinely optional field: it must read back
     * empty rather than fail. The foreign keys are dropped on the way out -- the contract exposes
     * the category as a nested object, never as an id.
     */
    describe('should answer the row in the shape the contract declares', () => {
      const cases = [
        {
          params: {
            expenseAttributes: {
              id: 10200003,
              StaffMemberId: 10110001,
              ExpenseCategoryId: 10000003,
              spentOn: '2026-06-01',
              amount: 3450,
              memo: 'notebooks and pens for the design review',
              status: 'recorded',
              createdAt: new Date('2026-06-02T01:02:03.000Z'),
              updatedAt: new Date('2026-06-02T01:02:03.000Z'),
              ExpenseCategory: {
                id: 10000003,
                name: 'supplies',
                displayOrder: 3,
              },
            },
          },
          expected: {
            id: 10200003,
            spentOn: '2026-06-01',
            amount: 3450,
            memo: 'notebooks and pens for the design review',
            status: 'recorded',
            expenseCategory: {
              id: 10000003,
              name: 'supplies',
              displayOrder: 3,
            },
            createdAt: new Date('2026-06-02T01:02:03.000Z'),
            updatedAt: new Date('2026-06-02T01:02:03.000Z'),
          },
        },
        {
          params: {
            expenseAttributes: {
              id: 10200013,
              StaffMemberId: 10110002,
              ExpenseCategoryId: 10000001,
              spentOn: '2026-09-05',
              amount: 33500,
              memo: null,
              status: 'recorded',
              createdAt: new Date('2026-09-06T04:05:06.000Z'),
              updatedAt: new Date('2026-09-07T07:08:09.000Z'),
              ExpenseCategory: {
                id: 10000001,
                name: 'transport',
                displayOrder: 1,
              },
            },
          },
          expected: {
            id: 10200013,
            spentOn: '2026-09-05',
            amount: 33500,
            memo: null,
            status: 'recorded',
            expenseCategory: {
              id: 10000001,
              name: 'transport',
              displayOrder: 1,
            },
            createdAt: new Date('2026-09-06T04:05:06.000Z'),
            updatedAt: new Date('2026-09-07T07:08:09.000Z'),
          },
        },
      ]

      test.each(cases)('expenseAttributes.id: $params.expenseAttributes.id', ({
        params,
        expected,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()

        const formatArgs = {
          expenseEntity: Expense.build(
            params.expenseAttributes,
            {
              include: [
                ExpenseCategory,
              ],
            }
          ),
        }

        const actual = resolver.formatExpense(/** @type {*} */ (formatArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#calculateTotalAmount()', () => {
    /*
     * **Section 12's first acceptance criterion, taken apart from the read.** The total is the sum
     * of the amounts of the entries handed in, to the yen, and nothing else about an entry reaches
     * it.
     *
     * The counts run three, two, one and none, because the empty case is section 12's third
     * criterion -- a month in which nothing was recorded totals zero -- and it is the seed of the
     * reduction rather than a branch, so nothing else states it.
     *
     * Every amount differs from every other, and none of them is a multiple of another, so a sum
     * that picked the wrong field or dropped an entry cannot land on the expected number by
     * accident.
     */
    describe('should answer the sum of the amounts of the entries', () => {
      const cases = [
        {
          params: {
            expenses: [
              {
                id: 10200003,
                amount: 3450,
              },
              {
                id: 10200007,
                amount: 1,
              },
              {
                id: 10200014,
                amount: 1860,
              },
            ],
          },
          label: 'three entries',
          expected: 5311,
        },
        {
          params: {
            expenses: [
              {
                id: 10200003,
                amount: 3450,
              },
              {
                id: 10200007,
                amount: 1,
              },
            ],
          },
          label: 'two entries',
          expected: 3451,
        },
        {
          params: {
            expenses: [
              {
                id: 10200014,
                amount: 1860,
              },
            ],
          },
          label: 'one entry',
          expected: 1860,
        },
        {
          params: {
            expenses: [],
          },
          label: 'no entry at all',
          expected: 0,
        },
      ]

      test.each(cases)('label: $label', ({
        params,
        expected,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()

        const actual = resolver.calculateTotalAmount(/** @type {*} */ (params))

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#formatResponse()', () => {
    /*
     * The month and its total assembled together, which is section 12.1's whole reason for one
     * operation: **the total is summed over the very array answered with**, so the two cannot
     * describe different sets of rows.
     *
     * The entities are built rather than fetched, so the timestamps are pinned.
     */
    describe('should assemble the month and the total taken over it', () => {
      const cases = [
        {
          params: {
            expenseAttributesSet: [
              {
                id: 10200007,
                StaffMemberId: 10110001,
                ExpenseCategoryId: 10000003,
                spentOn: '2026-06-30',
                amount: 1,
                memo: 'one envelope, bought singly',
                status: 'recorded',
                createdAt: new Date('2026-07-01T00:11:22.000Z'),
                updatedAt: new Date('2026-07-01T00:11:22.000Z'),
                ExpenseCategory: {
                  id: 10000003,
                  name: 'supplies',
                  displayOrder: 3,
                },
              },
              {
                id: 10200003,
                StaffMemberId: 10110001,
                ExpenseCategoryId: 10000003,
                spentOn: '2026-06-01',
                amount: 3450,
                memo: 'notebooks and pens for the design review',
                status: 'recorded',
                createdAt: new Date('2026-06-02T01:02:03.000Z'),
                updatedAt: new Date('2026-06-02T01:02:03.000Z'),
                ExpenseCategory: {
                  id: 10000003,
                  name: 'supplies',
                  displayOrder: 3,
                },
              },
            ],
          },
          label: 'two entries of one month',
          expected: {
            expenses: [
              {
                id: 10200007,
                spentOn: '2026-06-30',
                amount: 1,
                memo: 'one envelope, bought singly',
                status: 'recorded',
                expenseCategory: {
                  id: 10000003,
                  name: 'supplies',
                  displayOrder: 3,
                },
                createdAt: new Date('2026-07-01T00:11:22.000Z'),
                updatedAt: new Date('2026-07-01T00:11:22.000Z'),
              },
              {
                id: 10200003,
                spentOn: '2026-06-01',
                amount: 3450,
                memo: 'notebooks and pens for the design review',
                status: 'recorded',
                expenseCategory: {
                  id: 10000003,
                  name: 'supplies',
                  displayOrder: 3,
                },
                createdAt: new Date('2026-06-02T01:02:03.000Z'),
                updatedAt: new Date('2026-06-02T01:02:03.000Z'),
              },
            ],
            totalAmount: 3451,
          },
        },
        {
          params: {
            expenseAttributesSet: [
              {
                id: 10200014,
                StaffMemberId: 10110002,
                ExpenseCategoryId: 10000002,
                spentOn: '2026-06-18',
                amount: 1860,
                memo: 'dinner with the visiting auditor',
                status: 'recorded',
                createdAt: new Date('2026-06-19T09:08:07.000Z'),
                updatedAt: new Date('2026-06-19T09:08:07.000Z'),
                ExpenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
              },
            ],
          },
          label: 'one entry of one month',
          expected: {
            expenses: [
              {
                id: 10200014,
                spentOn: '2026-06-18',
                amount: 1860,
                memo: 'dinner with the visiting auditor',
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: new Date('2026-06-19T09:08:07.000Z'),
                updatedAt: new Date('2026-06-19T09:08:07.000Z'),
              },
            ],
            totalAmount: 1860,
          },
        },
      ]

      test.each(cases)('label: $label', ({
        params,
        expected,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()

        const formatArgs = {
          expenseEntities: params.expenseAttributesSet
            .map(expenseAttributes =>
              Expense.build(
                expenseAttributes,
                {
                  include: [
                    ExpenseCategory,
                  ],
                }
              )
            ),
        }

        const actual = resolver.formatResponse(/** @type {*} */ (formatArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * **The operation end to end against the seeded database, in one `toEqual` over the whole
     * result.** Four of section 12's six acceptance criteria are carried by these two cases.
     *
     *   - **The total equals the sum of the amounts of the entries shown.** June 2026 of
     *     `10110001` is `1 + 3450 = 3451`, and June 2026 of `10110002` is `1860`. Neither number
     *     is written anywhere but here and in the rows beside it.
     *   - **An expense dated the first or the last day of the chosen month is in it.** `10200003`
     *     is dated `2026-06-01` and `10200007` is dated `2026-06-30`, and both are here.
     *   - **Another member of staff's expense in the same month changes neither the entries shown
     *     nor the total.** `10200014` is dated `2026-06-18` -- inside the very month both cases
     *     read -- and it appears in exactly one of the two answers, with its amount in exactly one
     *     of the two totals. Dropping the owner from the `where` makes both cases wrong in both
     *     the rows and the total at once.
     *   - The entries are in section 6's `entry order`, newest `spentOn` first, which is why
     *     `10200007` precedes `10200003` although its id is the higher of the two.
     */
    describe('should answer the caller own entries of the chosen month, and their total', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              year: 2026,
              month: 6,
            },
          },
          label: 'June 2026 of the member of staff who has two rows in it',
          expected: {
            expenses: [
              {
                id: 10200007,
                spentOn: '2026-06-30',
                amount: 1,
                memo: 'one envelope, bought singly',
                status: 'recorded',
                expenseCategory: {
                  id: 10000003,
                  name: 'supplies',
                  displayOrder: 3,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
              {
                id: 10200003,
                spentOn: '2026-06-01',
                amount: 3450,
                memo: 'notebooks and pens for the design review',
                status: 'recorded',
                expenseCategory: {
                  id: 10000003,
                  name: 'supplies',
                  displayOrder: 3,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
            ],
            totalAmount: 3451,
          },
        },
        {
          params: {
            staffMemberId: 10110002,
            input: {
              year: 2026,
              month: 6,
            },
          },
          label: 'June 2026 of the member of staff who has one row in it',
          expected: {
            expenses: [
              {
                id: 10200014,
                spentOn: '2026-06-18',
                amount: 1860,
                memo: 'dinner with the visiting auditor',
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
            ],
            totalAmount: 1860,
          },
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
        expected,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()

        const resolveArgs = {
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
          },
        }

        const actual = await resolver.resolve(/** @type {*} */ (resolveArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * **The exclusive half of section 12's second criterion, as far as the seeded rows carry it.**
     * July 2026 of `10110001` holds three rows, and `10200007` sits on `2026-06-30` -- the day
     * before it. A range whose lower end were one day early would put that row at the top of this
     * list and make the total `2101` instead of `2100`, so this case fails under exactly that
     * mistake.
     *
     * The day *after* a month is not reachable from the seeded rows, and is asserted in
     * `tests/_orders/Expense/MonthlyExpensesQueryResolver.js` against rows recorded for the
     * purpose.
     */
    describe('should leave out an entry dated the day before the chosen month', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              year: 2026,
              month: 7,
            },
          },
          expected: {
            expenses: [
              {
                id: 10200005,
                spentOn: '2026-07-31',
                amount: 260,
                memo: 'single bus ride back from the depot',
                status: 'recorded',
                expenseCategory: {
                  id: 10000001,
                  name: 'transport',
                  displayOrder: 1,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
              {
                id: 10200009,
                spentOn: '2026-07-16',
                amount: 640,
                memo: 'taxi from the station in the rain',
                status: 'recorded',
                expenseCategory: {
                  id: 10000001,
                  name: 'transport',
                  displayOrder: 1,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
              {
                id: 10200001,
                spentOn: '2026-07-03',
                amount: 1200,
                memo: 'train fare to the client in Shinagawa',
                status: 'recorded',
                expenseCategory: {
                  id: 10000001,
                  name: 'transport',
                  displayOrder: 1,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
            ],
            totalAmount: 2100,
          },
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              year: 2026,
              month: 8,
            },
          },
          expected: {
            expenses: [
              {
                id: 10200002,
                spentOn: '2026-08-21',
                amount: 880,
                memo: 'lunch while on site',
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
              {
                id: 10200010,
                spentOn: '2026-08-13',
                amount: 2175,
                memo: 'team breakfast before the release',
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
              {
                id: 10200006,
                spentOn: '2026-08-05',
                amount: 5730,
                memo: null,
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              },
            ],
            totalAmount: 8785,
          },
        },
      ]

      test.each(cases)('input.month: $params.input.month', async ({
        params,
        expected,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()

        const resolveArgs = {
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
          },
        }

        const actual = await resolver.resolve(/** @type {*} */ (resolveArgs))

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * **Section 12's third acceptance criterion, the list half.** A month in which the member of
     * staff recorded nothing is an empty list rather than a refusal -- an empty month is a
     * successful read.
     */
    describe('when the chosen month holds no entry at all', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              year: 2026,
              month: 5,
            },
          },
          label: 'the month between two months that both hold rows',
        },
        {
          params: {
            staffMemberId: 10110003,
            input: {
              year: 2026,
              month: 6,
            },
          },
          label: 'a member of staff who has recorded nothing',
        },
        {
          params: {
            staffMemberId: 10110002,
            input: {
              year: 2030,
              month: 1,
            },
          },
          label: 'a month in the future, answered rather than refused',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()

        const resolveArgs = {
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
          },
        }

        const resolved = await resolver.resolve(/** @type {*} */ (resolveArgs))
        const actual = resolved.expenses

        expect(actual)
          .toHaveLength(0)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * **Section 12's third acceptance criterion, the total half.** The same three empty months
     * report a total of zero -- not null, not absent, and not the total of some other month.
     */
    describe('when the chosen month holds no entry at all', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              year: 2026,
              month: 5,
            },
          },
          label: 'the month between two months that both hold rows',
          expected: 0,
        },
        {
          params: {
            staffMemberId: 10110003,
            input: {
              year: 2026,
              month: 6,
            },
          },
          label: 'a member of staff who has recorded nothing',
          expected: 0,
        },
        {
          params: {
            staffMemberId: 10110002,
            input: {
              year: 2030,
              month: 1,
            },
          },
          label: 'a month in the future, answered rather than refused',
          expected: 0,
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
        expected,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()

        const resolveArgs = {
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
          },
        }

        const resolved = await resolver.resolve(/** @type {*} */ (resolveArgs))
        const actual = resolved.totalAmount

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * **Section 12's last acceptance criterion: the operation is refused without a session.**
     *
     * The engine is where that is guaranteed -- `monthlyExpenses` is absent from
     * `schemasToSkipFiltering`, so the authentication filter refuses a tokenless caller before a
     * resolver is reached. What is asserted here is the resolver's own second line, for the case
     * where that hand-maintained list is wrong: the refusal is a bare error code, and nothing about
     * a caller or a row comes back with it.
     *
     * The cases differ in what else the context carries and in what was asked for: a perfectly good
     * month, and a malformed one. The session guard answers first in both, so a caller with no
     * session is never told whether their input was also wrong.
     */
    describe('when the context carries no member of staff', () => {
      const cases = [
        {
          params: {
            context: {
              staffMemberId: null,
            },
            input: {
              year: 2026,
              month: 6,
            },
          },
          label: 'staffMemberId alone, with a month that exists',
          expected: '204.Q004.001',
        },
        {
          params: {
            context: {
              staffMemberId: null,
              staffMember: null,
              now: new Date('2026-09-15T09:00:00.000Z'),
            },
            input: {
              year: 2026,
              month: 6,
            },
          },
          label: 'staffMemberId among the rest of the context',
          expected: '204.Q004.001',
        },
        {
          params: {
            context: {
              staffMemberId: null,
            },
            input: {
              year: 0,
              month: 13,
            },
          },
          label: 'staffMemberId alone, with a month that does not exist',
          expected: '204.Q004.001',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
        expected,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()

        const resolveArgs = {
          variables: {
            input: params.input,
          },
          context: params.context,
        }

        const actual = () => resolver.resolve(/** @type {*} */ (resolveArgs))

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * **"before it reads anything", which is the half of section 12's last criterion a thrown code
     * does not state.** A refusal that happened after the month had been read would look identical
     * from outside, so the read itself is what is asserted: the model is never asked.
     */
    describe('should refuse a caller with no session before reading a row', () => {
      const cases = [
        {
          params: {
            context: {
              staffMemberId: null,
            },
            input: {
              year: 2026,
              month: 6,
            },
          },
          label: 'a month that exists',
          expected: '204.Q004.001',
        },
        {
          params: {
            context: {
              staffMemberId: null,
            },
            input: {
              year: 2026,
              month: 13,
            },
          },
          label: 'a month that does not exist',
          expected: '204.Q004.001',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
        expected,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()
        const findAllSpy = jest.spyOn(Expense, 'findAll')
        const resolveArgs = {
          variables: {
            input: params.input,
          },
          context: params.context,
        }

        const actual = () => resolver.resolve(/** @type {*} */ (resolveArgs))

        await expect(actual)
          .rejects
          .toThrow(expected)
        expect(findAllSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * A month nobody could be answered for, refused with the validator's own code rather than
     * answered as an empty month -- a thirteenth month left unrefused would be built into the pair
     * `2026-13-01` / `2026-13-31`, match nothing, and come back looking like a successful read of
     * a month that does not exist.
     */
    describe('when the presented month is one nobody could be answered for', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            input: {
              year: 2026,
              month: 13,
            },
          },
          label: 'a thirteenth month',
          expected: '203.Q004.002',
        },
        {
          params: {
            staffMemberId: 10110001,
            input: {
              year: 2026,
              month: 0,
            },
          },
          label: 'a zeroth month',
          expected: '203.Q004.002',
        },
        {
          params: {
            staffMemberId: 10110002,
            input: {
              year: 0,
              month: 6,
            },
          },
          label: 'a year no calendar date can name',
          expected: '203.Q004.001',
        },
        {
          params: {
            staffMemberId: 10110002,
            input: {
              year: -2026,
              month: 6,
            },
          },
          label: 'a year before the common era',
          expected: '203.Q004.001',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
        expected,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()

        const resolveArgs = {
          variables: {
            input: params.input,
          },
          context: {
            staffMemberId: params.staffMemberId,
          },
        }

        const actual = () => resolver.resolve(/** @type {*} */ (resolveArgs))

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})
