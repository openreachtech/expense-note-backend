export {}

declare global {
  // The GraphQL types of the staff audience. One namespace per audience, so the same operation
  // name under another audience is another interface and never silently the same one.
  //
  // Every interface below mirrors, field for field, the SDL under
  // server/graphql/schemas/staff/ — which is itself taken from the pinned contract at
  // .hora/contracts/1.0.0/staff-graphql.graphql.
  //
  // A non-null SDL field is a required property. A nullable one depends on which direction it
  // travels, and the two are not the same:
  //
  //   - in a RESULT type, `| null` and never optional — the server always writes the field, so
  //     a missing value is a written null and a reader never has to tell absent from empty
  //   - in an INPUT type, `?` as well as `| null` — a caller may omit the field entirely, and
  //     an omitted GraphQL input field arrives as `undefined`, not as `null`. Declaring it
  //     non-optional would forbid a value the schema permits
  namespace server.graphql.staff {
    ////////////////////////////////////////////////////////////////////////////
    //// The shared block — 001-common.graphql
    ////////////////////////////////////////////////////////////////////////////

    // No operation in 1.0.0 lets the caller choose a sort, so this pair is declared for the
    // convention's pagination shape and left unused.
    interface Sort {
      key: string
      direction: string
    }

    interface SortInput {
      key: string
      direction: string
    }

    interface Pagination {
      limit: number
      offset: number
      sort: Sort | null
      totalRecords: number
    }

    interface PaginationInput {
      limit: number
      offset: number
      sort?: SortInput | null
    }

    ////////////////////////////////////////////////////////////////////////////
    //// Sign in — 002-sign-in.graphql
    ////////////////////////////////////////////////////////////////////////////

    interface SignInInput {
      email: string
      password: string
    }

    // The refresh token is absent on purpose: it goes into an httpOnly cookie and never appears
    // in a response body (spec 10.1).
    interface SignInResult {
      staffMemberId: number
      accessToken: string
    }

    interface SignOutResult {
      signedOut: boolean
    }

    // There is no RenewAccessTokenInput: the refresh-token cookie carries everything the
    // operation needs, so it takes no argument.
    interface RenewAccessTokenResult {
      accessToken: string
    }

    // There is no SignedInStaffMemberInput: the operation answers about the caller and nobody
    // else.
    interface SignedInStaffMemberResult {
      staffMemberId: number
      name: string
      email: string
    }

    ////////////////////////////////////////////////////////////////////////////
    //// Expense entry — 003-expense-entry.graphql
    ////////////////////////////////////////////////////////////////////////////

    interface ExpenseCategory {
      id: number
      name: string
      displayOrder: number
    }

    // `spentOn` is a string, not a Date: it crosses the contract as an ISO 'YYYY-MM-DD' day with
    // no time of day, which is also the form a DATEONLY column reaches the application in.
    // `createdAt` / `updatedAt` are Date, because a resolver hands the DateTime scalar a Date and
    // the scalar serializes it on the way out.
    interface Expense {
      id: number
      spentOn: string
      amount: number
      memo: string | null
      status: string
      expenseCategory: ExpenseCategory
      createdAt: Date
      updatedAt: Date
    }

    interface ExpensesInput {
      pagination: PaginationInput
    }

    interface ExpensesResult {
      expenses: Array<Expense>
      pagination: Pagination
    }

    // There is no ExpenseCategoriesInput: the operation takes no argument at all.
    interface ExpenseCategoriesResult {
      expenseCategories: Array<ExpenseCategory>
    }

    interface RecordExpenseInput {
      spentOn: string
      amount: number
      expenseCategoryId: number
      memo?: string | null
    }

    interface RecordExpenseResult {
      expenseId: number
    }

    // A full replace, not a patch: every field but the memo is required, so a correction that
    // omits the memo clears it.
    interface CorrectExpenseInput {
      expenseId: number
      spentOn: string
      amount: number
      expenseCategoryId: number
      memo?: string | null
    }

    interface CorrectExpenseResult {
      expenseId: number
    }

    interface RemoveExpenseInput {
      expenseId: number
    }

    interface RemoveExpenseResult {
      expenseId: number
    }
  }
}
