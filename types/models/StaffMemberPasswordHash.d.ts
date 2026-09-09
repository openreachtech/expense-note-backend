export {}

declare global {
  namespace model {
    // The current password digest, one row per member of staff. StaffMemberId is unique because
    // the table is 1:1. The digest is a one-way hash and is returned by no operation.
    interface StaffMemberPasswordHash {
      id: number
      StaffMemberId: number
      passwordHash: string
      savedAt: Date
    }
  }
}
