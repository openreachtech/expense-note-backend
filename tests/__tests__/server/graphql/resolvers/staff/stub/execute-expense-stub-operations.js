import {
  graphql,
} from 'graphql'

import {
  GraphqlSchemaBuilder,
} from '@openreachtech/renchan'

import StaffGraphqlServerEngine from '../../../../../../../server/graphql/StaffGraphqlServerEngine.js'

/*
 * The five operations `#expense-entry` adds, driven as a caller reaches them: as real GraphQL
 * documents executed against the audience's own executable schema, built by the same
 * `GraphqlSchemaBuilder` the running server builds it with, with the resolvers loaded out of the
 * same two pools the running server loads them from.
 *
 * Every other test beside this one exercises one stub class through its `resolve()` method. This
 * one asks the question that method cannot answer: **is the operation reachable at all** — is the
 * field wired to this class, does the class's `static get schema ()` name the field the SDL
 * declares, and does what it returns survive GraphQL's own coercion against the declared types.
 * A stub whose `schema` getter were misspelled passes every unit test in this folder and fails
 * here.
 *
 * **Executed in process rather than over HTTP, and the difference is not cosmetic.**
 * `server/index.js` cannot boot on this machine at all — it dies at
 * `ERR_UNSUPPORTED_ESM_URL_SCHEME`, root-caused to one line of renchan's `DeepBulkClassLoader` and
 * recorded as Q24, older than this feature — so an HTTP probe would say nothing about these five
 * operations and everything about that. This is the same code path minus the socket: the schema,
 * the resolver pools, the field wiring and the type coercion are all the real ones. **What it
 * therefore does not evidence is the socket itself** — the express app, the middleware, the JSON
 * body parser and the CORS allow-list are not exercised here, and will not be until Q24 is closed.
 *
 * **`contextValue` is null in every case, and that is the point rather than a shortcut.** These
 * five operations exist only in the stub pool, and renchan builds its authentication filter hash
 * from the `actual/` pool alone, so each is handed `filter === undefined` and nothing refuses the
 * call. Passing no context at all is the plainest demonstration of it: there is not even an object
 * a session could have been read off, and every operation answers anyway. **So this file evidences
 * that the five are callable, and simultaneously that they are callable by anybody** — which spec
 * section 7's Authentication row and section 11's own criterion say they must not be. That
 * criterion is not met at this checkpoint and cannot be; it is the `actual/` resolvers at
 * checkpoint 6 that meet it.
 *
 * What each case asserts is the response's payload. An operation the filter refused, or one no
 * resolver was wired to, comes back with that payload null and an error beside it, so neither can
 * pass here quietly. The payload is pulled off the response and asserted on its own, rather than
 * the whole response being compared in one go, because `data` is a denylisted identifier and may
 * not be written as a key — `tests/_orders/SignIn/execute-staff-session-operations.js` reads it the
 * same way for the same reason.
 *
 * Nothing is mocked and nothing touches the database — a stub reads no row, so there is nothing
 * seeded to reach for and no row of this feature's own id prefix is spent.
 *
 * `createdAt` and `updatedAt` come back as ISO strings rather than as the `Date` objects the stub
 * returns, because the `DateTime` scalar serializes a `Date` with `toISOString()` on the way out.
 * That transit is part of what this file checks: a stub returning a string there would be refused
 * by the scalar, and only an execution through the schema would notice.
 */

describe('execute-expense-stub-operations', () => {
  /*
   * Two pages of the same twelve entries, asked for through the schema with variables, exactly as
   * a client will ask.
   *
   * The first case takes the top of the list and so pins the ordering the operation owes — newest
   * `spentOn` first — and carries the entry whose memo is null, which crosses the wire as a JSON
   * null rather than as a failure. The second asks for five and is answered with the two that are
   * left, where `totalRecords` is visibly the size of the whole set rather than of the page.
   *
   * The sort clause is presented in the first and omitted in the second. It comes back as it was
   * sent, and as `null` when it was not sent: no operation in 1.0.0 lets a caller choose a sort.
   */
  describe('should answer the expenses query through the built schema, with no session presented', () => {
    const cases = [
      {
        params: {
          source: `
            query ($input: ExpensesInput!) {
              expenses (input: $input) {
                expenses {
                  id
                  spentOn
                  amount
                  memo
                  status
                  expenseCategory {
                    id
                    name
                    displayOrder
                  }
                  createdAt
                  updatedAt
                }
                pagination {
                  limit
                  offset
                  sort {
                    key
                    direction
                  }
                  totalRecords
                }
              }
            }
          `,
          pagination: {
            limit: 3,
            offset: 0,
            sort: {
              key: 'spentOn',
              direction: 'DESC',
            },
          },
        },
        expected: {
          expenses: {
            expenses: [
              {
                id: 9101,
                spentOn: '2026-09-12',
                amount: 1200,
                memo: 'Taxi back from the client office',
                status: 'recorded',
                expenseCategory: {
                  id: 10000001,
                  name: 'transport',
                  displayOrder: 1,
                },
                createdAt: '2026-09-12T13:05:00.000Z',
                updatedAt: '2026-09-12T13:05:00.000Z',
              },
              {
                id: 9102,
                spentOn: '2026-09-11',
                amount: 880,
                memo: 'Lunch while visiting the branch',
                status: 'recorded',
                expenseCategory: {
                  id: 10000002,
                  name: 'meals',
                  displayOrder: 2,
                },
                createdAt: '2026-09-11T09:40:00.000Z',
                updatedAt: '2026-09-11T09:40:00.000Z',
              },
              {
                id: 9103,
                spentOn: '2026-09-09',
                amount: 3400,
                memo: null, // the optional memo, read back empty rather than failing
                status: 'recorded',
                expenseCategory: {
                  id: 10000003,
                  name: 'supplies',
                  displayOrder: 3,
                },
                createdAt: '2026-09-09T02:15:00.000Z',
                updatedAt: '2026-09-09T02:15:00.000Z',
              },
            ],
            pagination: {
              limit: 3,
              offset: 0,
              sort: {
                key: 'spentOn',
                direction: 'DESC',
              },
              totalRecords: 12,
            },
          },
        },
      },
      {
        params: {
          source: `
            query ($input: ExpensesInput!) {
              expenses (input: $input) {
                expenses {
                  id
                  spentOn
                  amount
                  memo
                  status
                  expenseCategory {
                    id
                    name
                    displayOrder
                  }
                  createdAt
                  updatedAt
                }
                pagination {
                  limit
                  offset
                  sort {
                    key
                    direction
                  }
                  totalRecords
                }
              }
            }
          `,
          pagination: {
            limit: 5,
            offset: 10,
            // sort: undefined
          },
        },
        expected: {
          expenses: {
            expenses: [
              {
                id: 9111,
                spentOn: '2026-08-18',
                amount: 24800,
                memo: 'Conference ticket, paid in advance',
                status: 'recorded',
                expenseCategory: {
                  id: 10000004,
                  name: 'other',
                  displayOrder: 4,
                },
                createdAt: '2026-08-18T23:35:00.000Z',
                updatedAt: '2026-08-18T23:35:00.000Z',
              },
              {
                id: 9112,
                spentOn: '2026-08-14',
                amount: 640,
                memo: 'Bus fare to the supplier',
                status: 'recorded',
                expenseCategory: {
                  id: 10000001,
                  name: 'transport',
                  displayOrder: 1,
                },
                createdAt: '2026-08-14T10:00:00.000Z',
                updatedAt: '2026-08-14T10:00:00.000Z',
              },
            ],
            pagination: {
              limit: 5,
              offset: 10,
              sort: null, // not presented, and nullable in the contract
              totalRecords: 12,
            },
          },
        },
      },
    ]

    test.each(cases)('pagination.offset: $params.pagination.offset', async ({
      params,
      expected,
    }) => {
      const engine = await StaffGraphqlServerEngine.createAsync()
      const schemaBuilder = GraphqlSchemaBuilder.create({
        engine,
      })
      const schema = await schemaBuilder.buildSchema()

      const response = await graphql({
        schema,
        source: params.source,
        variableValues: {
          input: {
            pagination: params.pagination,
          },
        },
        contextValue: null, // no session, and not even a context to have read one off
      })

      const actual = response.data

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('execute-expense-stub-operations', () => {
  /*
   * The category master, asked for through the schema. The operation takes no argument at all, so
   * what varies case to case is the document: the first asks for every field of a category, the
   * second for the two a picker actually renders. A client is free to ask for either, and the
   * answer is the same four rows in the same display order.
   */
  describe('should answer the expenseCategories query through the built schema, with no session presented', () => {
    const cases = [
      {
        params: {
          source: 'query { expenseCategories { expenseCategories { id name displayOrder } } }',
        },
        expected: {
          expenseCategories: {
            expenseCategories: [
              {
                id: 10000001,
                name: 'transport',
                displayOrder: 1,
              },
              {
                id: 10000002,
                name: 'meals',
                displayOrder: 2,
              },
              {
                id: 10000003,
                name: 'supplies',
                displayOrder: 3,
              },
              {
                id: 10000004,
                name: 'other',
                displayOrder: 4,
              },
            ],
          },
        },
      },
      {
        params: {
          source: 'query { expenseCategories { expenseCategories { id name } } }',
        },
        expected: {
          expenseCategories: {
            expenseCategories: [
              {
                id: 10000001,
                name: 'transport',
              },
              {
                id: 10000002,
                name: 'meals',
              },
              {
                id: 10000003,
                name: 'supplies',
              },
              {
                id: 10000004,
                name: 'other',
              },
            ],
          },
        },
      },
    ]

    test.each(cases)('source: $params.source', async ({
      params,
      expected,
    }) => {
      const engine = await StaffGraphqlServerEngine.createAsync()
      const schemaBuilder = GraphqlSchemaBuilder.create({
        engine,
      })
      const schema = await schemaBuilder.buildSchema()

      const response = await graphql({
        schema,
        source: params.source,
        contextValue: null, // no session, and not even a context to have read one off
      })

      const actual = response.data

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('execute-expense-stub-operations', () => {
  /*
   * Recording an entry, through the schema. The answer is the identifier and nothing else, which
   * is the shape spec section 11.1 declares for every mutation of this feature — asking the
   * document for anything more than `expenseId` would not compile against the schema, and that is
   * the CQRS rule being enforced by the contract rather than by a convention.
   *
   * The second case presents a negative amount and a date far in the future, both of which section
   * 11 makes the real operation refuse, and is answered exactly as the first. A stub refuses
   * nothing, and asserting that here is what keeps the checkpoint honest about what it has built.
   */
  describe('should answer the recordExpense mutation through the built schema, with no session presented', () => {
    const cases = [
      {
        params: {
          source: `
            mutation ($input: RecordExpenseInput!) {
              recordExpense (input: $input) {
                expenseId
              }
            }
          `,
          input: {
            spentOn: '2026-09-14',
            amount: 1200,
            expenseCategoryId: 10000001,
            memo: 'Taxi to the client office',
          },
        },
        expected: {
          recordExpense: {
            expenseId: 9113,
          },
        },
      },
      {
        params: {
          source: `
            mutation ($input: RecordExpenseInput!) {
              recordExpense (input: $input) {
                expenseId
              }
            }
          `,
          input: {
            spentOn: '2099-12-31', // a date after today, which the real operation refuses
            amount: -4500, // a negative amount, which the real operation refuses
            expenseCategoryId: 10000002,
            memo: 'Presented to see that a stub refuses nothing',
          },
        },
        expected: {
          recordExpense: {
            expenseId: 9113,
          },
        },
      },
    ]

    test.each(cases)('input.spentOn: $params.input.spentOn', async ({
      params,
      expected,
    }) => {
      const engine = await StaffGraphqlServerEngine.createAsync()
      const schemaBuilder = GraphqlSchemaBuilder.create({
        engine,
      })
      const schema = await schemaBuilder.buildSchema()

      const response = await graphql({
        schema,
        source: params.source,
        variableValues: {
          input: params.input,
        },
        contextValue: null, // no session, and not even a context to have read one off
      })

      const actual = response.data

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('execute-expense-stub-operations', () => {
  /*
   * Correcting an entry, through the schema. The identifier presented comes back, so the two cases
   * name different ones and the answer has to move with them.
   *
   * The second names an entry `expenses` does not answer with — which stands for both somebody
   * else's entry and an entry already removed, the two having been settled as one answer — and it
   * is corrected just the same. The real operation answers not found; a stub throws nothing.
   */
  describe('should answer the correctExpense mutation through the built schema, with no session presented', () => {
    const cases = [
      {
        params: {
          source: `
            mutation ($input: CorrectExpenseInput!) {
              correctExpense (input: $input) {
                expenseId
              }
            }
          `,
          input: {
            expenseId: 9105,
            spentOn: '2026-09-05',
            amount: 12000,
            expenseCategoryId: 10000002,
            memo: 'Team dinner after the release',
          },
        },
        expected: {
          correctExpense: {
            expenseId: 9105,
          },
        },
      },
      {
        params: {
          source: `
            mutation ($input: CorrectExpenseInput!) {
              correctExpense (input: $input) {
                expenseId
              }
            }
          `,
          input: {
            expenseId: 7788, // named by nobody; the real operation answers this as not found
            spentOn: '2026-07-19',
            amount: 3300,
            expenseCategoryId: 10000003,
            // memo: undefined
          },
        },
        expected: {
          correctExpense: {
            expenseId: 7788,
          },
        },
      },
    ]

    test.each(cases)('input.expenseId: $params.input.expenseId', async ({
      params,
      expected,
    }) => {
      const engine = await StaffGraphqlServerEngine.createAsync()
      const schemaBuilder = GraphqlSchemaBuilder.create({
        engine,
      })
      const schema = await schemaBuilder.buildSchema()

      const response = await graphql({
        schema,
        source: params.source,
        variableValues: {
          input: params.input,
        },
        contextValue: null, // no session, and not even a context to have read one off
      })

      const actual = response.data

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('execute-expense-stub-operations', () => {
  /*
   * Removing an entry, through the schema. The identifier presented comes back, so the two cases
   * name different ones and the answer has to move with them.
   *
   * The second names an entry `expenses` does not answer with, and is removed just the same — the
   * same point as above, and the one the settled decision turns on: a removed entry and somebody
   * else's entry are the same thing to a reader, and the real operation answers both as not found.
   */
  describe('should answer the removeExpense mutation through the built schema, with no session presented', () => {
    const cases = [
      {
        params: {
          source: `
            mutation ($input: RemoveExpenseInput!) {
              removeExpense (input: $input) {
                expenseId
              }
            }
          `,
          input: {
            expenseId: 9109,
          },
        },
        expected: {
          removeExpense: {
            expenseId: 9109,
          },
        },
      },
      {
        params: {
          source: `
            mutation ($input: RemoveExpenseInput!) {
              removeExpense (input: $input) {
                expenseId
              }
            }
          `,
          input: {
            expenseId: 6402, // named by nobody; the real operation answers this as not found
          },
        },
        expected: {
          removeExpense: {
            expenseId: 6402,
          },
        },
      },
    ]

    test.each(cases)('input.expenseId: $params.input.expenseId', async ({
      params,
      expected,
    }) => {
      const engine = await StaffGraphqlServerEngine.createAsync()
      const schemaBuilder = GraphqlSchemaBuilder.create({
        engine,
      })
      const schema = await schemaBuilder.buildSchema()

      const response = await graphql({
        schema,
        source: params.source,
        variableValues: {
          input: params.input,
        },
        contextValue: null, // no session, and not even a context to have read one off
      })

      const actual = response.data

      expect(actual)
        .toEqual(expected)
    })
  })
})
