'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'expense_categories'
const COLUMN_NAME = {
  NAME: 'name',
  DISPLAY_ORDER: 'display_order',
}

const SHORT_COLUMN_NAME = {
  NAME: 'name',
}

module.exports = {
  async up (
    queryInterface,
    Sequelize
  ) {
    const factory = MigrationAttributeFactory.create(Sequelize)

    await queryInterface.createTable(TABLE_NAME, {
      ...factory.ID_INTEGER,

      name: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.NAME,
        allowNull: false,
      },
      displayOrder: {
        type: Sequelize.INTEGER,
        field: COLUMN_NAME.DISPLAY_ORDER,
        allowNull: false,
      },

      ...factory.TIMESTAMPS,
    })

    // The name is the natural key of this master set, enforced by a UNIQUE index.
    await queryInterface.addIndex(TABLE_NAME, [
      COLUMN_NAME.NAME,
    ], {
      unique: true,
      name: [
        TABLE_NAME,
        SHORT_COLUMN_NAME.NAME,
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
