import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

/**
 * Stub resolver of the `signIn` mutation.
 *
 * Hardcoded, schema-accurate literals and nothing else: no credential is checked, no row is read,
 * nothing is written. The member of staff returned here is the same one
 * `SignedInStaffMemberQueryResolver` answers with — same id, same name, same address — so a screen
 * built against the two stubs sees one person rather than two.
 *
 * While this operation is served from the stub pool it runs with **no authentication filter at
 * all**: renchan builds its filter hash from the `actual/` pool alone, so a stub-only field is
 * handed `filter === undefined` and nothing refuses the call. That is true of every operation of
 * this audience for as long as it is a stub, and it is not something a stub may pretend to fix.
 * The real credential check — and section 7's limit of ten failed attempts per fifteen minutes per
 * address — arrive with the `actual/` resolver at checkpoint 6.
 *
 * @augments {BaseMutationResolver}
 */
export default class SignInMutationResolver extends BaseMutationResolver {
  /**
   * get: Name of the operation this resolver serves.
   *
   * @override
   * @returns {string} Operation name.
   */
  static get schema () {
    return 'signIn'
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
   * The presented address and password are destructured to document the input this operation
   * takes, and are deliberately left unread: reading them would be the credential check that
   * belongs to the `actual/` resolver.
   *
   * @override
   * @param {GraphqlType.ResolverInput<{
   *   input: server.graphql.staff.SignInInput
   * }>} params - Parameters.
   * @returns {Promise<server.graphql.staff.SignInResult>} The signed-in member of staff, and their access token.
   * @public
   */
  async resolve ({
    variables: {
      input: {
        email,
        password,
      },
    },
    context,
  }) {
    return {
      staffMemberId: 9001,
      accessToken: 'stub-access-token-from-sign-in-0001',
    }
  }
}
