import {
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

/**
 * Expense model.
 *
 * One recorded payment, owned by the member of staff who recorded it.
 *
 * @class Expense
 * @augments {BaseAppRenchanModel}
 */
export default class Expense extends BaseAppRenchanModel {
  /**
   * Define model attributes.
   *
   * @param {import('sequelize').DataTypes} DataTypes - Sequelize DataTypes.
   * @returns {import('sequelize').ModelAttributes} Model attributes.
   */
  static createAttributes (DataTypes) {
    const factory = ModelAttributeFactory.create(DataTypes)

    return {
      ...factory.ID_BIGINT,

      // ForeignKey must start with upper case.
      StaffMemberId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      // ForeignKey must start with upper case. (integer, matching expense_categories.id)
      ExpenseCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // The day the money was paid, not the day it was recorded. Meaning stops at the date.
      spentOn: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      // Yen. An integer, because the yen has no minor unit.
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      memo: {
        type: DataTypes.STRING(191),
        allowNull: true,
      },
      // Holds 'recorded' for every row 1.0.0 writes. The seam approval is built on.
      status: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
    }
  }

  /**
   * Define model options.
   *
   * @param {import('sequelize').Sequelize} sequelizeClient - Sequelize instance.
   * @returns {import('sequelize').InitOptions} Model options.
   */
  static createOptions (sequelizeClient) {
    return {
      ...super.createOptions(sequelizeClient),
    }
  }

  /**
   * Define model associations.
   *
   * @returns {void}
   */
  static associate () {
    super.associate?.()

    this.belongsTo(this._.StaffMember)

    this.belongsTo(this._.ExpenseCategory)
  }

  /**
   * Define model scopes.
   *
   * @param {import('sequelize').Op} Op - Sequelize operators.
   * @returns {void}
   */
  static defineScopes (Op) {
    super.defineScopes?.(Op)

    // noop
  }

  /**
   * Define subqueries.
   *
   * @returns {void}
   */
  static defineSubqueries () {
    super.defineSubqueries?.()

    // noop
  }

  /**
   * Setup model hooks.
   *
   * Refuses a row whose owner or category does not exist. There is no database foreign-key
   * constraint in this project, so the reference is verified here, on the one write path every
   * create and every correction passes through. Each existence read joins the caller's
   * transaction, so a row written and referenced inside one transaction is seen.
   *
   * @returns {void}
   */
  static setupHooks () {
    super.setupHooks?.()

    this.beforeSave(async (expense, options) => {
      const staffMember = await this._.StaffMember.findByPk(expense.StaffMemberId, {
        transaction: options.transaction,
      })

      if (staffMember === null) {
        throw new Error(`Expense names a StaffMember that does not exist: ${expense.StaffMemberId}`)
      }

      const expenseCategory = await this._.ExpenseCategory.findByPk(expense.ExpenseCategoryId, {
        transaction: options.transaction,
      })

      if (expenseCategory === null) {
        throw new Error(`Expense names an ExpenseCategory that does not exist: ${expense.ExpenseCategoryId}`)
      }
    })
  }
}
