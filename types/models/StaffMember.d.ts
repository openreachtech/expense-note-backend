export {}

declare global {
  namespace model {
    // The one actor of the spec. The sign-in address and the password digest are not here:
    // they sit in staff_member_secrets and staff_member_password_hashes, so a read of
    // somebody's name cannot carry a credential in its result set.
    interface StaffMember {
      id: number
      name: string
    }
  }
}
