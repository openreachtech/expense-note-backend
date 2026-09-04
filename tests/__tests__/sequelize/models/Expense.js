import {
  DataTypes,
} from 'sequelize'

import Expense from '../../../../sequelize/models/Expense.js'

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
