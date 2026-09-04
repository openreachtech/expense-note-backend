'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'staff_member_secrets'
const COLUMN_NAME = {
  STAFF_MEMBER_ID: 'staff_member_id',
  EMAIL: 'email',
  SAVED_AT: 'saved_at',
}

const SHORT_COLUMN_NAME = {
  STAFF_MEMBER_ID: 'smi',
  EMAIL: 'email',
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
      email: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.EMAIL,
        allowNull: false,
      },
      savedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.SAVED_AT,
        allowNull: false,
      },

      ...factory.TIMESTAMPS,
    })

    // A 1:1 relation is enforced by a UNIQUE index (no DB FK).
    await queryInterface.addIndex(TABLE_NAME, [
      COLUMN_NAME.STAFF_MEMBER_ID,
    ], {
      unique: true,
      name: [
        TABLE_NAME,
        SHORT_COLUMN_NAME.STAFF_MEMBER_ID,
        'unique',
      ].join('_'),
    })

    // The sign-in identifier. Two members of staff may hold the same current
    // address in no circumstance, and only a UNIQUE index makes that true.
    await queryInterface.addIndex(TABLE_NAME, [
      COLUMN_NAME.EMAIL,
    ], {
      unique: true,
      name: [
        TABLE_NAME,
        SHORT_COLUMN_NAME.EMAIL,
        'unique',
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
