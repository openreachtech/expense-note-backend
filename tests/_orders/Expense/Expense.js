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
            ExpenseCategoryId: 10009994,
          },
          expected: 'Expense names an ExpenseCategory that does not exist: 10009994',
        },
        {
          params: {
            ExpenseCategoryId: 10009995,
          },
          expected: 'Expense names an ExpenseCategory that does not exist: 10009995',
        },
      ]

      test.each(cases)('ExpenseCategoryId: $params.ExpenseCategoryId', async ({
        params,
        expected,
      }) => {
        const staffMember = await StaffMember.create({
          // id: left to auto-increment, since no case field names it
          name: `staff member correcting ${params.ExpenseCategoryId}`,
        })
        const expenseCategory = await ExpenseCategory.create({
          // id: left to auto-increment, since no case field names it
          name: `expense category corrected from ${params.ExpenseCategoryId}`,
          displayOrder: 3,
        })
        const expense = await Expense.create({
          StaffMemberId: staffMember.id,
          ExpenseCategoryId: expenseCategory.id,
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
