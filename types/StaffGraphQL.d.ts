export {}

declare global {
  // The GraphQL types of the staff audience. One namespace per audience, so the same operation
  // name under another audience is another interface and never silently the same one.
  //
  // Every interface below mirrors, field for field, the SDL under
  // server/graphql/schemas/staff/ — which is itself taken from the pinned contract at
  // .hora/contracts/1.0.0/staff-graphql.graphql. A non-null SDL field is a required property; a
  // nullable one is declared `| null`, never optional, so a missing value is always a written
  // value.
  namespace server.graphql.staff {
    ////////////////////////////////////////////////////////////////////////////
    //// The shared block — 001-common.graphql
    ////////////////////////////////////////////////////////////////////////////

    // No operation in 1.0.0 lets the caller choose a sort, so this pair is declared for the
    // convention's pagination shape and left unused.
    interface Sort {
      key: string
      direction: string
    }

    interface SortInput {
      key: string
      direction: string
    }

    interface Pagination {
      limit: number
      offset: number
      sort: Sort | null
      totalRecords: number
    }

    interface PaginationInput {
      limit: number
      offset: number
      sort: SortInput | null
    }

    ////////////////////////////////////////////////////////////////////////////
    //// Sign in — 002-sign-in.graphql
    ////////////////////////////////////////////////////////////////////////////

    interface SignInInput {
      email: string
      password: string
    }

    // The refresh token is absent on purpose: it goes into an httpOnly cookie and never appears
    // in a response body (spec 10.1).
    interface SignInResult {
      staffMemberId: number
      accessToken: string
    }

    interface SignOutResult {
      signedOut: boolean
    }

    // There is no RenewAccessTokenInput: the refresh-token cookie carries everything the
    // operation needs, so it takes no argument.
    interface RenewAccessTokenResult {
      accessToken: string
    }

    // There is no SignedInStaffMemberInput: the operation answers about the caller and nobody
    // else.
    interface SignedInStaffMemberResult {
      staffMemberId: number
      name: string
      email: string
    }
  }
}
