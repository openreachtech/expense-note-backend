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
   * Find the member of staff a request's access token belongs to.
   *
   * **NOT IMPLEMENTED YET, AND DELIBERATELY SO.** It returns null for every request, which means
   * every operation the engine does not list in `schemasToSkipFiltering` is refused
   * `Unauthenticated`. That is the correct answer while this audience has no resolvers — spec
   * section 10 requires `signedInStaffMember` to refuse a caller with no session — and it becomes
   * silently wrong the moment a resolver expects a session to work. Checkpoint 6 of `#sign-in`
   * discharges it, and cannot pass its own gate until it does: section 10's "a session survives a
   * page reload" is unreachable while this returns null.
   *
   * What it owes, exactly:
   *
   * 1. Look `accessToken` up in `staff_member_access_tokens` (spec section 9.6), which stores the
   * token in the clear under a unique index, and refuse it unless the row answers
   * `isAvailable({ pointsAt: requestedAt })` — a row past its fifteen-minute expiry is not a
   * session. A lookup with no expiry check is the failure mode to watch for: it authenticates
   * every token ever issued, forever.
   * 2. Read it through `SessionClerk` (`app/session/SessionClerk.js`), which is this project's
   * single window on session data — "callers depend only on this class and never touch the
   * tables themselves". It carries `findRefreshToken()` today and **no** access-token read, so
   * the method it needs is one of the modules checkpoint 5 adds. Querying
   * `StaffMemberAccessToken` straight from this class would put a second door on the same
   * tables.
   * 3. Decide what the returned entity is, because the framework publishes `userEntity.id` as
   * `#userId` — and therefore as `#staffMemberId` below. Return the access-token row and
   * `context.staffMemberId` becomes the *token's* id, not the member of staff's. Either return
   * the member of staff (carrying the token's series key alongside if a resolver needs it) or
   * override `#get:userId`; do not leave the two reading alike.
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
    return super.findUser({
      expressRequest,
      accessToken,
      requestedAt,
    })
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
   * An alias of `#userId`, which the framework derives as `userEntity.id` — so this reads
   * correctly only for whatever entity `.findUser()` returns. See the note there.
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
