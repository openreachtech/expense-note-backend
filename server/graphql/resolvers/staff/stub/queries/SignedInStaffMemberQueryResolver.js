import {
  BaseQueryResolver,
} from '@openreachtech/renchan'

/**
 * Stub resolver of the `signedInStaffMember` query.
 *
 * Hardcoded, schema-accurate literals and nothing else: no session is inspected, no row is read.
 * The member of staff returned here is the same one `SignInMutationResolver` answers with — same
 * id, same name, same address — so a screen that signs in and then asks who is signed in sees one
 * person rather than two.
 *
 * The operation takes no argument. Spec section 10.1 declares `SignedInStaffMemberInput()` with no
 * fields — the operation answers about the caller and nobody else — and the convention gives an
 * operation with no input no argument at all.
 *
 * While this operation is served from the stub pool it runs with **no authentication filter at
 * all**: renchan builds its filter hash from the `actual/` pool alone, so a stub-only field is
 * handed `filter === undefined` and nothing refuses the call. This one is the sharpest case of it.
 * The engine deliberately leaves `signedInStaffMember` out of `schemasToSkipFiltering` precisely
 * so the filter refuses it without a session — and as a stub it is reachable anyway, and answers
 * with the fake member of staff below. **So this stub does not demonstrate its own authentication
 * requirement, and must not be read as doing so.** Section 10's criterion that it be refused
 * without a session, and return nobody, is met by the `actual/` resolver at checkpoint 6.
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
   * @returns {Promise<server.graphql.staff.SignedInStaffMemberResult>} The member of staff the caller is signed in as.
   * @public
   */
  async resolve () {
    return {
      staffMemberId: 9001,
      name: 'Stub Member Of Staff',
      email: 'stub-member-of-staff@example.invalid',
    }
  }
}
