'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'sign_in_attempts'
const COLUMN_NAME = {
  EMAIL: 'email',
  ATTEMPTED_AT: 'attempted_at',
}

// Index names are always built from an abbreviated column name. A single-word name is
// already short enough to carry whole, so only attempted_at is abbreviated.
const SHORT_COLUMN_NAME = {
  EMAIL: 'email',
  ATTEMPTED_AT: 'aa',
}

module.exports = {
  async up (
    queryInterface,
    Sequelize
  ) {
    const factory = MigrationAttributeFactory.create(Sequelize)

    await queryInterface.createTable(TABLE_NAME, {
      ...factory.ID_BIGINT,

      // The address as presented, normalized the way staff_member_secrets normalizes its own.
      // Not a foreign key and not unique: an attempt on an address holding no account is
      // counted too, and the count cannot branch on whether the account exists.
      email: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.EMAIL,
        allowNull: false,
      },
      // A failed attempt only. A successful sign-in writes no row here.
      attemptedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.ATTEMPTED_AT,
        allowNull: false,
      },

      ...factory.TIMESTAMPS,
    })

    // The sign-in limit counts one address inside one window, reading both fields together
    // and neither alone, so the index is composite. Not unique: the same address failing
    // twice in the same millisecond is a thing to count, not a thing to reject.
    await queryInterface.addIndex(TABLE_NAME, [
      COLUMN_NAME.EMAIL,
      COLUMN_NAME.ATTEMPTED_AT,
    ], {
      name: [
        TABLE_NAME,
        SHORT_COLUMN_NAME.EMAIL,
        SHORT_COLUMN_NAME.ATTEMPTED_AT,
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
