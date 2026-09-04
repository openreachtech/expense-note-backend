export {}

declare global {
  namespace model {
    // The history of superseded sign-in addresses, appended one generation per save by the backup
    // mixin. Mirrors StaffMemberSecret's fields, but 1:N: neither StaffMemberId nor email is unique.
    interface StaffMemberSecretsBk {
      id: number
      StaffMemberId: number
      email: string
      savedAt: Date
    }
  }
}
