import {
  Op,
} from 'sequelize'

import Expense from '../../../../../sequelize/models/Expense.js'

/*
 * What this file holds the seeder to, and why the seeder needs holding to anything at all.
 *
 * `queryInterface.bulkInsert` writes raw columns and reaches no Sequelize hook, so the two
 * reference checks the Expense model runs on every other write path -- `beforeSave` and
 * `beforeBulkCreate`, which refuse a row naming a member of staff or a category that does not
 * exist -- run for none of the seeded rows. A row pointing at an id nobody seeded would sit in the
 * table looking entirely well-formed, and the operations of section 11 would read it back and
 * resolve its owner or its category to nothing. Nothing fails while seeding, and nothing announces
 * itself later either.
 *
 * Everything below therefore reads the running database rather than the seeder's own literals.
 */
describe('expenses development seeder', () => {
  describe('should read every seeded row back as it was recorded', () => {
    const cases = [
      {
        params: {
          expenseId: 10200001,
        },
        expected: expect.objectContaining({
          id: 10200001,
          StaffMemberId: 10110001,
          ExpenseCategoryId: 10000001,
          spentOn: '2026-07-03',
          amount: 1200,
          memo: 'train fare to the client in Shinagawa',
          status: 'recorded',
        }),
      },
      {
        params: {
          expenseId: 10200002,
        },
        expected: expect.objectContaining({
          id: 10200002,
          StaffMemberId: 10110001,
          ExpenseCategoryId: 10000002,
          spentOn: '2026-08-21',
          amount: 880,
          memo: 'lunch while on site',
          status: 'recorded',
        }),
      },
      {
        params: {
          expenseId: 10200003,
        },
        expected: expect.objectContaining({
          id: 10200003,
          StaffMemberId: 10110001,
          ExpenseCategoryId: 10000003,
          spentOn: '2026-06-01',
          amount: 3450,
          memo: 'notebooks and pens for the design review',
          status: 'recorded',
        }),
      },
      {
        params: {
          expenseId: 10200004,
        },
        expected: expect.objectContaining({
          id: 10200004,
          StaffMemberId: 10110001,
          ExpenseCategoryId: 10000004,
          spentOn: '2026-09-02',
          amount: 12000,
          memo: 'conference ticket',
          status: 'recorded',
        }),
      },
      {
        params: {
          expenseId: 10200005,
        },
        expected: expect.objectContaining({
          id: 10200005,
          StaffMemberId: 10110001,
          ExpenseCategoryId: 10000001,
          spentOn: '2026-07-31',
          amount: 260,
          memo: 'single bus ride back from the depot',
          status: 'recorded',
        }),
      },
      {
        params: {
          expenseId: 10200006,
        },
        expected: expect.objectContaining({
          id: 10200006,
          StaffMemberId: 10110001,
          ExpenseCategoryId: 10000002,
          spentOn: '2026-08-05',
          amount: 5730,
          memo: null,
          status: 'recorded',
        }),
      },
      {
        params: {
          expenseId: 10200007,
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
          expenseId: 10200008,
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
          expenseId: 10200009,
        },
        expected: expect.objectContaining({
          id: 10200009,
          StaffMemberId: 10110001,
          ExpenseCategoryId: 10000001,
          spentOn: '2026-07-16',
          amount: 640,
          memo: 'taxi from the station in the rain',
          status: 'recorded',
        }),
      },
      {
        params: {
          expenseId: 10200010,
        },
        expected: expect.objectContaining({
          id: 10200010,
          StaffMemberId: 10110001,
          ExpenseCategoryId: 10000002,
          spentOn: '2026-08-13',
          amount: 2175,
          memo: 'team breakfast before the release',
          status: 'recorded',
        }),
      },
      {
        params: {
          expenseId: 10200011,
        },
        expected: expect.objectContaining({
          id: 10200011,
          StaffMemberId: 10110002,
          ExpenseCategoryId: 10000003,
          spentOn: '2026-08-27',
          amount: 4390,
          memo: 'replacement keyboard for the shared desk',
          status: 'recorded',
        }),
      },
      {
        params: {
          expenseId: 10200012,
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
      {
        params: {
          expenseId: 10200013,
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
      {
        params: {
          expenseId: 10200014,
        },
        expected: expect.objectContaining({
          id: 10200014,
          StaffMemberId: 10110002,
          ExpenseCategoryId: 10000002,
          spentOn: '2026-06-18',
          amount: 1860,
          memo: 'dinner with the visiting auditor',
          status: 'recorded',
        }),
      },
    ]

    test.each(cases)('expenseId: $params.expenseId', async ({
      params,
      expected,
    }) => {
      const actual = await Expense.findByPk(params.expenseId)

      expect(actual)
        .toEqual(expected)
    })
  })
})

/*
 * The id block. Two ids that collide cannot both be in the table -- `id` is the primary key, so the
 * second `bulkInsert` value would be refused and `db:refresh` would stop -- and the fourteen cases
 * above already fail if a row is missing. What no row-by-row read catches is an id from somebody
 * else's block, which is why the table is asked the opposite question here: is anything outside 102
 * in it?
 *
 * The whole table is in scope, not only the seeded rows, and that is deliberate. Every row the
 * product mints afterwards is auto-incremented from `max(id) + 1`, so it lands above 10200014 and
 * inside the same block; a row outside 102 therefore means an explicit id was written from a block
 * that is not this feature's.
 */
describe('expenses development seeder', () => {
  describe('should keep every row of the table inside the allocated id block', () => {
    test('to hold no row outside 102', async () => {
      const actual = await Expense.findAll({
        where: {
          id: {
            [Op.notBetween]: [
              10200000,
              10299999,
            ],
          },
        },
      })

      expect(actual)
        .toHaveLength(0)
    })
  })
})

/*
 * One member of staff, one date, one row -- still asserted, on a reason that has been replaced.
 *
 * It used to be that a tie-break between two rows of one member of staff on one date had never
 * been decided, so the fixture must not raise the question. Section 6's `entry order` row has
 * since decided it (Q61): newest `spent_on` first, and within a date the more recently recorded
 * first. The assertion stays, and stays absolute, for a reason of its own: these fourteen rows land
 * in a single `bulkInsert`, so a tie seeded here would carry a recording moment that never
 * happened and would pin an order the ids alone decide. The tie the product now owes an answer for
 * is made where recording order is real, through `recordExpense`, in
 * `tests/_orders/Expense/ExpensesQueryResolver.js`.
 *
 * Each count is capped at the last seeded id, so a row the product writes later -- which takes an
 * id above 10200014 -- cannot turn this red by happening to fall on a seeded date.
 */
describe('expenses development seeder', () => {
  describe('should give a member of staff no two rows on one date', () => {
    const cases = [
      {
        params: {
          staffMemberId: 10110001,
          spentOn: '2026-07-03',
          lastSeededId: 10200014,
        },
        expected: 1,
      },
      {
        params: {
          staffMemberId: 10110001,
          spentOn: '2026-08-21',
          lastSeededId: 10200014,
        },
        expected: 1,
      },
      {
        params: {
          staffMemberId: 10110001,
          spentOn: '2026-06-01',
          lastSeededId: 10200014,
        },
        expected: 1,
      },
      {
        params: {
          staffMemberId: 10110001,
          spentOn: '2026-09-02',
          lastSeededId: 10200014,
        },
        expected: 1,
      },
      {
        params: {
          staffMemberId: 10110001,
          spentOn: '2026-07-31',
          lastSeededId: 10200014,
        },
        expected: 1,
      },
      {
        params: {
          staffMemberId: 10110001,
          spentOn: '2026-08-05',
          lastSeededId: 10200014,
        },
        expected: 1,
      },
      {
        params: {
          staffMemberId: 10110001,
          spentOn: '2026-06-30',
          lastSeededId: 10200014,
        },
        expected: 1,
      },
      {
        params: {
          staffMemberId: 10110001,
          spentOn: '2026-09-09',
          lastSeededId: 10200014,
        },
        expected: 1,
      },
      {
        params: {
          staffMemberId: 10110001,
          spentOn: '2026-07-16',
          lastSeededId: 10200014,
        },
        expected: 1,
      },
      {
        params: {
          staffMemberId: 10110001,
          spentOn: '2026-08-13',
          lastSeededId: 10200014,
        },
        expected: 1,
      },
      {
        params: {
          staffMemberId: 10110002,
          spentOn: '2026-08-27',
          lastSeededId: 10200014,
        },
        expected: 1,
      },
      {
        params: {
          staffMemberId: 10110002,
          spentOn: '2026-07-09',
          lastSeededId: 10200014,
        },
        expected: 1,
      },
      {
        params: {
          staffMemberId: 10110002,
          spentOn: '2026-09-05',
          lastSeededId: 10200014,
        },
        expected: 1,
      },
      {
        params: {
          staffMemberId: 10110002,
          spentOn: '2026-06-18',
          lastSeededId: 10200014,
        },
        expected: 1,
      },
    ]

    test.each(cases)('spentOn: $params.spentOn', async ({
      params,
      expected,
    }) => {
      const actual = await Expense.count({
        where: {
          StaffMemberId: params.staffMemberId,
          spentOn: params.spentOn,
          id: {
            [Op.lte]: params.lastSeededId,
          },
        },
      })

      expect(actual)
        .toBe(expected)
    })
  })
})

/*
 * The references. The four category ids are the whole of the expense_categories master seeder and
 * the thirteen staff member ids are the whole of the staff_members development seeder, so a row
 * naming anything else names a row that does not exist. The question is asked in the negative
 * because that is the form a single assertion can answer for the whole table at once.
 */
describe('expenses development seeder', () => {
  describe('should point every row at a category the master seeder holds', () => {
    test('to hold no row naming another category', async () => {
      const actual = await Expense.findAll({
        where: {
          ExpenseCategoryId: {
            [Op.notIn]: [
              10000001,
              10000002,
              10000003,
              10000004,
            ],
          },
        },
      })

      expect(actual)
        .toHaveLength(0)
    })
  })
})

describe('expenses development seeder', () => {
  describe('should point every row at a member of staff the staff_members seeder holds', () => {
    test('to hold no row naming another member of staff', async () => {
      const actual = await Expense.findAll({
        where: {
          StaffMemberId: {
            [Op.notIn]: [
              10110001,
              10110002,
              10110003,
              10110004,
              10110005,
              10110006,
              10110007,
              10110008,
              10110009,
              10110010,
              10110011,
              10110012,
              10110013,
            ],
          },
        },
      })

      expect(actual)
        .toHaveLength(0)
    })
  })
})

/*
 * The scramble, which is the point of the dates rather than a side effect of them.
 *
 * Section 11 reads a member of staff's entries newest first. If the seeded dates happened to run in
 * the same order as the ids, a resolver that ordered by `id` -- or by `created_at`, which every row
 * here shares, having been written in one insert -- would return the right answer for the wrong
 * reason and the ordering test of the next checkpoint would pass while the code was wrong.
 *
 * This pins the fixture to an order that matches neither: newest first starts at 10200008, and the
 * first row differs from what ascending id and descending id would each put there. Re-dating a row
 * so that the two orders line up breaks this test, which is the warning it exists to give.
 */
describe('expenses development seeder', () => {
  describe('should date one member of staff rows out of step with their ids', () => {
    test('to read newest first in an order neither ascending nor descending id gives', async () => {
      const expected = [
        expect.objectContaining({
          id: 10200008,
          spentOn: '2026-09-09',
        }),
        expect.objectContaining({
          id: 10200004,
          spentOn: '2026-09-02',
        }),
        expect.objectContaining({
          id: 10200002,
          spentOn: '2026-08-21',
        }),
        expect.objectContaining({
          id: 10200010,
          spentOn: '2026-08-13',
        }),
        expect.objectContaining({
          id: 10200006,
          spentOn: '2026-08-05',
        }),
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
        expect.objectContaining({
          id: 10200007,
          spentOn: '2026-06-30',
        }),
        expect.objectContaining({
          id: 10200003,
          spentOn: '2026-06-01',
        }),
      ]

      const actual = await Expense.findAll({
        where: {
          StaffMemberId: 10110001,
          id: {
            [Op.lte]: 10200014,
          },
        },
        order: [
          ['spentOn', 'DESC'],
        ],
      })

      expect(actual)
        .toEqual(expected)
    })
  })
})

/*
 * The members of staff who recorded nothing. Section 11's list has to answer for an owner with no
 * entries at all, and eight of the thirteen seeded accounts are that case on purpose. Capped at the
 * last seeded id for the same reason as the count above: a row the product writes later must not
 * turn this red.
 */
describe('expenses development seeder', () => {
  describe('should leave a seeded member of staff who recorded nothing without a row', () => {
    const cases = [
      {
        params: {
          staffMemberId: 10110003,
          lastSeededId: 10200014,
        },
      },
      {
        params: {
          staffMemberId: 10110004,
          lastSeededId: 10200014,
        },
      },
      {
        params: {
          staffMemberId: 10110005,
          lastSeededId: 10200014,
        },
      },
      {
        params: {
          staffMemberId: 10110006,
          lastSeededId: 10200014,
        },
      },
      {
        params: {
          staffMemberId: 10110007,
          lastSeededId: 10200014,
        },
      },
      {
        params: {
          staffMemberId: 10110008,
          lastSeededId: 10200014,
        },
      },
      {
        params: {
          staffMemberId: 10110009,
          lastSeededId: 10200014,
        },
      },
      {
        params: {
          staffMemberId: 10110010,
          lastSeededId: 10200014,
        },
      },
    ]

    test.each(cases)('staffMemberId: $params.staffMemberId', async ({
      params,
    }) => {
      const actual = await Expense.findAll({
        where: {
          StaffMemberId: params.staffMemberId,
          id: {
            [Op.lte]: params.lastSeededId,
          },
        },
      })

      expect(actual)
        .toHaveLength(0)
    })
  })
})
