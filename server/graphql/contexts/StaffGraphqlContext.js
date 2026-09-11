import SessionClerk from '../../../app/session/SessionClerk.js'

import StaffMember from '../../../sequelize/models/StaffMember.js'
import StaffMemberAccessToken from '../../../sequelize/models/StaffMemberAccessToken.js'
import StaffMemberRefreshToken from '../../../sequelize/models/StaffMemberRefreshToken.js'

import BaseAppGraphqlContext from './BaseAppGraphqlContext.js'

/**
 * Staff GraphQL context.
 *
 * Per-request state of the staff audience, and a plain DTO: `canResolve()` /
 * `hasAuthenticated()` / `hasAuthorized()` / `hasSchemaPermission()` are not declared here. They
 * are inherited and answer from `this.visa`, which is built from the engine's `visaIssuers` — so
 * authentication policy is tuned on `StaffGraphqlServerEngine`, never in this class. Cookie
 * reading and writing likewise belong to `RefreshTokenExpressCookieClerk`.
 *
 * @augments {BaseAppGraphqlContext}
 */
export default class StaffGraphqlContext extends BaseAppGraphqlContext {
  /**
   * get: SessionClerk class — a seam so tests can substitute it.
   *
   * @returns {typeof SessionClerk} The class.
   */
  static get SessionClerkCtor () {
    return SessionClerk
  }

  /**
   * get: StaffMember model — a seam so tests can substitute it.
   *
   * @returns {typeof StaffMember} The model.
   */
  static get StaffMemberCtor () {
    return StaffMember
  }

  /**
   * get: StaffMemberAccessToken model — a seam so tests can substitute it.
   *
   * @returns {typeof StaffMemberAccessToken} The model.
   */
  static get StaffMemberAccessTokenCtor () {
    return StaffMemberAccessToken
  }

  /**
   * get: StaffMemberRefreshToken model — a seam so tests can substitute it.
   *
   * @returns {typeof StaffMemberRefreshToken} The model.
   */
  static get StaffMemberRefreshTokenCtor () {
    return StaffMemberRefreshToken
  }

  /**
   * Find the member of staff a request's access token belongs to.
   *
   * The framework calls this on **every** request — including the operations
   * `schemasToSkipFiltering` exempts — and publishes what it returns as `#userEntity`, hence as
   * `#staffMember` and `#staffMemberId` below. A request that carried no access token is therefore
   * answered before anything is read: `signIn` has no token to look up and must not pay for a
   * query to learn it.
   *
   * **What comes back is the member of staff, not the access token row.** The framework derives
   * `#userId` as `userEntity.id`, so returning the token row would quietly publish the *token's*
   * id as `#staffMemberId`, and every resolver reading the signed-in caller's id would name the
   * wrong row while still looking like it worked. The token is read for the id it carries
   * (`#extractUserId()`) and for nothing else.
   *
   * The lookup goes through `SessionClerk`, this project's single window on session data, whose
   * `#findAvailableAccessToken()` refuses a row past its fifteen minutes (spec section 9.6). The
   * expiry rule is not restated here, and this class never queries the token tables itself — one
   * door on them, not two.
   *
   * Every refusal is a bare `null`. Nothing is logged and nothing is returned that could carry a
   * token, a digest or an address (spec section 7).
   *
   * @override
   * @param {{
   *   expressRequest: ExpressType.Request
   *   accessToken: string | null
   *   requestedAt: Date
   * }} params - Parameters of this method.
   * @returns {Promise<renchan.UserEntity | null>} Member of staff holding the access token, or null when the token matches no live session.
   */
  static async findUser ({
    expressRequest,
    accessToken,
    requestedAt,
  }) {
    if (!accessToken) {
      return null
    }

    const sessionClerk = this.createSessionClerk()

    const accessTokenEntity = await sessionClerk.findAvailableAccessToken({
      accessToken,
      pointsAt: requestedAt,
    })

    if (!accessTokenEntity) {
      return null
    }

    return this.findStaffMember({
      staffMemberId: accessTokenEntity.extractUserId(),
    })
  }

  /**
   * Create the session clerk this audience reads its sessions through.
   *
   * Both token models are handed over, not only the one `#findUser()` reads: the clerk is
   * audience-neutral and holds the pair, so the staff audience is the pair it is given.
   *
   * @returns {SessionClerk} Session clerk over the staff token tables.
   */
  static createSessionClerk () {
    return this.SessionClerkCtor.create({
      AccessTokenModel: this.StaffMemberAccessTokenCtor,
      RefreshTokenModel: this.StaffMemberRefreshTokenCtor,
    })
  }

  /**
   * Find the member of staff an id names.
   *
   * Reading `staff_members` from here is not a second door onto the session tables — the clerk
   * deliberately holds the two token models and nothing else, and this is the profile table.
   *
   * Null when the id names nobody, which a live token can still do: the tables carry no DB-level
   * foreign-key constraint, so a token can outlive the row it points at.
   *
   * @param {{
   *   staffMemberId: number
   * }} params - Parameters of this method.
   * @returns {Promise<renchan.UserEntity | null>} Member of staff, or null when the id names nobody.
   */
  static async findStaffMember ({
    staffMemberId,
  }) {
    const entity = /** @type {renchan.UserEntity | null} */ (
      await this.StaffMemberCtor.findByPk(staffMemberId)
    )

    return entity
      ?? null
  }

  /**
   * get: Member of staff of this request.
   *
   * An alias of `#userEntity`, so a resolver names the actor rather than the framework's generic
   * term. Null on a request that carried no live access token.
   *
   * @returns {renchan.UserEntity | null} Member of staff entity.
   * @example
   * ```js
   * async resolve ({ variables, context }) {
   *   const staffMemberEntity = context.staffMember
   * }
   * ```
   */
  get staffMember () {
    return this.userEntity
  }

  /**
   * get: Id of the member of staff of this request.
   *
   * An alias of `#userId`, which the framework derives as `userEntity.id` — and `.findUser()`
   * returns the member of staff, so this is the member of staff's own id.
   *
   * @returns {number | null} Id of the member of staff.
   * @example
   * ```js
   * async resolve ({ variables, context }) {
   *   const id = context.staffMemberId
   * }
   * ```
   */
  get staffMemberId () {
    return this.userId
  }
}
