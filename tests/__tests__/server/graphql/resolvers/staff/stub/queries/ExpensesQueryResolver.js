import {
  BaseQueryResolver,
} from '@openreachtech/renchan'

import ExpensesQueryResolver from '../../../../../../../../server/graphql/resolvers/staff/stub/queries/ExpensesQueryResolver.js'

describe('ExpensesQueryResolver', () => {
  describe('super class', () => {
    test('to be instance of BaseQueryResolver', () => {
      const actual = ExpensesQueryResolver.prototype

      expect(actual)
        .toBeInstanceOf(BaseQueryResolver)
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('.get:schema', () => {
    test('to be fixed value', () => {
      const expected = 'expenses'

      const actual = ExpensesQueryResolver.schema

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('.get:errorCodeHash', () => {
    /*
     * A stub throws nothing, so it owns no error code. The real codes — built on this operation's
     * id `Q002` in resolver-id-hash-staff.js — arrive with the `actual/` resolver at checkpoint 6,
     * and this assertion is what notices one landing here early.
     */
    test('to be empty', () => {
      const expected = {}

      const actual = ExpensesQueryResolver.errorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * The three cases are three windows onto the same twelve entries, and between them they pin
     * every property the hardcoded set is required to have.
     *
     * The first takes the top of the list, so it asserts the ordering the operation owes — newest
     * `spentOn` first, the day the money was paid — and carries the entry whose memo is null,
     * which is section 11's criterion that the memo is genuinely optional and reads back empty.
     * The second takes a window from the middle, so it asserts that the window moves with the
     * offset rather than always starting at the top, and it carries the one entry corrected after
     * it was written, whose `updatedAt` is later than its `createdAt`. The third asks for five and
     * is answered with the two that are left, which is where `totalRecords` is visibly the size of
     * the whole set rather than the size of the page.
     *
     * A sort clause is presented in the first case and absent in the other two. It comes back
     * exactly as it was sent either way: no operation in 1.0.0 lets a caller choose a sort, and the
     * field is echoed rather than applied.
     */
    describe('to answer with a page of the same hardcoded entries, newest spentOn first', () => {
      const cases = [
        {
          params: {
            variables: {
              input: {
                pagination: {
                  limit: 3,
                  offset: 0,
                  sort: {
                    key: 'spentOn',
                    direction: 'DESC',
                  },
                },
              },
            },
            context: null, // neutral value; a stub reads no context
          },
          expected: {
            expenses: [
              {
                id: 9101,
                spentOn: '2026-09-12',
                amount: 1200,
                memo: 'Taxi back from the client office',
                status: 'recorded',
                expenseCategory: {
                  id: 10000001,
                  name: 'transport',
                  displayOrder: 1,
                },
                createdAt: new Date('2026-09-12T13:05:00.000Z'),
                updatedAt: new Date('2026-09-12T13:05:00.000Z'),
              },
              {
                id: 9102,
                spentOn: '2026-09-11',
                amount: 880,
                memo: 'Lunch while visiting the branch',
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: new Date('2026-09-11T09:40:00.000Z'),
                updatedAt: new Date('2026-09-11T09:40:00.000Z'),
              },
              {
                id: 9103,
                spentOn: '2026-09-09',
                amount: 3400,
                memo: null, // the optional memo, read back empty rather than failing
                status: 'recorded',
                expenseCategory: {
                  id: 10000003,
                  name: 'supplies',
                  displayOrder: 3,
                },
                createdAt: new Date('2026-09-09T02:15:00.000Z'),
                updatedAt: new Date('2026-09-09T02:15:00.000Z'),
              },
            ],
            pagination: {
              limit: 3,
              offset: 0,
              sort: {
                key: 'spentOn',
                direction: 'DESC',
              },
              totalRecords: 12,
            },
          },
        },
        {
          params: {
            variables: {
              input: {
                pagination: {
                  limit: 4,
                  offset: 3,
                  // sort: undefined
                },
              },
            },
            context: null, // neutral value; a stub reads no context
          },
          expected: {
            expenses: [
              {
                id: 9104,
                spentOn: '2026-09-08',
                amount: 560,
                memo: 'Train fare to the warehouse',
                status: 'recorded',
                expenseCategory: {
                  id: 10000001,
                  name: 'transport',
                  displayOrder: 1,
                },
                createdAt: new Date('2026-09-08T11:30:00.000Z'),
                updatedAt: new Date('2026-09-08T11:30:00.000Z'),
              },
              {
                id: 9105,
                spentOn: '2026-09-05',
                amount: 1500,
                memo: 'Team dinner after the release',
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: new Date('2026-09-05T14:50:00.000Z'),
                updatedAt: new Date('2026-09-06T01:20:00.000Z'), // the corrected entry
              },
              {
                id: 9106,
                spentOn: '2026-09-03',
                amount: 2780,
                memo: 'Notebooks and pens for the new joiner',
                status: 'recorded',
                expenseCategory: {
                  id: 10000003,
                  name: 'supplies',
                  displayOrder: 3,
                },
                createdAt: new Date('2026-09-03T07:05:00.000Z'),
                updatedAt: new Date('2026-09-03T07:05:00.000Z'),
              },
              {
                id: 9107,
                spentOn: '2026-09-01',
                amount: 430,
                memo: 'Parcel postage to the auditor',
                status: 'recorded',
                expenseCategory: {
                  id: 10000004,
                  name: 'other',
                  displayOrder: 4,
                },
                createdAt: new Date('2026-09-01T08:25:00.000Z'),
                updatedAt: new Date('2026-09-01T08:25:00.000Z'),
              },
            ],
            pagination: {
              limit: 4,
              offset: 3,
              // sort: undefined
              totalRecords: 12,
            },
          },
        },
        {
          params: {
            variables: {
              input: {
                pagination: {
                  limit: 5,
                  offset: 10,
                  // sort: undefined
                },
              },
            },
            context: null, // neutral value; a stub reads no context
          },
          expected: {
            expenses: [
              {
                id: 9111,
                spentOn: '2026-08-18',
                amount: 24800,
                memo: 'Conference ticket, paid in advance',
                status: 'recorded',
                expenseCategory: {
                  id: 10000004,
                  name: 'other',
                  displayOrder: 4,
                },
                createdAt: new Date('2026-08-18T23:35:00.000Z'),
                updatedAt: new Date('2026-08-18T23:35:00.000Z'),
              },
              {
                id: 9112,
                spentOn: '2026-08-14',
                amount: 640,
                memo: 'Bus fare to the supplier',
                status: 'recorded',
                expenseCategory: {
                  id: 10000001,
                  name: 'transport',
                  displayOrder: 1,
                },
                createdAt: new Date('2026-08-14T10:00:00.000Z'),
                updatedAt: new Date('2026-08-14T10:00:00.000Z'),
              },
            ],
            pagination: {
              limit: 5,
              offset: 10,
              // sort: undefined
              totalRecords: 12,
            },
          },
        },
      ]

      test.each(cases)('pagination.offset: $params.variables.input.pagination.offset', async ({
        params,
        expected,
      }) => {
        const resolver = ExpensesQueryResolver.create()

        const actual = await resolver.resolve(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('ExpensesQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * A page that begins past the last entry. The set is twelve, so an offset of twelve or beyond
     * leaves nothing to slice, and the answer carries no entries while still reporting the size of
     * the whole set — which is what lets a screen tell "you have reached the end" apart from "you
     * have no entries".
     *
     * The whole result is asserted with one `toEqual`, empty array included, rather than the array
     * being pulled out and measured: the member under test answers with the result object, and
     * `toEqual` on it is order-sensitive and length-sensitive both.
     */
    describe('to answer with no entries when the page begins past the last of them', () => {
      const cases = [
        {
          params: {
            variables: {
              input: {
                pagination: {
                  limit: 10,
                  offset: 12,
                  // sort: undefined
                },
              },
            },
            context: null, // neutral value; a stub reads no context
          },
          expected: {
            expenses: [],
            pagination: {
              limit: 10,
              offset: 12,
              // sort: undefined
              totalRecords: 12,
            },
          },
        },
        {
          params: {
            variables: {
              input: {
                pagination: {
                  limit: 10,
                  offset: 400,
                  // sort: undefined
                },
              },
            },
            context: null, // neutral value; a stub reads no context
          },
          expected: {
            expenses: [],
            pagination: {
              limit: 10,
              offset: 400,
              // sort: undefined
              totalRecords: 12,
            },
          },
        },
      ]

      test.each(cases)('pagination.offset: $params.variables.input.pagination.offset', async ({
        params,
        expected,
      }) => {
        const resolver = ExpensesQueryResolver.create()

        const actual = await resolver.resolve(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
