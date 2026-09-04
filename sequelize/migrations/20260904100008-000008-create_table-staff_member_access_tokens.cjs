'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'staff_member_access_tokens'
const COLUMN_NAME = {
  STAFF_MEMBER_ID: 'staff_member_id',
  ACCESS_TOKEN: 'access_token',
  SESSION_KEY: 'session_key',
  GENERATED_AT: 'generated_at',
  EXPIRED_AT: 'expired_at',
}

// Index names are always built from an initialism, never from the full column name.
const SHORT_COLUMN_NAME = {
  STAFF_MEMBER_ID: 'smi',
  ACCESS_TOKEN: 'at',
  SESSION_KEY: 'sk',
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
      accessToken: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.ACCESS_TOKEN,
        allowNull: false,
      },
      sessionKey: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.SESSION_KEY,
        allowNull: false,
      },
      generatedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.GENERATED_AT,
        allowNull: false,
      },
      expiredAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.EXPIRED_AT,
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

    // The access token is the lookup key, so a duplicate must be impossible.
    await queryInterface.addIndex(TABLE_NAME, [
      COLUMN_NAME.ACCESS_TOKEN,
    ], {
      unique: true,
      name: [
        TABLE_NAME,
        SHORT_COLUMN_NAME.ACCESS_TOKEN,
        'unique',
      ].join('_'),
    })

    // Revocation queries the whole series, so the series key is indexed.
    await queryInterface.addIndex(TABLE_NAME, [
      COLUMN_NAME.SESSION_KEY,
    ], {
      name: [
        TABLE_NAME,
        SHORT_COLUMN_NAME.SESSION_KEY,
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
