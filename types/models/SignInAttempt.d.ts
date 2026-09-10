export {}

declare global {
  namespace model {
    // The business attributes of `sign_in_attempts`. `created_at` / `updated_at` are audit
    // columns the ORM manages and the application never reads, so they are not declared.
    interface SignInAttempt {
      id: number
      // The address as presented, normalized. Not a foreign key: an attempt on an address
      // holding no account is counted too, so there is no StaffMemberId to hold.
      email: string
      // A failed attempt only. A successful sign-in writes no row here.
      attemptedAt: Date
    }
  }
}
