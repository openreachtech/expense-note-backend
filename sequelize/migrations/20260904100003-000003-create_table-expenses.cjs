'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'expenses'
const COLUMN_NAME = {
  STAFF_MEMBER_ID: 'staff_member_id',
  EXPENSE_CATEGORY_ID: 'expense_category_id',
  SPENT_ON: 'spent_on',
  AMOUNT: 'amount',
  MEMO: 'memo',
  STATUS: 'status',
}

// Index names are always built from an abbreviated column name.
const SHORT_COLUMN_NAME = {
  STAFF_MEMBER_ID: 'smi',
  EXPENSE_CATEGORY_ID: 'eci',
  SPENT_ON: 'so',
}

module.exports = {
  async up (
    queryInterface,
    Sequelize
  ) {
    const factory = MigrationAttributeFactory.create(Sequelize)

    await queryInterface.createTable(TABLE_NAME, {
      ...factory.ID_BIGINT,

      // ForeignKey must start with upper case.
      StaffMemberId: {
        type: Sequelize.BIGINT,
        field: COLUMN_NAME.STAFF_MEMBER_ID,
        allowNull: false,
      },
      // ForeignKey must start with upper case. (integer, matching expense_categories.id)
      ExpenseCategoryId: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.EXPENSE_CATEGORY_ID,
        allowNull: false,
      },
      // The day the money was paid, not the day it was recorded. Meaning stops at the date.
      spentOn: {
        type: Sequelize.DATEONLY,
        field: COLUMN_NAME.SPENT_ON,
        allowNull: false,
      },
      // Yen. An integer, because the yen has no minor unit.
      amount: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.AMOUNT,
        allowNull: false,
      },
      memo: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.MEMO,
        allowNull: true,
      },
      // Holds 'recorded' for every row 1.0.0 writes. The seam approval is built on.
      status: {
        type: Sequelize.STRING(32),
        field: COLUMN_NAME.STATUS,
        allowNull: false,
      },

      ...factory.TIMESTAMPS,
    })

    // Every read of this table is scoped by its owner, so the 1:N foreign key is indexed.
    await queryInterface.addIndex(TABLE_NAME, [
      COLUMN_NAME.STAFF_MEMBER_ID,
    ], {
      name: [
        TABLE_NAME,
        SHORT_COLUMN_NAME.STAFF_MEMBER_ID,
        'index',
      ].join('_'),
    })

    await queryInterface.addIndex(TABLE_NAME, [
      COLUMN_NAME.EXPENSE_CATEGORY_ID,
    ], {
      name: [
        TABLE_NAME,
        SHORT_COLUMN_NAME.EXPENSE_CATEGORY_ID,
        'index',
      ].join('_'),
    })

    // One member of staff's month is the heaviest read this version has.
    await queryInterface.addIndex(TABLE_NAME, [
      COLUMN_NAME.STAFF_MEMBER_ID,
      COLUMN_NAME.SPENT_ON,
    ], {
      name: [
        TABLE_NAME,
        SHORT_COLUMN_NAME.STAFF_MEMBER_ID,
        SHORT_COLUMN_NAME.SPENT_ON,
        'index',
      ].join('_'),
    })

    return Promise.resolve()
  },

  async down (
    queryInterface,
    Sequelize
  ) {
    return queryInterface.dropTable(TABLE_NAME)
  },
}
