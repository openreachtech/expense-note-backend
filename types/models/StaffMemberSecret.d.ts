export {}

declare global {
  namespace model {
    // The current sign-in identifier, one row per member of staff. Both StaffMemberId and email
    // are unique: the table is 1:1, and no two members of staff may hold the same address.
    interface StaffMemberSecret {
      id: number
      StaffMemberId: number
      email: string
      savedAt: Date
    }
  }
}
