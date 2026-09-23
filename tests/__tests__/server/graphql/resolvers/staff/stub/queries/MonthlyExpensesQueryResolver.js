import {
  BaseQueryResolver,
} from '@openreachtech/renchan'

import MonthlyExpensesQueryResolver from '../../../../../../../../server/graphql/resolvers/staff/stub/queries/MonthlyExpensesQueryResolver.js'

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
     * A stub throws nothing, so it owns no error code. The real codes — built on this operation's
     * id `Q004` in resolver-id-hash-staff.js — arrive with the `actual/` resolver at checkpoint 6,
     * and this assertion is what notices one landing here early.
     */
    test('to be empty', () => {
      const expected = {}

      const actual = MonthlyExpensesQueryResolver.errorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * Two cases, two different months asked for, and one answer.
     *
     * The whole result is written out by value in each of them — every entry, every field, and the
     * total — because these literals are what a screen is built against, and a fixture nobody
     * asserts by value is a fixture that can be edited without anybody noticing. The expected
     * object is duplicated between the cases rather than lifted above them, so each case reads
     * top-to-bottom on its own.
     *
     * What the pair of cases pins is that **the month the caller names does not change the
     * answer**. That is the stub being a stub: choosing entries by month is a filter, and a stub
     * filters nothing. Asserting it here, rather than leaving it undeclared, is what keeps a reader
     * from mistaking the same rows coming back for a broken month selector — and what will fail
     * loudly if somebody starts filtering in a resolver whose whole contract is to hold literals.
     *
     * Inside the answer, the order is section 6's `entry order`: newest `spentOn` first, and within
     * `2026-09-18` the more recently recorded of the two first. `toEqual` on an array is
     * order-sensitive, so the order is asserted by the same expectation that asserts the values.
     */
    describe('to answer with the same month of entries whichever month is asked for', () => {
      const cases = [
        {
          params: {
            variables: {
              input: {
                year: 2026,
                month: 9,
              },
            },
            context: null, // neutral value; a stub reads no context
          },
          expected: {
            expenses: [
              {
                id: 9201,
                spentOn: '2026-09-30', // the last day of the month
                amount: 4200,
                memo: 'Taxi home after the month-end close',
                status: 'recorded',
                expenseCategory: {
                  id: 10000001,
                  name: 'transport',
                  displayOrder: 1,
                },
                createdAt: new Date('2026-09-30T12:40:00.000Z'),
                updatedAt: new Date('2026-09-30T12:40:00.000Z'),
              },
              {
                id: 9202,
                spentOn: '2026-09-18', // the later-recorded of the tied pair, so the first of them
                amount: 1650,
                memo: 'Dinner with the visiting audit team',
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: new Date('2026-09-18T11:20:00.000Z'),
                updatedAt: new Date('2026-09-18T11:20:00.000Z'),
              },
              {
                id: 9203,
                spentOn: '2026-09-18', // the earlier-recorded of the tied pair
                amount: 780,
                memo: null, // the optional memo, read back empty rather than failing
                status: 'recorded',
                expenseCategory: {
                  id: 10000003,
                  name: 'supplies',
                  displayOrder: 3,
                },
                createdAt: new Date('2026-09-18T02:05:00.000Z'),
                updatedAt: new Date('2026-09-18T02:05:00.000Z'),
              },
              {
                id: 9204,
                spentOn: '2026-09-12',
                amount: 23500,
                memo: 'Conference ticket for the autumn meetup',
                status: 'recorded',
                expenseCategory: {
                  id: 10000004,
                  name: 'other',
                  displayOrder: 4,
                },
                createdAt: new Date('2026-09-12T06:15:00.000Z'),
                updatedAt: new Date('2026-09-12T06:15:00.000Z'),
              },
              {
                id: 9205,
                spentOn: '2026-09-09',
                amount: 340,
                memo: 'Stamps for posting the signed contract',
                status: 'recorded',
                expenseCategory: {
                  id: 10000003,
                  name: 'supplies',
                  displayOrder: 3,
                },
                createdAt: new Date('2026-09-09T23:55:00.000Z'),
                updatedAt: new Date('2026-09-09T23:55:00.000Z'),
              },
              {
                id: 9206,
                spentOn: '2026-09-05',
                amount: 2100,
                memo: 'Lunch boxes for the Saturday shift',
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: new Date('2026-09-05T04:30:00.000Z'),
                updatedAt: new Date('2026-09-05T08:10:00.000Z'), // the corrected entry
              },
              {
                id: 9207,
                spentOn: '2026-09-01', // the first day of the month
                amount: 990,
                memo: 'Train fare to the client kickoff',
                status: 'recorded',
                expenseCategory: {
                  id: 10000001,
                  name: 'transport',
                  displayOrder: 1,
                },
                createdAt: new Date('2026-09-01T00:20:00.000Z'),
                updatedAt: new Date('2026-09-01T00:20:00.000Z'),
              },
            ],
            totalAmount: 33560,
          },
        },
        {
          params: {
            variables: {
              input: {
                year: 2025,
                month: 2,
              },
            },
            context: null, // neutral value; a stub reads no context
          },
          expected: {
            expenses: [
              {
                id: 9201,
                spentOn: '2026-09-30', // the last day of the month
                amount: 4200,
                memo: 'Taxi home after the month-end close',
                status: 'recorded',
                expenseCategory: {
                  id: 10000001,
                  name: 'transport',
                  displayOrder: 1,
                },
                createdAt: new Date('2026-09-30T12:40:00.000Z'),
                updatedAt: new Date('2026-09-30T12:40:00.000Z'),
              },
              {
                id: 9202,
                spentOn: '2026-09-18', // the later-recorded of the tied pair, so the first of them
                amount: 1650,
                memo: 'Dinner with the visiting audit team',
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: new Date('2026-09-18T11:20:00.000Z'),
                updatedAt: new Date('2026-09-18T11:20:00.000Z'),
              },
              {
                id: 9203,
                spentOn: '2026-09-18', // the earlier-recorded of the tied pair
                amount: 780,
                memo: null, // the optional memo, read back empty rather than failing
                status: 'recorded',
                expenseCategory: {
                  id: 10000003,
                  name: 'supplies',
                  displayOrder: 3,
                },
                createdAt: new Date('2026-09-18T02:05:00.000Z'),
                updatedAt: new Date('2026-09-18T02:05:00.000Z'),
              },
              {
                id: 9204,
                spentOn: '2026-09-12',
                amount: 23500,
                memo: 'Conference ticket for the autumn meetup',
                status: 'recorded',
                expenseCategory: {
                  id: 10000004,
                  name: 'other',
                  displayOrder: 4,
                },
                createdAt: new Date('2026-09-12T06:15:00.000Z'),
                updatedAt: new Date('2026-09-12T06:15:00.000Z'),
              },
              {
                id: 9205,
                spentOn: '2026-09-09',
                amount: 340,
                memo: 'Stamps for posting the signed contract',
                status: 'recorded',
                expenseCategory: {
                  id: 10000003,
                  name: 'supplies',
                  displayOrder: 3,
                },
                createdAt: new Date('2026-09-09T23:55:00.000Z'),
                updatedAt: new Date('2026-09-09T23:55:00.000Z'),
              },
              {
                id: 9206,
                spentOn: '2026-09-05',
                amount: 2100,
                memo: 'Lunch boxes for the Saturday shift',
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: new Date('2026-09-05T04:30:00.000Z'),
                updatedAt: new Date('2026-09-05T08:10:00.000Z'), // the corrected entry
              },
              {
                id: 9207,
                spentOn: '2026-09-01', // the first day of the month
                amount: 990,
                memo: 'Train fare to the client kickoff',
                status: 'recorded',
                expenseCategory: {
                  id: 10000001,
                  name: 'transport',
                  displayOrder: 1,
                },
                createdAt: new Date('2026-09-01T00:20:00.000Z'),
                updatedAt: new Date('2026-09-01T00:20:00.000Z'),
              },
            ],
            totalAmount: 33560,
          },
        },
      ]

      test.each(cases)('input.month: $params.variables.input.month', async ({
        params,
        expected,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()

        const actual = await resolver.resolve(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('MonthlyExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * Spec section 12's first acceptance criterion, asserted on its own: the total equals the sum of
     * the amounts of the entries answered with, to the yen.
     *
     * The assertion above already carries `totalAmount` inside the full result, so this is
     * deliberately a second look at the same number — and it is the one written by hand. The
     * resolver derives its total by summing its own entries, which is what makes the two agree by
     * construction; the literal `33560` here is the arithmetic done independently, so an entry's
     * amount edited in the fixture fails this test rather than quietly moving both sides at once.
     *
     * `toHaveProperty` rather than a second full `toEqual`, because the field is what is under
     * examination here and the rest of the shape is examined above.
     */
    describe('to answer with the total of the amounts of the entries it answers with', () => {
      const cases = [
        {
          params: {
            variables: {
              input: {
                year: 2026,
                month: 9,
              },
            },
            context: null, // neutral value; a stub reads no context
          },
          expected: 33560, // 4200 + 1650 + 780 + 23500 + 340 + 2100 + 990
        },
        {
          params: {
            variables: {
              input: {
                year: 2026,
                month: 12,
              },
            },
            context: null, // neutral value; a stub reads no context
          },
          expected: 33560, // 4200 + 1650 + 780 + 23500 + 340 + 2100 + 990
        },
      ]

      test.each(cases)('input.month: $params.variables.input.month', async ({
        params,
        expected,
      }) => {
        const resolver = MonthlyExpensesQueryResolver.create()

        const actual = await resolver.resolve(params)

        expect(actual)
          .toHaveProperty('totalAmount', expected)
      })
    })
  })
})
