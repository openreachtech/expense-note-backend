'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'staff_members'
const COLUMN_NAME = {
  NAME: 'name',
}

module.exports = {
  async up (
    queryInterface,
    Sequelize
  ) {
    const factory = MigrationAttributeFactory.create(Sequelize)

    await queryInterface.createTable(TABLE_NAME, {
      ...factory.ID_BIGINT,

      name: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.NAME,
        allowNull: false,
      },

      ...factory.TIMESTAMPS,
    })

    // No index beyond the primary key. This table holds no foreign key, and nothing is
    // looked up by name: the sign-in identifier lives in staff_member_secrets, which
    // carries the unique index that identifies a member of staff.
    return Promise.resolve()
  },

  async down (
    queryInterface,
    Sequelize
  ) {
    return queryInterface.dropTable(TABLE_NAME)
  },
}
