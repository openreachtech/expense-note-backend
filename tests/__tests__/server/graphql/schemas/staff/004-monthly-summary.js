import {
  print,
} from 'graphql'

import {
  GraphqlSchemaBuilder,
} from '@openreachtech/renchan'

import StaffGraphqlServerEngine from '../../../../../../server/graphql/StaffGraphqlServerEngine.js'

/*
 * The monthly-summary half of the staff audience's schema, read back out of the schema the running
 * server builds — not out of the file. Every case below builds it through the framework's own
 * `GraphqlSchemaBuilder`, which concatenates every file in `server/graphql/schemas/staff/` and
 * hands the result to `makeExecutableSchema`, so what is asserted is the merged schema a caller
 * meets rather than the text one file happens to hold.
 *
 * That also means a duplicate declaration fails here: redeclaring `Expense`, `ExpenseCategory` or
 * the `DateTime` scalar in this domain's file would throw while the schema is being built, and
 * every case in this file would go red rather than one.
 *
 * The expected strings are graphql's own canonical printing of the definition's AST node, so they
 * begin at column 0 and their indentation is graphql's rather than this file's. Printing the whole
 * definition, rather than reading one field's type at a time, is what makes an ADDED field fail
 * too — a field nobody declared in the contract is as much a breach as a missing one.
 *
 * The pinned contract at `.hora/contracts/1.0.0/staff-graphql.graphql` is what each expected value
 * is taken from, verbatim.
 *
 * There is no mutation case: spec 12.1 declares one query and nothing else for this domain.
 */

describe('staff schema: 004-monthly-summary.graphql', () => {
  describe('query operations', () => {
    const cases = [
      {
        params: {
          fieldName: 'monthlyExpenses',
        },
        expected: 'monthlyExpenses(input: MonthlyExpensesInput!): MonthlyExpensesResult!',
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

describe('staff schema: 004-monthly-summary.graphql', () => {
  describe('types and inputs', () => {
    const cases = [
      {
        params: {
          typeName: 'MonthlyExpensesInput',
        },
        expected: `input MonthlyExpensesInput {
  year: Int!
  month: Int!
}`,
      },
      {
        // The entries and the total come from one operation, so the two can never disagree. No
        // pagination: spec 7 caps the heaviest read at a few hundred rows.
        params: {
          typeName: 'MonthlyExpensesResult',
        },
        expected: `type MonthlyExpensesResult {
  expenses: [Expense!]!
  totalAmount: Int!
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

/*
 * `Expense` is declared once, in 003-expense-entry.graphql, and this domain references it. The case
 * below is what holds that true: were a second `Expense` ever added here it would be a duplicate
 * type rather than an override, and were `MonthlyExpensesResult` ever given a row shape of its own,
 * a month's entries and the total taken over them could describe different shapes.
 */
describe('staff schema: 004-monthly-summary.graphql', () => {
  describe('the row type it reuses rather than redeclares', () => {
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
