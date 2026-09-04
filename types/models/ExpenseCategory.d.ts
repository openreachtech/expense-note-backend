export {}

declare global {
  namespace model {
    interface ExpenseCategory {
      id: number
      name: string
      displayOrder: number
    }
  }
}
