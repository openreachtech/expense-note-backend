export {}

declare global {
  namespace model {
    // The short-lived half of a session's token pair. No usedAt / revokedAt: the lifetime is the
    // revocation, so an expired row is deleted rather than flagged.
    interface StaffMemberAccessToken {
      id: number
      StaffMemberId: number
      accessToken: string
      sessionKey: string
      generatedAt: Date
      expiredAt: Date
    }
  }
}
