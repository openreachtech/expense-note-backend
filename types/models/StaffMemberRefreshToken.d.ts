export {}

declare global {
  namespace model {
    // The business attributes of `staff_member_refresh_tokens`. `created_at` / `updated_at` are
    // audit columns the ORM manages and the application never reads, so they are not declared.
    interface StaffMemberRefreshToken {
      id: number
      StaffMemberId: number
      // The digest, never the token. Nothing here can be presented as a refresh token.
      tokenHash: string
      sessionKey: string
      // Null until the token is spent on a rotation.
      usedAt: Date | null
      // Null until the token is revoked on sign-out or on a detected reuse.
      revokedAt: Date | null
      generatedAt: Date
      expiredAt: Date
    }
  }
}
