import {
  print,
} from 'graphql'

import {
  GraphqlSchemaBuilder,
} from '@openreachtech/renchan'

import StaffGraphqlServerEngine from '../../../../../../server/graphql/StaffGraphqlServerEngine.js'

/*
 * The expense-entry half of the staff audience's schema, read back out of the schema the running
 * server builds — not out of the file. Every case below builds it through the framework's own
 * `GraphqlSchemaBuilder`, which concatenates every file in `server/graphql/schemas/staff/` and
 * hands the result to `makeExecutableSchema`, so what is asserted is the merged schema a caller
 * meets rather than the text one file happens to hold.
 *
 * That also means a duplicate declaration fails here: redeclaring `Pagination` or the `DateTime`
 * scalar in this domain's file would throw while the schema is being built, and every case in this
 * file would go red rather than one.
 *
 * The expected strings are graphql's own canonical printing of the definition's AST node, so they
 * begin at column 0 and their indentation is graphql's rather than this file's. Printing the whole
 * definition, rather than reading one field's type at a time, is what makes an ADDED field fail
 * too — a field nobody declared in the contract is as much a breach as a missing one.
 *
 * The pinned contract at `.hora/contracts/1.0.0/staff-graphql.graphql` is what each expected value
 * is taken from, verbatim.
 */

describe('staff schema: 003-expense-entry.graphql', () => {
  describe('query operations', () => {
    const cases = [
      {
        params: {
          fieldName: 'expenses',
        },
        expected: 'expenses(input: ExpensesInput!): ExpensesResult!',
      },
      {
        // No argument at all: the operation takes no input, so no empty input type is declared.
        params: {
          fieldName: 'expenseCategories',
        },
        expected: 'expenseCategories: ExpenseCategoriesResult!',
      },
    ]

    test.each(cases)('fieldName: $params.fieldName', async ({
      params,
      expected,
    }) => {
      const engine = await StaffGraphqlServerEngine.createAsync()
      const schemaBuilder = GraphqlSchemaBuilder.create({
        engine,
      })
      const schema = await schemaBuilder.buildSchema()
      const queryFields = schema.getQueryType()
        .getFields()

      const actual = print(queryFields[params.fieldName].astNode)

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('staff schema: 003-expense-entry.graphql', () => {
  describe('mutation operations', () => {
    const cases = [
      {
        params: {
          fieldName: 'recordExpense',
        },
        expected: 'recordExpense(input: RecordExpenseInput!): RecordExpenseResult!',
      },
      {
        params: {
          fieldName: 'correctExpense',
        },
        expected: 'correctExpense(input: CorrectExpenseInput!): CorrectExpenseResult!',
      },
      {
        params: {
          fieldName: 'removeExpense',
        },
        expected: 'removeExpense(input: RemoveExpenseInput!): RemoveExpenseResult!',
      },
    ]

    test.each(cases)('fieldName: $params.fieldName', async ({
      params,
      expected,
    }) => {
      const engine = await StaffGraphqlServerEngine.createAsync()
      const schemaBuilder = GraphqlSchemaBuilder.create({
        engine,
      })
      const schema = await schemaBuilder.buildSchema()
      const mutationFields = schema.getMutationType()
        .getFields()

      const actual = print(mutationFields[params.fieldName].astNode)

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('staff schema: 003-expense-entry.graphql', () => {
  describe('types and inputs', () => {
    const cases = [
      {
        params: {
          typeName: 'Expense',
        },
        expected: `type Expense {
  id: Int!
  spentOn: String!
  amount: Int!
  memo: String
  status: String!
  expenseCategory: ExpenseCategory!
  createdAt: DateTime!
  updatedAt: DateTime!
}`,
      },
      {
        params: {
          typeName: 'ExpenseCategory',
        },
        expected: `type ExpenseCategory {
  id: Int!
  name: String!
  displayOrder: Int!
}`,
      },
      {
        params: {
          typeName: 'ExpensesInput',
        },
        expected: `input ExpensesInput {
  pagination: PaginationInput!
}`,
      },
      {
        params: {
          typeName: 'ExpensesResult',
        },
        expected: `type ExpensesResult {
  expenses: [Expense!]!
  pagination: Pagination!
}`,
      },
      {
        params: {
          typeName: 'ExpenseCategoriesResult',
        },
        expected: `type ExpenseCategoriesResult {
  expenseCategories: [ExpenseCategory!]!
}`,
      },
      {
        params: {
          typeName: 'RecordExpenseInput',
        },
        expected: `input RecordExpenseInput {
  spentOn: String!
  amount: Int!
  expenseCategoryId: Int!
  memo: String
}`,
      },
      {
        params: {
          typeName: 'RecordExpenseResult',
        },
        expected: `type RecordExpenseResult {
  expenseId: Int!
}`,
      },
      {
        // A full replace, not a patch: a correction that omits the memo clears it.
        params: {
          typeName: 'CorrectExpenseInput',
        },
        expected: `input CorrectExpenseInput {
  expenseId: Int!
  spentOn: String!
  amount: Int!
  expenseCategoryId: Int!
  memo: String
}`,
      },
      {
        params: {
          typeName: 'CorrectExpenseResult',
        },
        expected: `type CorrectExpenseResult {
  expenseId: Int!
}`,
      },
      {
        params: {
          typeName: 'RemoveExpenseInput',
        },
        expected: `input RemoveExpenseInput {
  expenseId: Int!
}`,
      },
      {
        params: {
          typeName: 'RemoveExpenseResult',
        },
        expected: `type RemoveExpenseResult {
  expenseId: Int!
}`,
      },
    ]

    test.each(cases)('typeName: $params.typeName', async ({
      params,
      expected,
    }) => {
      const engine = await StaffGraphqlServerEngine.createAsync()
      const schemaBuilder = GraphqlSchemaBuilder.create({
        engine,
      })
      const schema = await schemaBuilder.buildSchema()
      const declaredType = schema.getType(params.typeName)

      const actual = print(declaredType.astNode)

      expect(actual)
        .toBe(expected)
    })
  })
})
