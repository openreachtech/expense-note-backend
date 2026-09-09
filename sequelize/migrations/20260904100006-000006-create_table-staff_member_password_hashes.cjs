'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'staff_member_password_hashes'
const COLUMN_NAME = {
  STAFF_MEMBER_ID: 'staff_member_id',
  PASSWORD_HASH: 'password_hash',
  SAVED_AT: 'saved_at',
}

// An index name is always built from the abbreviated column name.
const SHORT_COLUMN_NAME = {
  STAFF_MEMBER_ID: 'smi',
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
      passwordHash: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.PASSWORD_HASH,
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

    return Promise.resolve()
  },

  async down (
    queryInterface,
    Sequelize
  ) {
    return queryInterface.dropTable(TABLE_NAME)
  },
}
