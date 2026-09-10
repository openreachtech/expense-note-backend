import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

/**
 * Stub resolver of the `signOut` mutation.
 *
 * Hardcoded, schema-accurate literals and nothing else: no cookie is read, no refresh-token series
 * is revoked, nothing is written. It reports the sign-out as done every time it is called.
 *
 * The operation takes no argument. Spec section 10.1 declares `SignOutInput()` with no fields, and
 * the convention gives an operation with no input no argument at all, so no empty input type
 * exists to destructure.
 *
 * While this operation is served from the stub pool it runs with **no authentication filter at
 * all**: renchan builds its filter hash from the `actual/` pool alone, so a stub-only field is
 * handed `filter === undefined` and nothing refuses the call. `signOut` also names itself in the
 * engine's `schemasToSkipFiltering`, because it has to work once the access token has expired —
 * which means it owes the refresh-token cookie check itself. Reading and revoking that cookie
 * arrives with the `actual/` resolver at checkpoint 6.
 *
 * @augments {BaseMutationResolver}
 */
export default class SignOutMutationResolver extends BaseMutationResolver {
  /**
   * get: Name of the operation this resolver serves.
   *
   * @override
   * @returns {string} Operation name.
   */
  static get schema () {
    return 'signOut'
  }

  /**
   * get: Error code hash. Empty, because a stub throws nothing and so owns no error code.
   *
   * @override
   * @returns {Record<string, string>} Error code hash.
   */
  static get errorCodeHash () {
    return {
      ...super.errorCodeHash,
    }
  }

  /**
   * Resolve the operation with hardcoded, schema-accurate data.
   *
   * @override
   * @returns {Promise<server.graphql.staff.SignOutResult>} Whether the caller was signed out.
   * @public
   */
  async resolve () {
    return {
      signedOut: true,
    }
  }
}
