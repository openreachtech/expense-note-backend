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
   * constraint in this project, so the reference is verified here — on the three write paths
   * this model supports, not just the per-row one. `bulkCreate()` and the static `update()` both run with
   * `individualHooks: false`, so neither of them reaches `beforeSave`; a hook on that path alone
   * would let a bulk write name a member of staff or a category that does not exist. Each
   * existence read joins the caller's transaction, so a row written and referenced inside one
   * transaction is seen.
   *
   * **`upsert()` is not covered and is not supported here.** It runs `beforeUpsert` alone —
   * neither `beforeSave` nor either bulk hook — so a row written that way would bypass this
   * check entirely. Nothing calls it, and no operation exists to; adding a caller means adding
   * the hook first.
   *
   * @returns {void}
   */
  static setupHooks () {
    super.setupHooks?.()

    this.beforeSave(async (expense, options) => {
      await this.verifyStaffMember({
        staffMemberId: expense.StaffMemberId,
        transaction: options.transaction,
      })

      await this.verifyExpenseCategory({
        expenseCategoryId: expense.ExpenseCategoryId,
        transaction: options.transaction,
      })
    })

    this.beforeBulkCreate(async (expenses, options) => {
      await Promise.all(
        expenses.map(async expense => {
          await this.verifyStaffMember({
            staffMemberId: expense.StaffMemberId,
            transaction: options.transaction,
          })

          await this.verifyExpenseCategory({
            expenseCategoryId: expense.ExpenseCategoryId,
            transaction: options.transaction,
          })
        })
      )
    })

    this.beforeBulkUpdate(async options => {
      // A bulk update names only the fields it rewrites, so only a reference it actually
      // rewrites is verified. One it leaves alone was verified when the row was written.
      const attributes = options.attributes
        ?? {}
      const staffMemberId = attributes.StaffMemberId
        ?? null
      const expenseCategoryId = attributes.ExpenseCategoryId
        ?? null

      await this.verifyStaffMember({
        staffMemberId,
        transaction: options.transaction,
      })

      await this.verifyExpenseCategory({
        expenseCategoryId,
        transaction: options.transaction,
      })
    })
  }

  /**
   * Verify that the member of staff an expense names exists.
   *
   * The read joins the caller's transaction: a check reading outside it can refuse a row whose
   * owner does exist, having been written in the same transaction and not yet committed.
   *
   * @param {{
   *   staffMemberId: number
   *   transaction: import('sequelize').Transaction | null
   * }} params - Parameters.
   * @returns {Promise<void>}
   * @throws {Error} The named member of staff does not exist.
   */
  static async verifyStaffMember ({
    staffMemberId,
    transaction,
  }) {
    if (staffMemberId === null) {
      return
    }

    const staffMember = await this._.StaffMember.findByPk(staffMemberId, {
      transaction,
    })

    if (staffMember === null) {
      throw new Error(`Expense names a StaffMember that does not exist: ${staffMemberId}`)
    }
  }

  /**
   * Verify that the category an expense names exists.
   *
   * The read joins the caller's transaction, for the same reason the owner's does.
   *
   * @param {{
   *   expenseCategoryId: number
   *   transaction: import('sequelize').Transaction | null
   * }} params - Parameters.
   * @returns {Promise<void>}
   * @throws {Error} The named category does not exist.
   */
  static async verifyExpenseCategory ({
    expenseCategoryId,
    transaction,
  }) {
    if (expenseCategoryId === null) {
      return
    }

    const expenseCategory = await this._.ExpenseCategory.findByPk(expenseCategoryId, {
      transaction,
    })

    if (expenseCategory === null) {
      throw new Error(`Expense names an ExpenseCategory that does not exist: ${expenseCategoryId}`)
    }
  }
}
