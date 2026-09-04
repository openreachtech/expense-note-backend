import {
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

import {
  env,
} from '../../app/globals/_.js'

import SessionCredentialGenerator from '../../app/session/SessionCredentialGenerator.js'

const DEFAULT_REFRESH_TOKEN_LIFETIME_DAYS = 14
const MILLISECONDS_PER_DAY = 86400000

/**
 * StaffMemberRefreshToken model.
 *
 * The long-lived half of a session's credential pair. Only the digest of the token is kept
 * (`tokenHash`), so a dump of this table is not a set of usable sessions: the plaintext is handed
 * back to the caller once, for the httpOnly cookie, and no column ever holds it.
 *
 * `sessionKey` is the series a rotation keeps. `usedAt` and `revokedAt` record two separate
 * facts — spent on a rotation, and revoked on sign-out or on a detected reuse — and neither is
 * derivable from the other, so neither column stands in for the other.
 *
 * @class StaffMemberRefreshToken
 * @augments {BaseAppRenchanModel}
 */
export default class StaffMemberRefreshToken extends BaseAppRenchanModel {
  /**
   * Define model attributes.
   *
   * @param {typeof import('sequelize').DataTypes} DataTypes - Sequelize DataTypes.
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
      tokenHash: {
        type: DataTypes.STRING(191),
        allowNull: false,
        unique: true, // the digest, never the token; the lookup key
      },
      sessionKey: {
        type: DataTypes.STRING(191),
        allowNull: false, // the series a rotation keeps
      },
      usedAt: {
        type: DataTypes.DATE(3),
        allowNull: true, // set when spent on a rotation
      },
      revokedAt: {
        type: DataTypes.DATE(3),
        allowNull: true, // set on sign-out or on a detected reuse
      },
      generatedAt: {
        type: DataTypes.DATE(3),
        allowNull: false,
      },
      expiredAt: {
        type: DataTypes.DATE(3),
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
  }

  /**
   * Define model scopes.
   *
   * @param {typeof import('sequelize').Op} Op - Sequelize operators.
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
   * This model takes no backup mixin, and the table has no `_bk` counterpart. A refresh token is
   * deleted or revoked, never rewritten, so there is no prior value to keep.
   *
   * @returns {void}
   */
  static setupHooks () {
    super.setupHooks?.()

    // noop
  }

  /**
   * get: SessionCredentialGenerator class — a seam so tests can substitute it.
   *
   * @returns {typeof SessionCredentialGenerator} The class.
   */
  static get SessionCredentialGeneratorCtor () {
    return SessionCredentialGenerator
  }

  /**
   * Build an unsaved row, generating the attributes the caller does not supply.
   *
   * The plain token arrives here and leaves as a digest: `tokenHash` is what is persisted, and
   * the plaintext stays the caller's to put in the cookie. `expiredAt` is derived from the
   * deployment's own lifetime unless the caller states one.
   *
   * @param {StaffMemberRefreshTokenGeneratedAttributesParams} params - Parameters.
   * @returns {StaffMemberRefreshToken} Unsaved refresh token row.
   * @public
   */
  static buildWithGeneratedAttributes ({
    userId,
    sessionKey,
    refreshToken,
    generatedAt,
    expiredAt = this.createExpiredAt({
      generatedAt,
    }),
  }) {
    const tokenHash = this.hashToken({
      token: refreshToken,
    })

    return /** @type {StaffMemberRefreshToken} */ (
      this.build({
        // ForeignKey must start with upper case.
        StaffMemberId: userId,
        tokenHash,
        sessionKey,
        usedAt: null,
        revokedAt: null,
        generatedAt,
        expiredAt,
      })
    )
  }

  /**
   * Digest a token, both to store it and to look it up.
   *
   * A lookup hashes what arrives and matches on the digest, so this one method decides the
   * algorithm for both directions.
   *
   * @param {{
   *   token: string
   * }} params - Parameters.
   * @returns {string} Digest, as lower case hex.
   * @public
   */
  static hashToken ({
    token,
  }) {
    const credentialGenerator = this.createCredentialGenerator()

    return credentialGenerator.hashToken({
      token,
    })
  }

  /**
   * Create the session credential generator.
   *
   * @returns {SessionCredentialGenerator} Session credential generator.
   */
  static createCredentialGenerator () {
    return this.SessionCredentialGeneratorCtor.create()
  }

  /**
   * Create the instant a token generated at the given instant stops being presentable.
   *
   * @param {{
   *   generatedAt: Date
   * }} params - Parameters.
   * @returns {Date} The instant the token expires.
   */
  static createExpiredAt ({
    generatedAt,
  }) {
    const lifetimeDays = this.generateLifetimeDays()
    const lifetimeMilliseconds = lifetimeDays * MILLISECONDS_PER_DAY

    return new Date(generatedAt.getTime() + lifetimeMilliseconds)
  }

  /**
   * Generate the number of days a refresh token stays presentable.
   *
   * The deployment's own `AUTH_REFRESH_TOKEN_TTL_DAYS` decides it. The default stands in only
   * where that variable is absent, zero, or unreadable as a number — the lifetime is never a
   * fixed fourteen days.
   *
   * @returns {number} Days.
   */
  static generateLifetimeDays () {
    const configuredDays = Number(env.AUTH_REFRESH_TOKEN_TTL_DAYS)

    if (!configuredDays) {
      return DEFAULT_REFRESH_TOKEN_LIFETIME_DAYS
    }

    return configuredDays
  }

  /**
   * Extract the id of the member of staff this token was issued to.
   *
   * Named for the actor-neutral concept, because the session clerk holds this model without
   * knowing whose table it is.
   *
   * @returns {number} Id of the owning member of staff.
   * @public
   */
  extractUserId () {
    return /** @type {number} */ (
      this.get('StaffMemberId')
    )
  }

  /**
   * Whether this token may still be presented at the given instant.
   *
   * The rules live here so a resolver never restates them.
   *
   * @param {{
   *   pointsAt: Date
   * }} params - Parameters.
   * @returns {boolean} true: the token is still presentable.
   * @public
   */
  isAvailable ({
    pointsAt,
  }) {
    return !this.isUsed()
      && !this.isRevoked()
      && !this.isExpired({
        pointsAt,
      })
  }

  /**
   * Whether this token has already been spent on a rotation.
   *
   * Presented again after that, it is a reuse. A fact of its own, kept apart from revocation.
   *
   * @returns {boolean} true: the token was spent.
   * @public
   */
  isUsed () {
    const usedAt = this.get('usedAt')
      ?? null

    return usedAt !== null
  }

  /**
   * Whether this token has been revoked.
   *
   * Set on sign-out, and on a detected reuse. A fact of its own, kept apart from being spent.
   *
   * @returns {boolean} true: the token was revoked.
   * @public
   */
  isRevoked () {
    const revokedAt = this.get('revokedAt')
      ?? null

    return revokedAt !== null
  }

  /**
   * Whether this token's life has run out by the given instant.
   *
   * The instant it expires counts as expired, so a token is never presentable at the very moment
   * its life ends.
   *
   * @param {{
   *   pointsAt: Date
   * }} params - Parameters.
   * @returns {boolean} true: the token has expired.
   * @public
   */
  isExpired ({
    pointsAt,
  }) {
    const expiredAt = /** @type {Date} */ (
      this.get('expiredAt')
    )

    return expiredAt.getTime() <= pointsAt.getTime()
  }
}

/**
 * @typedef {{
 *   userId: number
 *   sessionKey: string
 *   refreshToken: string
 *   generatedAt: Date
 *   expiredAt?: Date
 * }} StaffMemberRefreshTokenGeneratedAttributesParams
 */
