import {
  BaseQueryResolver,
} from '@openreachtech/renchan'

import StaffMemberSecret from '../../../../../../sequelize/models/StaffMemberSecret.js'

/**
 * Resolver of the `signedInStaffMember` query.
 *
 * Answers who the caller is signed in as, and about nobody else: the operation takes no argument
 * at all — spec section 10.1 declares `SignedInStaffMemberInput()` with no fields — so there is
 * nothing to validate and no `*InputValidator` exists for it. A session is a cookie, and this is
 * how a reloaded screen asks whether it still has one.
 *
 * Two rows are read, because the result spans two tables on purpose. The name comes off the
 * member of staff the context already resolved from the access token; the address comes from
 * `staff_member_secrets`, which spec section 9.1 keeps apart from `staff_members` precisely "so
 * that a read of somebody's name cannot carry a credential in its result set". The address is
 * therefore looked up here rather than by widening `StaffGraphqlContext.findUser()`, which runs on
 * **every** request to this audience including the three operations that never need an address.
 *
 * Nothing here returns or logs a token, a digest or a password hash. Nothing is written either:
 * this is a query, and the CQRS rule gives it no transaction and no `create` / `update`.
 *
 * @augments {BaseQueryResolver}
 */
export default class SignedInStaffMemberQueryResolver extends BaseQueryResolver {
  /**
   * get: Name of the operation this resolver serves.
   *
   * @override
   * @returns {string} Operation name.
   */
  static get schema () {
    return 'signedInStaffMember'
  }

  /**
   * get: Error code hash.
   *
   * Both refusals are `204` — the family the always-on convention gives a database error, and the
   * one this feature's refusals were ruled to carry. `Q001` is this operation's stable id, fixed
   * in `server/graphql/resolver-id-hash-staff.js`.
   *
   * Neither code names what it refused beyond the row that was missing: no address, no token and
   * no digest appears in either, so a refusal reveals nothing about whose session it was.
   *
   * @override
   * @returns {Record<string, string>} Error code hash.
   */
  static get errorCodeHash () {
    return {
      ...super.errorCodeHash,

      // Database Errors (204 prefix)
      StaffMemberNotFound: '204.Q001.001',
      StaffMemberSecretNotFound: '204.Q001.002',
    }
  }

  /**
   * get: StaffMemberSecret model — a seam so tests can substitute it.
   *
   * @returns {typeof StaffMemberSecret} Model declaration.
   */
  get StaffMemberSecretModel () {
    return StaffMemberSecret
  }

  /**
   * Resolve the operation.
   *
   * **The refusal without a session is the engine's, not this method's.** `signedInStaffMember` is
   * deliberately absent from `StaffGraphqlServerEngine#get:schemasToSkipFiltering`, so the
   * framework's authentication filter refuses a caller carrying no live access token before
   * `resolve()` is ever entered — that is the guarantee section 10's criterion rests on.
   *
   * The null guard below is the **second line, and defence in depth only**: that list is
   * hand-maintained, and one wrong entry on it turns this operation public without anything
   * failing. Left unguarded, such a misconfiguration would surface as a crash or a null-field
   * GraphQL error on a `String!`; guarded, it surfaces as a clean refusal that names nobody. The
   * same shape as checkpoint 5, where `SessionClerk`'s guard became the guarantee and the
   * resolver's pre-check was kept and labelled rather than deleted.
   *
   * **A member of staff holding no current address is refused, not answered with a blank.**
   * `email` is `String!` in the pinned contract, so returning null is not available, and an empty
   * string would answer a required field with something that is not an address — a screen would
   * render a blank identity as though it were correct. The state is real rather than
   * hypothetical: section 4 has accounts issued by hand with no operator mechanism, and the
   * development seeders carry two half-issued members of staff who hold no address row. It cannot
   * arise for a caller who actually signed in, because `signIn` looks a member of staff up *by*
   * that address — so reaching it means the row went away mid-session or a token was minted some
   * other way, and both are broken states to refuse rather than paper over.
   *
   * @override
   * @param {{
   *   context: StaffGraphqlContext
   * }} params - Parameters of this method.
   * @returns {Promise<server.graphql.staff.SignedInStaffMemberResult>} The member of staff the caller is signed in as.
   * @throws {Error} Refusal of a caller with no session, or of a member of staff holding no current address.
   * @public
   */
  async resolve ({
    context,
  }) {
    const staffMemberEntity = /** @type {model.StaffMember | null} */ (
      context.staffMember
    )

    if (!staffMemberEntity) {
      throw this.errorHash.StaffMemberNotFound.create()
    }

    const secretEntity = await this.findStaffMemberSecret({
      staffMemberId: staffMemberEntity.id,
    })

    if (!secretEntity) {
      throw this.errorHash.StaffMemberSecretNotFound.create()
    }

    return this.formatResponse({
      staffMemberEntity,
      secretEntity,
    })
  }

  /**
   * Find the current sign-in address of a member of staff.
   *
   * One row at most: `staff_member_secrets` is 1:1 with `staff_members` and its `StaffMemberId`
   * carries a unique index, so the row this finds is the current address by construction and no
   * ordering is needed to pick it. Superseded addresses live in the backup table and are not read
   * here.
   *
   * @param {{
   *   staffMemberId: number
   * }} params - Parameters of this method.
   * @returns {Promise<model.StaffMemberSecret | null>} Current sign-in address row, or null when the member of staff holds none.
   */
  async findStaffMemberSecret ({
    staffMemberId,
  }) {
    return /** @type {*} */ (
      this.StaffMemberSecretModel.findOne({
        where: {
          StaffMemberId: staffMemberId,
        },
      })
    )
  }

  /**
   * Format the response.
   *
   * Each field is computed into its own `const` and the returned literal assembles bare
   * identifiers. No field-path extractor is used because none is installed in this repository,
   * and the rule preferring one is conditional on a project having one; what still binds is the
   * ban on logic in an object-literal property value, which naming each field satisfies.
   *
   * @param {{
   *   staffMemberEntity: model.StaffMember
   *   secretEntity: model.StaffMemberSecret
   * }} params - Parameters of this method.
   * @returns {server.graphql.staff.SignedInStaffMemberResult} The member of staff the caller is signed in as.
   */
  formatResponse ({
    staffMemberEntity,
    secretEntity,
  }) {
    const staffMemberId = staffMemberEntity.id
    const { name } = staffMemberEntity
    const { email } = secretEntity

    return {
      staffMemberId,
      name,
      email,
    }
  }
}

/**
 * @typedef {import('../../../../contexts/StaffGraphqlContext.js').default} StaffGraphqlContext
 */
