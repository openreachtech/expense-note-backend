export {}

declare global {
  namespace model {
    // The history of superseded password digests, appended one generation per save by the backup
    // mixin. Mirrors StaffMemberPasswordHash's fields, but 1:N: StaffMemberId is not unique.
    interface StaffMemberPasswordHashesBk {
      id: number
      StaffMemberId: number
      passwordHash: string
      savedAt: Date
    }
  }
}
