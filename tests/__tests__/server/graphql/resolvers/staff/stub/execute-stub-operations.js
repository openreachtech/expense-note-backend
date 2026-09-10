import {
  graphql,
} from 'graphql'

import {
  GraphqlSchemaBuilder,
} from '@openreachtech/renchan'

import StaffGraphqlServerEngine from '../../../../../../../server/graphql/StaffGraphqlServerEngine.js'

describe('execute-stub-operations', () => {
  /*
   * The four stubs, executed as a caller reaches them: through the audience's own executable
   * schema, built by the same `GraphqlSchemaBuilder` the running server builds it with, so the
   * SDL under server/graphql/schemas/staff/ validates every field and every type on the way out.
   * A stub whose returned shape drifted from the schema fails here with a GraphQL error rather
   * than being discovered by the frontend against the real API.
   *
   * Executing in process, not over HTTP, is deliberate: `server/index.js` cannot boot on a
   * Windows machine at all (`ERR_UNSUPPORTED_ESM_URL_SCHEME`, recorded as Q24 and older than this
   * feature), so an HTTP probe would say nothing about these stubs. This is the same code path
   * minus the socket.
   *
   * `contextValue` is null on purpose. A field served from the stub pool is handed no
   * authentication filter — renchan builds `filterSchemaHash` from the `actual/` pool alone — so
   * nothing on this path reads a context, and passing one would suggest a check that is not
   * happening.
   */
  describe('to answer every operation of this audience with schema-accurate hardcoded data', () => {
    const cases = [
      {
        params: {
          source: 'mutation { signIn(input: { email: "caller@example.invalid", password: "caller-password" }) { staffMemberId accessToken } }',
        },
        expected: {
          signIn: {
            staffMemberId: 9001,
            accessToken: 'stub-access-token-from-sign-in-0001',
          },
        },
      },
      {
        params: {
          source: 'mutation { signOut { signedOut } }',
        },
        expected: {
          signOut: {
            signedOut: true,
          },
        },
      },
      {
        params: {
          source: 'mutation { renewAccessToken { accessToken } }',
        },
        expected: {
          renewAccessToken: {
            accessToken: 'stub-access-token-from-renew-0002',
          },
        },
      },
      {
        params: {
          source: 'query { signedInStaffMember { staffMemberId name email } }',
        },
        expected: {
          signedInStaffMember: {
            staffMemberId: 9001,
            name: 'Stub Member Of Staff',
            email: 'stub-member-of-staff@example.invalid',
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

      const actual = await graphql({
        schema,
        source: params.source,
        contextValue: null, // no context: a stub-served field is handed no filter to read one
      })

      expect(actual.data)
        .toEqual(expected)

      // A GraphQL error arrives as a sibling `errors` key with `data` still present, so
      // asserting the payload alone would let one pass unnoticed. The envelope itself cannot be
      // written as an expected literal: `data` is on the `id-denylist`.
      expect(actual)
        .not
        .toHaveProperty('errors')
    })
  })
})
