import Expense from '../../../sequelize/models/Expense.js'
import ExpenseCategory from '../../../sequelize/models/ExpenseCategory.js'
import StaffMember from '../../../sequelize/models/StaffMember.js'

import EXPENSE_STATUS_CONSTANT_HASH from '../../../app/constants/expenseStatusConstants.js'

describe('Expense', () => {
  describe('.create()', () => {
    describe('should save a row naming an owner and a category that both exist', () => {
      const cases = [
        {
          params: {
            StaffMemberId: 10000310,
            ExpenseCategoryId: 10000311,
            spentOn: '2026-09-01',
            amount: 1200,
            memo: 'train fare to the client',
            status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
          },
          expected: expect.objectContaining({
            StaffMemberId: 10000310,
            ExpenseCategoryId: 10000311,
            spentOn: '2026-09-01',
            amount: 1200,
            memo: 'train fare to the client',
            status: 'recorded',
          }),
        },
        {
          params: {
            StaffMemberId: 10000312,
            ExpenseCategoryId: 10000313,
            spentOn: '2026-08-31',
            amount: 4800,
            memo: null,
            status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
          },
          expected: expect.objectContaining({
            StaffMemberId: 10000312,
            ExpenseCategoryId: 10000313,
            spentOn: '2026-08-31',
            amount: 4800,
            memo: null,
            status: 'recorded',
          }),
        },
      ]

      test.each(cases)('amount: $params.amount', async ({
        params,
        expected,
      }) => {
        await StaffMember.create({
          id: params.StaffMemberId,
          name: `staff member ${params.StaffMemberId}`,
        })
        await ExpenseCategory.create({
          id: params.ExpenseCategoryId,
          name: `expense category ${params.ExpenseCategoryId}`,
          displayOrder: 1,
        })

        const actual = await Expense.create(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('Expense', () => {
  describe('.create()', () => {
    describe('should refuse a row naming a member of staff who does not exist', () => {
      const cases = [
        {
          params: {
            StaffMemberId: 10009990,
            ExpenseCategoryId: 10000320,
            spentOn: '2026-09-02',
            amount: 900,
            memo: null,
            status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
          },
          expected: 'Expense names a StaffMember that does not exist: 10009990',
        },
        {
          params: {
            StaffMemberId: 10009991,
            ExpenseCategoryId: 10000321,
            spentOn: '2026-09-03',
            amount: 3400,
            memo: 'a lunch nobody owns',
            status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
          },
          expected: 'Expense names a StaffMember that does not exist: 10009991',
        },
      ]

      test.each(cases)('StaffMemberId: $params.StaffMemberId', async ({
        params,
        expected,
      }) => {
        await ExpenseCategory.create({
          id: params.ExpenseCategoryId,
          name: `expense category ${params.ExpenseCategoryId}`,
          displayOrder: 2,
        })

        const actual = () => Expense.create(params)

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('Expense', () => {
  describe('.create()', () => {
    describe('should refuse a row naming a category that does not exist', () => {
      const cases = [
        {
          params: {
            StaffMemberId: 10000330,
            ExpenseCategoryId: 10009992,
            spentOn: '2026-09-04',
            amount: 760,
            memo: null,
            status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
          },
          expected: 'Expense names an ExpenseCategory that does not exist: 10009992',
        },
        {
          params: {
            StaffMemberId: 10000331,
            ExpenseCategoryId: 10009993,
            spentOn: '2026-09-05',
            amount: 15000,
            memo: 'supplies charged to no category',
            status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
          },
          expected: 'Expense names an ExpenseCategory that does not exist: 10009993',
        },
      ]

      test.each(cases)('ExpenseCategoryId: $params.ExpenseCategoryId', async ({
        params,
        expected,
      }) => {
        await StaffMember.create({
          id: params.StaffMemberId,
          name: `staff member ${params.StaffMemberId}`,
        })

        const actual = () => Expense.create(params)

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('Expense', () => {
  describe('.create()', () => {
    describe('should refuse a row missing one of its required fields', () => {
      const cases = [
        {
          label: 'no StaffMemberId',
          params: {
            // StaffMemberId: null
            ExpenseCategoryId: 10000341,
            spentOn: '2026-09-06',
            amount: 500,
            memo: null,
            status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
          },
          expected: 'Expense.StaffMemberId cannot be null',
        },
        {
          label: 'no ExpenseCategoryId',
          params: {
            StaffMemberId: 10000340,
            // ExpenseCategoryId: null
            spentOn: '2026-09-07',
            amount: 600,
            memo: null,
            status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
          },
          expected: 'Expense.ExpenseCategoryId cannot be null',
        },
        {
          label: 'no spentOn',
          params: {
            StaffMemberId: 10000340,
            ExpenseCategoryId: 10000341,
            // spentOn: null
            amount: 700,
            memo: null,
            status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
          },
          expected: 'Expense.spentOn cannot be null',
        },
        {
          label: 'no amount',
          params: {
            StaffMemberId: 10000340,
            ExpenseCategoryId: 10000341,
            spentOn: '2026-09-08',
            // amount: null
            memo: null,
            status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
          },
          expected: 'Expense.amount cannot be null',
        },
        {
          label: 'no status',
          params: {
            StaffMemberId: 10000340,
            ExpenseCategoryId: 10000341,
            spentOn: '2026-09-09',
            amount: 800,
            memo: null,
            // status: null
          },
          expected: 'Expense.status cannot be null',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
        expected,
      }) => {
        const actual = () => Expense.create(params)

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('Expense', () => {
  describe('#update()', () => {
    describe('should refuse a correction moving the row to a category that does not exist', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10000250,
            expenseCategoryId: 10000251,
            ExpenseCategoryId: 10009994,
          },
          expected: 'Expense names an ExpenseCategory that does not exist: 10009994',
        },
        {
          params: {
            staffMemberId: 10000252,
            expenseCategoryId: 10000253,
            ExpenseCategoryId: 10009995,
          },
          expected: 'Expense names an ExpenseCategory that does not exist: 10009995',
        },
      ]

      test.each(cases)('ExpenseCategoryId: $params.ExpenseCategoryId', async ({
        params,
        expected,
      }) => {
        await StaffMember.create({
          id: params.staffMemberId,
          name: `staff member correcting ${params.ExpenseCategoryId}`,
        })
        await ExpenseCategory.create({
          id: params.expenseCategoryId,
          name: `expense category corrected from ${params.ExpenseCategoryId}`,
          displayOrder: 3,
        })
        const expense = await Expense.create({
          StaffMemberId: params.staffMemberId,
          ExpenseCategoryId: params.expenseCategoryId,
          spentOn: '2026-09-10',
          amount: 12000,
          memo: null,
          status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
        })

        const actual = () => expense.update(params)

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('Expense', () => {
  describe('.bulkCreate()', () => {
    describe('should save a batch whose owners and categories all exist', () => {
      const cases = [
        {
          params: {
            records: [
              {
                StaffMemberId: 10000350,
                ExpenseCategoryId: 10000351,
                spentOn: '2026-09-11',
                amount: 2100,
                memo: 'first fare of the accepted batch',
                status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
              },
              {
                StaffMemberId: 10000350,
                ExpenseCategoryId: 10000351,
                spentOn: '2026-09-12',
                amount: 2200,
                memo: 'second fare of the accepted batch',
                status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
              },
            ],
          },
          expected: expect.arrayContaining([
            expect.objectContaining({
              StaffMemberId: 10000350,
              ExpenseCategoryId: 10000351,
              amount: 2100,
              memo: 'first fare of the accepted batch',
            }),
            expect.objectContaining({
              StaffMemberId: 10000350,
              ExpenseCategoryId: 10000351,
              amount: 2200,
              memo: 'second fare of the accepted batch',
            }),
          ]),
        },
        {
          params: {
            records: [
              {
                StaffMemberId: 10000352,
                ExpenseCategoryId: 10000353,
                spentOn: '2026-09-13',
                amount: 3100,
                memo: 'first meal of the accepted batch',
                status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
              },
              {
                StaffMemberId: 10000352,
                ExpenseCategoryId: 10000353,
                spentOn: '2026-09-14',
                amount: 3200,
                memo: 'second meal of the accepted batch',
                status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
              },
            ],
          },
          expected: expect.arrayContaining([
            expect.objectContaining({
              StaffMemberId: 10000352,
              ExpenseCategoryId: 10000353,
              amount: 3100,
              memo: 'first meal of the accepted batch',
            }),
            expect.objectContaining({
              StaffMemberId: 10000352,
              ExpenseCategoryId: 10000353,
              amount: 3200,
              memo: 'second meal of the accepted batch',
            }),
          ]),
        },
      ]

      test.each(cases)('records[0].amount: $params.records.0.amount', async ({
        params,
        expected,
      }) => {
        await StaffMember.create({
          id: params.records[0].StaffMemberId,
          name: `staff member filing a batch ${params.records[0].StaffMemberId}`,
        })
        await ExpenseCategory.create({
          id: params.records[0].ExpenseCategoryId,
          name: `expense category of a batch ${params.records[0].ExpenseCategoryId}`,
          displayOrder: 4,
        })

        const actual = await Expense.bulkCreate(params.records)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('Expense', () => {
  describe('.bulkCreate()', () => {
    describe('should refuse a batch naming a member of staff who does not exist', () => {
      const cases = [
        {
          params: {
            records: [
              {
                StaffMemberId: 10000354,
                ExpenseCategoryId: 10000355,
                spentOn: '2026-09-15',
                amount: 4100,
                memo: 'the owned row of a refused batch',
                status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
              },
              {
                StaffMemberId: 10009970,
                ExpenseCategoryId: 10000355,
                spentOn: '2026-09-16',
                amount: 4200,
                memo: 'the unowned row of a refused batch',
                status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
              },
            ],
          },
          expected: 'Expense names a StaffMember that does not exist: 10009970',
        },
        {
          params: {
            records: [
              {
                StaffMemberId: 10000356,
                ExpenseCategoryId: 10000357,
                spentOn: '2026-09-17',
                amount: 5100,
                memo: 'the owned row of a second refused batch',
                status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
              },
              {
                StaffMemberId: 10009971,
                ExpenseCategoryId: 10000357,
                spentOn: '2026-09-18',
                amount: 5200,
                memo: 'the unowned row of a second refused batch',
                status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
              },
            ],
          },
          expected: 'Expense names a StaffMember that does not exist: 10009971',
        },
      ]

      test.each(cases)('records[1].StaffMemberId: $params.records.1.StaffMemberId', async ({
        params,
        expected,
      }) => {
        await StaffMember.create({
          id: params.records[0].StaffMemberId,
          name: `staff member of a refused batch ${params.records[0].StaffMemberId}`,
        })
        await ExpenseCategory.create({
          id: params.records[0].ExpenseCategoryId,
          name: `expense category of a refused batch ${params.records[0].ExpenseCategoryId}`,
          displayOrder: 5,
        })

        const actual = () => Expense.bulkCreate(params.records)

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('Expense', () => {
  describe('.bulkCreate()', () => {
    describe('should refuse a batch naming a category that does not exist', () => {
      const cases = [
        {
          params: {
            records: [
              {
                StaffMemberId: 10000358,
                ExpenseCategoryId: 10000359,
                spentOn: '2026-09-19',
                amount: 6100,
                memo: 'the classified row of a refused batch',
                status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
              },
              {
                StaffMemberId: 10000358,
                ExpenseCategoryId: 10009972,
                spentOn: '2026-09-20',
                amount: 6200,
                memo: 'the unclassified row of a refused batch',
                status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
              },
            ],
          },
          expected: 'Expense names an ExpenseCategory that does not exist: 10009972',
        },
        {
          params: {
            records: [
              {
                StaffMemberId: 10000360,
                ExpenseCategoryId: 10000361,
                spentOn: '2026-09-21',
                amount: 7100,
                memo: 'the classified row of a second refused batch',
                status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
              },
              {
                StaffMemberId: 10000360,
                ExpenseCategoryId: 10009973,
                spentOn: '2026-09-22',
                amount: 7200,
                memo: 'the unclassified row of a second refused batch',
                status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
              },
            ],
          },
          expected: 'Expense names an ExpenseCategory that does not exist: 10009973',
        },
      ]

      test.each(cases)('records[1].ExpenseCategoryId: $params.records.1.ExpenseCategoryId', async ({
        params,
        expected,
      }) => {
        await StaffMember.create({
          id: params.records[0].StaffMemberId,
          name: `staff member of an unclassified batch ${params.records[0].StaffMemberId}`,
        })
        await ExpenseCategory.create({
          id: params.records[0].ExpenseCategoryId,
          name: `expense category of an unclassified batch ${params.records[0].ExpenseCategoryId}`,
          displayOrder: 6,
        })

        const actual = () => Expense.bulkCreate(params.records)

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('Expense', () => {
  describe('.update()', () => {
    describe('should refuse a bulk correction moving rows to a member of staff who does not exist', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10000220,
            expenseCategoryId: 10000221,
            expenseId: 10000222,
            values: {
              StaffMemberId: 10009974,
            },
          },
          expected: 'Expense names a StaffMember that does not exist: 10009974',
        },
        {
          params: {
            staffMemberId: 10000223,
            expenseCategoryId: 10000224,
            expenseId: 10000225,
            values: {
              StaffMemberId: 10009975,
            },
          },
          expected: 'Expense names a StaffMember that does not exist: 10009975',
        },
      ]

      test.each(cases)('values.StaffMemberId: $params.values.StaffMemberId', async ({
        params,
        expected,
      }) => {
        await StaffMember.create({
          id: params.staffMemberId,
          name: `staff member owning row ${params.expenseId}`,
        })
        await ExpenseCategory.create({
          id: params.expenseCategoryId,
          name: `expense category of row ${params.expenseId}`,
          displayOrder: 7,
        })
        await Expense.create({
          id: params.expenseId,
          StaffMemberId: params.staffMemberId,
          ExpenseCategoryId: params.expenseCategoryId,
          spentOn: '2026-09-23',
          amount: 8100,
          memo: null,
          status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
        })

        const actual = () => Expense.update(params.values, {
          where: {
            id: params.expenseId,
          },
        })

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('Expense', () => {
  describe('.update()', () => {
    describe('should refuse a bulk correction moving rows to a category that does not exist', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10000230,
            expenseCategoryId: 10000231,
            expenseId: 10000232,
            values: {
              ExpenseCategoryId: 10009976,
            },
          },
          expected: 'Expense names an ExpenseCategory that does not exist: 10009976',
        },
        {
          params: {
            staffMemberId: 10000233,
            expenseCategoryId: 10000234,
            expenseId: 10000235,
            values: {
              ExpenseCategoryId: 10009977,
            },
          },
          expected: 'Expense names an ExpenseCategory that does not exist: 10009977',
        },
      ]

      test.each(cases)('values.ExpenseCategoryId: $params.values.ExpenseCategoryId', async ({
        params,
        expected,
      }) => {
        await StaffMember.create({
          id: params.staffMemberId,
          name: `staff member owning reclassified row ${params.expenseId}`,
        })
        await ExpenseCategory.create({
          id: params.expenseCategoryId,
          name: `expense category of reclassified row ${params.expenseId}`,
          displayOrder: 8,
        })
        await Expense.create({
          id: params.expenseId,
          StaffMemberId: params.staffMemberId,
          ExpenseCategoryId: params.expenseCategoryId,
          spentOn: '2026-09-24',
          amount: 9100,
          memo: null,
          status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
        })

        const actual = () => Expense.update(params.values, {
          where: {
            id: params.expenseId,
          },
        })

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('Expense', () => {
  describe('.update()', () => {
    describe('should allow a bulk correction that names neither reference', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10000240,
            expenseCategoryId: 10000241,
            expenseId: 10000242,
            values: {
              amount: 10100,
            },
          },
          expected: [
            1,
          ],
        },
        {
          params: {
            staffMemberId: 10000243,
            expenseCategoryId: 10000244,
            expenseId: 10000245,
            values: {
              amount: 10200,
            },
          },
          expected: [
            1,
          ],
        },
      ]

      test.each(cases)('values.amount: $params.values.amount', async ({
        params,
        expected,
      }) => {
        await StaffMember.create({
          id: params.staffMemberId,
          name: `staff member owning corrected row ${params.expenseId}`,
        })
        await ExpenseCategory.create({
          id: params.expenseCategoryId,
          name: `expense category of corrected row ${params.expenseId}`,
          displayOrder: 9,
        })
        await Expense.create({
          id: params.expenseId,
          StaffMemberId: params.staffMemberId,
          ExpenseCategoryId: params.expenseCategoryId,
          spentOn: '2026-09-25',
          amount: 11000,
          memo: null,
          status: EXPENSE_STATUS_CONSTANT_HASH.EXPENSE_STATUS.RECORDED,
        })

        const actual = await Expense.update(params.values, {
          where: {
            id: params.expenseId,
          },
        })

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
