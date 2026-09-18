import {
  graphql,
} from 'graphql'

import {
  GraphqlSchemaBuilder,
} from '@openreachtech/renchan'

import StaffGraphqlServerEngine from '../../../../../../../server/graphql/StaffGraphqlServerEngine.js'
import StaffGraphqlContext from '../../../../../../../server/graphql/contexts/StaffGraphqlContext.js'

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
 * **Two of the five are still stubs; the two queries and `recordExpense` are not, as of
 * checkpoint 7.** `expenses`, `expenseCategories` and `recordExpense` all have an `actual/`
 * resolver now, and renchan resolves a field from the actual pool before the stub pool
 * (`actualResolverSchemaHash[schema] ?? stubResolverSchemaHash[schema]`), so those three fields of
 * this schema are wired to the real resolvers. All three stub classes are still there and still
 * tested beside this file, because the frontend builds against them until checkpoint 16 — they are
 * simply no longer what a caller reaches through the schema. The two remaining mutations —
 * `correctExpense` and `removeExpense` — are still served from the stub pool.
 *
 * **`contextValue` is therefore null for the two that remain stubbed, and a real session-less
 * context for the three that do not.** renchan builds its authentication filter hash from the
 * `actual/` pool alone, so a stub-only field is handed `filter === undefined` and nothing refuses
 * the call: passing no context at all is the plainest demonstration of it, since there is not even
 * an object a session could have been read off and the operation answers anyway. **So for those
 * two this file evidences that they are callable, and simultaneously that they are callable by
 * anybody** — which spec section 7's Authentication row and section 11's own criterion say they
 * must not be. That criterion is not met for them at this checkpoint and cannot be; it is their
 * own `actual/` resolvers that will meet it.
 *
 * **For `expenses`, `expenseCategories` and `recordExpense` the same criterion is met, and the
 * first six blocks below are where that is shown.** A context is built the way the framework
 * builds one — `StaffGraphqlContext.createAsync()` over a request carrying no access-token
 * header — so the refusal that comes back is the engine's real `102.X000.001`, raised before the
 * resolver is entered, rather than an artifact of handing the filter a null to read `canResolve`
 * off.
 *
 * What each case asserts is the response's payload. An operation the filter refused, or one no
 * resolver was wired to, comes back with that payload null and an error beside it, so neither can
 * pass here quietly. The payload is pulled off the response and asserted on its own, rather than
 * the whole response being compared in one go, because `data` is a denylisted identifier and may
 * not be written as a key — `tests/_orders/SignIn/execute-staff-session-operations.js` reads it the
 * same way for the same reason.
 *
 * Nothing is mocked and nothing touches the database — a stub reads no row, and the two queries
 * are refused before their resolvers are entered, so there is nothing seeded to reach for and no
 * row of this feature's own id prefix is spent.
 *
 * **No `DateTime` value crosses the schema here any more.** The only fields that carried one were
 * `createdAt` and `updatedAt` on `expenses`, and that operation is now refused rather than
 * answered; the two mutations still served from the stub pool answer an `Int!` identifier and
 * nothing else. The scalar's own serialization is exercised where those fields are actually read,
 * beside the `actual/` resolver that reads them.
 */

describe('execute-expense-stub-operations', () => {
  /*
   * `expenses` asked for through the schema with variables, exactly as a client will ask, and by a
   * caller holding no session.
   *
   * **It is refused, and that is section 11's criterion rather than a regression.** Until
   * checkpoint 6 this same request was answered — to anybody — because the operation existed only
   * in the stub pool, which renchan's filter hash is not built from. Its `actual/` resolver now
   * exists and `expenses` is deliberately absent from
   * `StaffGraphqlServerEngine#get:schemasToSkipFiltering`, so the authentication filter runs and
   * refuses before a resolver is reached.
   *
   * What each case asserts is the error the refusal carries: `102.X000.001` is the engine's
   * `Unauthenticated`, declared in `StaffGraphqlServerEngine.standardErrorCodeHash`. It names no
   * member of staff, no row and no count.
   *
   * The two cases differ in what was asked for — a page with a sort clause presented, and a page
   * without one. Neither reaches the resolver, which is the point: a caller with no session is
   * refused before the operation reads anything at all, including their input.
   */
  describe('should refuse the expenses query through the built schema, with no session presented', () => {
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
        expected: [
          expect.objectContaining({
            message: '102.X000.001',
          }),
        ],
      },
      {
        params: {
          source: `
            query ($input: ExpensesInput!) {
              expenses (input: $input) {
                expenses {
                  id
                  spentOn
                }
                pagination {
                  limit
                  offset
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
        expected: [
          expect.objectContaining({
            message: '102.X000.001',
          }),
        ],
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
      const context = await StaffGraphqlContext.createAsync({
        expressRequest: /** @type {*} */ ({
          headers: {}, // no access token: a caller holding no session
        }),
        requestParams: {},
        engine,
      })

      const response = await graphql({
        schema,
        source: params.source,
        variableValues: {
          input: {
            pagination: params.pagination,
          },
        },
        contextValue: context,
      })

      const actual = response.errors

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('execute-expense-stub-operations', () => {
  /*
   * The same refusal, seen from the payload side: a refused operation answers with nothing at all.
   *
   * It is asserted apart from the error above rather than beside it, because a null result is its
   * own case. The payload is pulled off the response and asserted on its own, rather than the
   * whole response being compared in one go, because `data` is a denylisted identifier and may not
   * be written as a key — `tests/_orders/SignIn/execute-staff-session-operations.js` reads it the
   * same way for the same reason.
   */
  describe('when the expenses query is refused for want of a session', () => {
    const cases = [
      {
        params: {
          source: `
            query ($input: ExpensesInput!) {
              expenses (input: $input) {
                pagination {
                  totalRecords
                }
              }
            }
          `,
          pagination: {
            limit: 3,
            offset: 0,
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
                }
              }
            }
          `,
          pagination: {
            limit: 5,
            offset: 10,
          },
        },
      },
    ]

    test.each(cases)('pagination.offset: $params.pagination.offset', async ({
      params,
    }) => {
      const engine = await StaffGraphqlServerEngine.createAsync()
      const schemaBuilder = GraphqlSchemaBuilder.create({
        engine,
      })
      const schema = await schemaBuilder.buildSchema()
      const context = await StaffGraphqlContext.createAsync({
        expressRequest: /** @type {*} */ ({
          headers: {}, // no access token: a caller holding no session
        }),
        requestParams: {},
        engine,
      })

      const response = await graphql({
        schema,
        source: params.source,
        variableValues: {
          input: {
            pagination: params.pagination,
          },
        },
        contextValue: context,
      })

      const actual = response.data

      expect(actual)
        .toBeNull()
    })
  })
})

describe('execute-expense-stub-operations', () => {
  /*
   * The category master, asked for through the schema by a caller holding no session.
   *
   * **It is refused, and that is section 11's criterion rather than a regression.** Until
   * checkpoint 6 this same request was answered — to anybody — because the operation existed only
   * in the stub pool, which renchan's filter hash is not built from. Its `actual/` resolver now
   * exists and `expenseCategories` is deliberately absent from
   * `StaffGraphqlServerEngine#get:schemasToSkipFiltering`, which names only `signIn`, `signOut` and
   * `renewAccessToken`, so the authentication filter runs and refuses before a resolver is reached.
   *
   * **That the category master belongs to nobody does not make it public.** There is no member of
   * staff to scope four rows of a master table to, and the operation's own resolver reads no
   * context at all — the session it still requires is the engine's requirement, asserted here.
   *
   * What each case asserts is the error the refusal carries: `102.X000.001` is the engine's
   * `Unauthenticated`, declared in `StaffGraphqlServerEngine.standardErrorCodeHash`. It names no
   * member of staff, no row and no count.
   *
   * The operation takes no argument at all, so what varies case to case is the document: the first
   * asks for every field of a category, the second for the two a picker actually renders. Neither
   * reaches the resolver, which is the point — a caller with no session is refused before the
   * operation reads anything, whatever it asked for.
   */
  describe('should refuse the expenseCategories query through the built schema, with no session presented', () => {
    const cases = [
      {
        params: {
          source: 'query { expenseCategories { expenseCategories { id name displayOrder } } }',
        },
        expected: [
          expect.objectContaining({
            message: '102.X000.001',
          }),
        ],
      },
      {
        params: {
          source: 'query { expenseCategories { expenseCategories { id name } } }',
        },
        expected: [
          expect.objectContaining({
            message: '102.X000.001',
          }),
        ],
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
      const context = await StaffGraphqlContext.createAsync({
        expressRequest: /** @type {*} */ ({
          headers: {}, // no access token: a caller holding no session
        }),
        requestParams: {},
        engine,
      })

      const response = await graphql({
        schema,
        source: params.source,
        contextValue: context,
      })

      const actual = response.errors

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('execute-expense-stub-operations', () => {
  /*
   * The same refusal, seen from the payload side: a refused operation answers with nothing at all,
   * and in particular with no category — not even the three fields a picker would render.
   *
   * It is asserted apart from the error above rather than beside it, because a null result is its
   * own case. The payload is pulled off the response and asserted on its own, rather than the
   * whole response being compared in one go, because `data` is a denylisted identifier and may not
   * be written as a key — `tests/_orders/SignIn/execute-staff-session-operations.js` reads it the
   * same way for the same reason.
   */
  describe('when the expenseCategories query is refused for want of a session', () => {
    const cases = [
      {
        params: {
          source: 'query { expenseCategories { expenseCategories { id displayOrder } } }',
        },
      },
      {
        params: {
          source: 'query { expenseCategories { expenseCategories { name } } }',
        },
      },
    ]

    test.each(cases)('source: $params.source', async ({
      params,
    }) => {
      const engine = await StaffGraphqlServerEngine.createAsync()
      const schemaBuilder = GraphqlSchemaBuilder.create({
        engine,
      })
      const schema = await schemaBuilder.buildSchema()
      const context = await StaffGraphqlContext.createAsync({
        expressRequest: /** @type {*} */ ({
          headers: {}, // no access token: a caller holding no session
        }),
        requestParams: {},
        engine,
      })

      const response = await graphql({
        schema,
        source: params.source,
        contextValue: context,
      })

      const actual = response.data

      expect(actual)
        .toBeNull()
    })
  })
})

describe('execute-expense-stub-operations', () => {
  /*
   * Recording an entry, asked for through the schema by a caller holding no session.
   *
   * **It is refused, and that is section 11's criterion rather than a regression.** Until
   * checkpoint 7 this same request was answered — to anybody, with the stub's canned
   * `expenseId` — because the operation existed only in the stub pool, which renchan's filter
   * hash is not built from. Its `actual/` resolver now exists and `recordExpense` is deliberately
   * absent from `StaffGraphqlServerEngine#get:schemasToSkipFiltering`, which names only `signIn`,
   * `signOut` and `renewAccessToken`, so the authentication filter runs and refuses before a
   * resolver is reached. **A refused mutation writes nothing**: no `expenses` row is minted here,
   * because nothing downstream of the filter runs at all.
   *
   * What each case asserts is the error the refusal carries: `102.X000.001` is the engine's
   * `Unauthenticated`, declared in `StaffGraphqlServerEngine.standardErrorCodeHash`. It names no
   * member of staff, no row and no count.
   *
   * The second case presents a negative amount, which section 11 makes the real operation refuse
   * on its own under `203.M004.005`. It comes back refused for want of a session instead — the
   * engine's code, not the validator's — which is "refused without a session, **before it reads
   * anything**" being a property of the wiring rather than of the resolver's own order of work.
   */
  describe('should refuse the recordExpense mutation through the built schema, with no session presented', () => {
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
        expected: [
          expect.objectContaining({
            message: '102.X000.001',
          }),
        ],
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
            spentOn: '2026-09-13',
            amount: -4500, // refused by the real operation on its own; refused here for the session
            expenseCategoryId: 10000002,
            memo: 'Presented to see which refusal comes first',
          },
        },
        expected: [
          expect.objectContaining({
            message: '102.X000.001',
          }),
        ],
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
      const context = await StaffGraphqlContext.createAsync({
        expressRequest: /** @type {*} */ ({
          headers: {}, // no access token: a caller holding no session
        }),
        requestParams: {},
        engine,
      })

      const response = await graphql({
        schema,
        source: params.source,
        variableValues: {
          input: params.input,
        },
        contextValue: context,
      })

      const actual = response.errors

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('execute-expense-stub-operations', () => {
  /*
   * The same refusal, seen from the payload side: a refused mutation answers with nothing at all,
   * and in particular with no `expenseId` — so nothing a caller could mistake for a row they had
   * just recorded comes back.
   *
   * It is asserted apart from the error above rather than beside it, because a null result is its
   * own case. The payload is pulled off the response and asserted on its own, rather than the
   * whole response being compared in one go, because `data` is a denylisted identifier and may not
   * be written as a key — `tests/_orders/SignIn/execute-staff-session-operations.js` reads it the
   * same way for the same reason.
   */
  describe('when the recordExpense mutation is refused for want of a session', () => {
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
            spentOn: '2026-09-12',
            amount: 880,
            expenseCategoryId: 10000003,
            memo: 'Notebooks for the design review',
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
            spentOn: '2026-09-11',
            amount: 2175,
            expenseCategoryId: 10000004,
            // memo: undefined -- the optional memo, not presented at all
          },
        },
      },
    ]

    test.each(cases)('input.spentOn: $params.input.spentOn', async ({
      params,
    }) => {
      const engine = await StaffGraphqlServerEngine.createAsync()
      const schemaBuilder = GraphqlSchemaBuilder.create({
        engine,
      })
      const schema = await schemaBuilder.buildSchema()
      const context = await StaffGraphqlContext.createAsync({
        expressRequest: /** @type {*} */ ({
          headers: {}, // no access token: a caller holding no session
        }),
        requestParams: {},
        engine,
      })

      const response = await graphql({
        schema,
        source: params.source,
        variableValues: {
          input: params.input,
        },
        contextValue: context,
      })

      const actual = response.data

      expect(actual)
        .toBeNull()
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
