'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'staff_member_secrets_bk'
const COLUMN_NAME = {
  STAFF_MEMBER_ID: 'staff_member_id',
  EMAIL: 'email',
  SAVED_AT: 'saved_at',
}

const SHORT_COLUMN_NAME = {
  STAFF_MEMBER_ID: 'smi',
}

module.exports = {
  async up (
    queryInterface,
    Sequelize
  ) {
    const factory = MigrationAttributeFactory.create(Sequelize)

    // This table mirrors the columns of staff_member_secrets and adds nothing.
    // The backup mixin appends one generation per save, so neither the foreign
    // key nor the address is unique here: a UNIQUE index would cap the history
    // at one change per member of staff.
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

    // A 1:N relation is enforced by a plain index (no DB FK).
    await queryInterface.addIndex(TABLE_NAME, [
      COLUMN_NAME.STAFF_MEMBER_ID,
    ], {
      name: [
        TABLE_NAME,
        SHORT_COLUMN_NAME.STAFF_MEMBER_ID,
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
