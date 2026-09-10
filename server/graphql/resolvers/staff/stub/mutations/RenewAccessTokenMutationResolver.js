import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

/**
 * Stub resolver of the `renewAccessToken` mutation.
 *
 * Hardcoded, schema-accurate literals and nothing else: no cookie is read, no refresh token is
 * spent, no next pair is issued. The token it hands back is a different literal from the one
 * `SignInMutationResolver` returns, so a reader can tell which of the two produced the token in
 * hand.
 *
 * The operation takes no argument. Spec section 10.1 declares `RenewAccessTokenInput()` with no
 * fields — the refresh-token cookie carries everything the real operation needs — and the
 * convention gives an operation with no input no argument at all.
 *
 * While this operation is served from the stub pool it runs with **no authentication filter at
 * all**: renchan builds its filter hash from the `actual/` pool alone, so a stub-only field is
 * handed `filter === undefined` and nothing refuses the call. `renewAccessToken` also names itself
 * in the engine's `schemasToSkipFiltering`, because re-establishing a session is what it is for —
 * which means it owes the cookie check itself: refusing a refresh token that is missing, expired,
 * revoked or already spent, identically in every case, and revoking the whole series on a reuse.
 * All of that arrives with the `actual/` resolver at checkpoint 6.
 *
 * @augments {BaseMutationResolver}
 */
export default class RenewAccessTokenMutationResolver extends BaseMutationResolver {
  /**
   * get: Name of the operation this resolver serves.
   *
   * @override
   * @returns {string} Operation name.
   */
  static get schema () {
    return 'renewAccessToken'
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
   * @returns {Promise<server.graphql.staff.RenewAccessTokenResult>} The freshly issued access token.
   * @public
   */
  async resolve () {
    return {
      accessToken: 'stub-access-token-from-renew-0002',
    }
  }
}
