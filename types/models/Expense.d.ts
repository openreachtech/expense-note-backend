export {}

declare global {
  namespace model {
    // Business columns only. created_at / updated_at are framework-managed, so they are not
    // declared here, exactly as they are not declared in the model's attributes.
    interface Expense {
      id: number
      StaffMemberId: number
      ExpenseCategoryId: number
      // DATEONLY reaches the application as an ISO 'YYYY-MM-DD' string, never as a Date.
      spentOn: string
      amount: number
      memo: string | null
      status: string
    }
  }
}
