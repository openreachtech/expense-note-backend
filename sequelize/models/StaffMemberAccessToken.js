import {
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

import SessionCredentialGenerator from '../../app/session/SessionCredentialGenerator.js'

const ACCESS_TOKEN_LIFETIME_MINUTES = 15
const MILLISECONDS_PER_MINUTE = 60 * 1000

/**
 * StaffMemberAccessToken model.
 *
 * The short-lived half of a session's token pair, sent on a request header. It holds its token in
 * the clear, where `StaffMemberRefreshToken` holds only a digest: the lifetime is what earns the
 * difference — a leaked dump of this table buys one fifteen-minute window, after which every row
 * in it is useless, and hashing would cost a digest on every single request for a window that
 * closes on its own.
 *
 * There is no `usedAt` and no `revokedAt` here. **The lifetime is the revocation**: an access
 * token that has passed `expiredAt` is deleted rather than flagged, and signing out deletes every
 * row sharing the series key. Nothing is ever rewritten, so the table takes no backup mixin.
 *
 * @class StaffMemberAccessToken
 * @augments {BaseAppRenchanModel}
 */
export default class StaffMemberAccessToken extends BaseAppRenchanModel {
  /**
   * Define model attributes.
   *
   * @param {typeof import('sequelize').DataTypes} DataTypes - Sequelize data types.
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
      accessToken: {
        type: DataTypes.STRING(191),
        allowNull: false,
        unique: true, // the lookup key; the real constraint is the migration's unique index
      },
      sessionKey: {
        type: DataTypes.STRING(191),
        allowNull: false, // the series signing out revokes by
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
   * Build an unsaved access token row, minting the token and deriving its expiry.
   *
   * The token is not handed in: this half of the pair has nothing to return to the browser, so the
   * model mints it and the saved row carries it.
   *
   * @param {{
   *   userId: number
   *   sessionKey: string
   *   generatedAt: Date
   *   expiredAt?: Date
   * }} params - Parameters.
   * @returns {StaffMemberAccessToken} Built entity, not yet saved.
   * @public
   */
  static buildWithGeneratedAttributes ({
    userId,
    sessionKey,
    generatedAt,
    expiredAt = this.createExpiredAt({
      generatedAt,
    }),
  }) {
    return this.build({
      StaffMemberId: userId,
      accessToken: this.generateAccessToken(),
      sessionKey,
      generatedAt,
      expiredAt,
    })
  }

  /**
   * Generate an access token.
   *
   * @returns {string} Access token, as lower case hex.
   */
  static generateAccessToken () {
    const credentialGenerator = this.createCredentialGenerator()

    return credentialGenerator.generateToken()
  }

  /**
   * Create session credential generator.
   *
   * @returns {SessionCredentialGenerator} Session credential generator.
   */
  static createCredentialGenerator () {
    return this.SessionCredentialGeneratorCtor.create()
  }

  /**
   * Create the instant this access token stops being accepted.
   *
   * Fifteen minutes after it was generated. The figure is this project's own decision and is not
   * read from the environment: a deployment that could lengthen it would be lengthening the window
   * that makes storing the token in the clear defensible.
   *
   * @param {{
   *   generatedAt: Date
   * }} params - Parameters.
   * @returns {Date} The instant this access token expires.
   */
  static createExpiredAt ({
    generatedAt,
  }) {
    const lifetimeMilliseconds = ACCESS_TOKEN_LIFETIME_MINUTES * MILLISECONDS_PER_MINUTE

    return new Date(generatedAt.getTime() + lifetimeMilliseconds)
  }

  /**
   * Extract the id of the member of staff this token was issued to.
   *
   * Named for the actor-neutral concept, so one session implementation serves every audience
   * without knowing which foreign key holds it.
   *
   * @returns {number} Id of the owning member of staff.
   * @public
   */
  extractUserId () {
    return this.get('StaffMemberId')
  }

  /**
   * Whether this access token may still authenticate a request.
   *
   * Expiry is the only thing that can stop it — there is no revocation flag on this table, because
   * a revoked access token is deleted.
   *
   * @param {{
   *   pointsAt: Date
   * }} params - Parameters.
   * @returns {boolean} Whether this access token is still available.
   * @public
   */
  isAvailable ({
    pointsAt,
  }) {
    return !this.isExpired({
      pointsAt,
    })
  }

  /**
   * Whether this access token has reached its expiry.
   *
   * @param {{
   *   pointsAt: Date
   * }} params - Parameters.
   * @returns {boolean} Whether the given instant is at or past the expiry.
   */
  isExpired ({
    pointsAt,
  }) {
    return this.get('expiredAt')
      .getTime() <= pointsAt.getTime()
  }
}
