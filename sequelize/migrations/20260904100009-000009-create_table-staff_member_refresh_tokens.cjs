'use strict'

const MigrationAttributeFactory = require('@openreachtech/renchan-sequelize/lib/tools/MigrationAttributeFactory.cjs')

const TABLE_NAME = 'staff_member_refresh_tokens'
const COLUMN_NAME = {
  STAFF_MEMBER_ID: 'staff_member_id',
  TOKEN_HASH: 'token_hash',
  SESSION_KEY: 'session_key',
  USED_AT: 'used_at',
  REVOKED_AT: 'revoked_at',
  GENERATED_AT: 'generated_at',
  EXPIRED_AT: 'expired_at',
}

// Index names are always built from an initialism, never from the full column name.
const SHORT_COLUMN_NAME = {
  STAFF_MEMBER_ID: 'smi',
  TOKEN_HASH: 'th',
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
      // The digest, never the token. A dump of this table is not a set of usable sessions.
      tokenHash: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.TOKEN_HASH,
        allowNull: false,
      },
      // The series a rotation keeps. Signing out revokes every row sharing it.
      sessionKey: {
        type: Sequelize.STRING(191),
        field: COLUMN_NAME.SESSION_KEY,
        allowNull: false,
      },
      // Spent on a rotation. A separate fact from revocation, so a separate column.
      usedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.USED_AT,
        allowNull: true,
      },
      // Revoked on sign-out, or on a detected reuse. A separate fact from being spent.
      revokedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.REVOKED_AT,
        allowNull: true,
      },
      generatedAt: {
        type: Sequelize.DATE(3),
        field: COLUMN_NAME.GENERATED_AT,
        allowNull: false,
      },
      // AUTH_REFRESH_TOKEN_TTL_DAYS after generated_at, the model deciding the value.
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

    // The lookup key. UNIQUE, so two refresh tokens cannot share a digest.
    await queryInterface.addIndex(TABLE_NAME, [
      COLUMN_NAME.TOKEN_HASH,
    ], {
      unique: true,
      name: [
        TABLE_NAME,
        SHORT_COLUMN_NAME.TOKEN_HASH,
        'unique',
      ].join('_'),
    })

    // Rotation and revocation query by series.
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
