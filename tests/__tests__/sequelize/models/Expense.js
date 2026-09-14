import {
  DataTypes,
} from 'sequelize'

import {
  PaginationMixinModel,
  RequestPagination,
} from '@openreachtech/renchan-sequelize'

import Expense from '../../../../sequelize/models/Expense.js'
import ExpenseCategory from '../../../../sequelize/models/ExpenseCategory.js'

import BaseAppRenchanModel from '../../../../sequelize/baseModel/BaseAppRenchanModel.js'

describe('Expense', () => {
  describe('super class', () => {
    test('to be instance of BaseAppRenchanModel', () => {
      const actual = Expense.prototype

      expect(actual)
        .toBeInstanceOf(BaseAppRenchanModel)
    })
  })
})

describe('Expense', () => {
  describe('.createAttributes()', () => {
    describe('should declare every business column of the table', () => {
      test('to hold the owner, the category, the date, the amount, the memo and the status', () => {
        const expected = {
          id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          StaffMemberId: {
            type: DataTypes.BIGINT,
            allowNull: false,
          },
          ExpenseCategoryId: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          spentOn: {
            type: DataTypes.DATEONLY,
            allowNull: false,
          },
          amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          memo: {
            type: DataTypes.STRING(191),
            allowNull: true,
          },
          status: {
            type: DataTypes.STRING(32),
            allowNull: false,
          },
        }

        const actual = Expense.createAttributes(DataTypes)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('Expense', () => {
  describe('.createOptions()', () => {
    describe('should add nothing to the shared model options', () => {
      test('to hold the base options with this model name', () => {
        const { sequelizeClient } = globalThis.sequelizeActivator
        const expected = {
          modelName: 'Expense',
          sequelize: sequelizeClient,
          syncOnAssociation: false,
          timestamps: true,
          underscored: true,
        }

        const actual = Expense.createOptions(sequelizeClient)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('Expense', () => {
  describe('.associate()', () => {
    describe('should belong to the two tables its foreign keys name', () => {
      const cases = [
        {
          params: {
            associationName: 'StaffMember',
          },
        },
        {
          params: {
            associationName: 'ExpenseCategory',
          },
        },
      ]

      test.each(cases)('associationName: $params.associationName', ({
        params,
      }) => {
        const actual = Expense.associations

        expect(actual)
          .toHaveProperty(params.associationName)
      })
    })
  })
})

describe('Expense', () => {
  describe('.get:Mixins', () => {
    test('should hold the pagination mixin', () => {
      const expected = [
        PaginationMixinModel,
      ]

      const actual = Expense.Mixins

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('Expense', () => {
  describe('.get:$', () => {
    describe('should compose the pagination mixin onto this model', () => {
      test('to reach the paginated finder through the mixin handler', () => {
        const expected = expect.any(Function)

        const actual = Expense.$

        expect(actual)
          .toHaveProperty('findAllWithPagination', expected)
      })
    })
  })
})

describe('Expense', () => {
  describe('.$.findAllWithPagination()', () => {
    describe('should report the total of the whole set rather than of the page', () => {
      const cases = [
        {
          params: {
            limit: 3,
            offset: 0,
            staffMemberId: 10110001,
          },
          expected: {
            pagination: expect.objectContaining({
              limit: 3,
              offset: 0,
              totalNumber: 10,
            }),
            records: [
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
            ],
          },
        },
        {
          params: {
            limit: 3,
            offset: 9,
            staffMemberId: 10110001,
          },
          expected: {
            pagination: expect.objectContaining({
              limit: 3,
              offset: 9,
              totalNumber: 10,
            }),
            records: [
              expect.objectContaining({
                id: 10200003,
                spentOn: '2026-06-01',
              }),
            ],
          },
        },
        {
          params: {
            limit: 2,
            offset: 3,
            staffMemberId: 10110002,
          },
          expected: {
            pagination: expect.objectContaining({
              limit: 2,
              offset: 3,
              totalNumber: 4,
            }),
            records: [
              expect.objectContaining({
                id: 10200014,
                spentOn: '2026-06-18',
              }),
            ],
          },
        },
      ]

      test.each(cases)('offset: $params.offset', async ({
        params,
        expected,
      }) => {
        const pagination = RequestPagination.create({
          limit: params.limit,
          offset: params.offset,
        })

        const actual = await Expense.$.findAllWithPagination({
          pagination,
          options: {
            where: {
              StaffMemberId: params.staffMemberId,
            },
            order: [
              ['spentOn', 'DESC'],
            ],
          },
        })

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('Expense', () => {
  describe('.$.findAllWithPagination()', () => {
    describe('should count each expense once when the category is included', () => {
      const cases = [
        {
          params: {
            limit: 3,
            offset: 0,
            staffMemberId: 10110001,
          },
          expected: {
            pagination: expect.objectContaining({
              limit: 3,
              offset: 0,
              totalNumber: 10,
            }),
            records: [
              expect.objectContaining({
                id: 10200008,
                ExpenseCategoryId: 10000004,
              }),
              expect.objectContaining({
                id: 10200004,
                ExpenseCategoryId: 10000004,
              }),
              expect.objectContaining({
                id: 10200002,
                ExpenseCategoryId: 10000002,
              }),
            ],
          },
        },
        {
          params: {
            limit: 3,
            offset: 0,
            staffMemberId: 10110002,
          },
          expected: {
            pagination: expect.objectContaining({
              limit: 3,
              offset: 0,
              totalNumber: 4,
            }),
            records: [
              expect.objectContaining({
                id: 10200013,
                ExpenseCategoryId: 10000001,
              }),
              expect.objectContaining({
                id: 10200011,
                ExpenseCategoryId: 10000003,
              }),
              expect.objectContaining({
                id: 10200012,
                ExpenseCategoryId: 10000004,
              }),
            ],
          },
        },
      ]

      test.each(cases)('staffMemberId: $params.staffMemberId', async ({
        params,
        expected,
      }) => {
        const pagination = RequestPagination.create({
          limit: params.limit,
          offset: params.offset,
        })

        const actual = await Expense.$.findAllWithPagination({
          pagination,
          options: {
            where: {
              StaffMemberId: params.staffMemberId,
            },
            include: [
              ExpenseCategory,
            ],
            order: [
              ['spentOn', 'DESC'],
            ],
          },
        })

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
