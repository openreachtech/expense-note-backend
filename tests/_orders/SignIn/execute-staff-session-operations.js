import {
  graphql,
} from 'graphql'

import {
  GraphqlSchemaBuilder,
} from '@openreachtech/renchan'

import StaffGraphqlServerEngine from '../../../server/graphql/StaffGraphqlServerEngine.js'
import StaffGraphqlContext from '../../../server/graphql/contexts/StaffGraphqlContext.js'

/*
 * The staff audience driven end to end, as a caller reaches it: through the audience's own
 * executable schema, built by the same `GraphqlSchemaBuilder` the running server builds it with,
 * with a real `StaffGraphqlContext` per request. Every other test in this suite exercises one
 * class; this one exercises the audience as a whole, which is the only place the four operations
 * are seen answering each other.
 *
 * **Why it sits here and not beside the stubs.** It began at checkpoint 4 as
 * `tests/__tests__/server/graphql/resolvers/staff/stub/execute-stub-operations.js`, when this
 * audience had stub resolvers alone: it passed `contextValue: null` and asserted the stubs'
 * hardcoded literals, because with an empty `actual/` pool nothing read a context and no
 * authentication filter was built. Checkpoint 6 landed an `actual/` resolver for all four
 * operations, and the framework prefers actual over stub
 * (`actualResolverSchemaHash[it] ?? stubResolverSchemaHash[it]`), so that premise is gone — the
 * real resolvers answer, they read a context, and the filter hash now exists. The stubs are
 * untouched and stay in place for the frontend; what was obsolete was this file's premise, not
 * them. Its subject is now the real API, and the real API writes rows — `signIn` mints a session
 * and `signOut` revokes one — so by the per-method placement rule it belongs under
 * `tests/_orders/`, in this feature's domain folder, and in that folder's `_.test.js` barrel.
 *
 * Executing in process rather than over HTTP is still deliberate: `server/index.js` cannot boot on
 * a Windows machine at all (`ERR_UNSUPPORTED_ESM_URL_SCHEME`, recorded as Q24 and older than this
 * feature), so an HTTP probe would say nothing. This is the same code path minus the socket.
 *
 * **What the express request has to carry, and nothing more.** `BaseGraphqlContext.createAsync()`
 * reads the access token off `#headers['x-renchan-access-token']`, and
 * `RefreshTokenExpressCookieClerk` reads the cookie off `#headers.cookie` and writes one through
 * `BaseAppGraphqlContext#get:expressResponse`, which renchan leaves reachable at
 * `expressRequest['context'].res`. So each fixture below carries a `headers` object plus, where a
 * cookie is written, a response holding the one method the clerk calls. `headers` is present even
 * when empty, because `.extractAccessToken()` falls through to `requestParams` when it is absent
 * and there are no websocket request params here. The express response is the one thing faked: it
 * is the socket boundary rather than the code under test, and in process there is no response to
 * be had.
 *
 * Everything else runs for real — the schema, the resolvers, the validator, the encipher, the
 * session clerk, the cookie clerk and the database. Nothing is stubbed to steer a branch. The
 * members of staff are the seeded ones
 * (`sequelize/seeders/development/20260910120001-000001-staff_members.cjs`), signed in with the
 * plaintext passwords recorded against their digests in the password-hash seeder, so no row is
 * created by hand and no id from this feature's prefix is spent here.
 *
 * The instants are given explicitly as each request's `requestedAt` rather than left to the clock,
 * for two reasons: an access token lives fifteen minutes, and every step below has to fall inside
 * that window so that a refusal can only be the sign-out's doing; and the sign-in failure limit
 * counts by a window ending at `#now`, so a fixed instant keeps this file clear of the attempt
 * rows the other tests in this folder write.
 *
 * No token, digest or address is printed anywhere: what a case names is the address a member of
 * staff signs in with, which the operation itself answers with, and the tokens exist only as
 * values handed from one step to the next.
 */

describe('execute-staff-session-operations', () => {
  /*
   * Spec section 10, verbatim: "a session survives a page reload, and stops working the moment its
   * holder signs out." No single operation can answer for it — a reload is `signedInStaffMember`
   * asked a second time with the token the browser kept, and signing out is `signOut` — so it is
   * driven here as the sequence it describes.
   *
   * **The fourth step is the point of the test, and it is arranged so that it can fail.** It
   * presents the *same* access token as the second step, at an instant still inside that token's
   * fifteen minutes, so expiry cannot account for the refusal: the only thing between the two is
   * the sign-out, which deletes every access token of the series. Were `signOut` to revoke
   * nothing, the fourth step would answer exactly as the second did and this test would fail.
   *
   * Step one is asserted by being spent rather than by being inspected: the access token it
   * returned is what step two authenticates with, and the refresh token it wrote into the cookie
   * is what step three signs out with, so neither can be missing and leave this green. The
   * attributes the cookie was *written* with are pinned by
   * `tests/_orders/SignIn/SignInMutationResolver.js` and are not restated here.
   *
   * The attributes it is *cleared* with are asserted, because they are read off the live engine
   * config here rather than off a fixture, and because clearing is the browser-side half of the
   * criterion: a browser handed a mismatched attribute set keeps the original cookie, and the
   * session appears to survive the sign-out even though its rows are gone.
   *
   * The sequence is the Act of this test, which is why four calls sit between the Arrange and the
   * Assert: the criterion is a sequence, and no assertion is interleaved between the calls.
   */
  describe('should carry a session across a reload, and refuse it the moment its holder signs out', () => {
    const cases = [
      {
        params: {
          signInSource: 'mutation ($input: SignInInput!) { signIn(input: $input) { staffMemberId accessToken } }',
          credentials: {
            email: 'nanami.doi@sub.expense-note.example', // seeded: Nanami Doi
            password: 'nanami-sunday-9376',
          },
          signedInAt: new Date('2026-10-05T09:00:00.000Z'),
          reloadSource: 'query { signedInStaffMember { staffMemberId name email } }',
          reloadedAt: new Date('2026-10-05T09:02:00.000Z'),
          signOutSource: 'mutation { signOut { signedOut } }',
          signedOutAt: new Date('2026-10-05T09:05:00.000Z'),
          revisitedAt: new Date('2026-10-05T09:06:00.000Z'), // six minutes in, so the token is still live
          refreshTokenCookieName: 'staff_refresh_token',
        },
        expected: {
          reloadAnswer: {
            signedInStaffMember: {
              staffMemberId: 10110007,
              name: 'Nanami Doi',
              email: 'nanami.doi@sub.expense-note.example',
            },
          },
          signOutAnswer: {
            signOut: {
              signedOut: true,
            },
          },
          refusalAfterSignOut: [
            expect.objectContaining({
              message: '102.X000.001', // Unauthenticated, the engine's own code
            }),
          ],
          clearedCookieArguments: [
            'staff_refresh_token',
            {
              httpOnly: true,
              secure: true,
              sameSite: 'lax',
              path: '/graphql-staff',
            },
          ],
        },
      },
      {
        params: {
          signInSource: 'mutation ($input: SignInInput!) { signIn(input: $input) { staffMemberId accessToken } }',
          credentials: {
            email: 'riku.hasegawa@expense-note.example', // seeded: Riku Hasegawa
            password: 'riku-january-2589',
          },
          signedInAt: new Date('2026-10-06T14:00:00.000Z'),
          reloadSource: 'query { signedInStaffMember { staffMemberId name email } }',
          reloadedAt: new Date('2026-10-06T14:03:00.000Z'),
          signOutSource: 'mutation { signOut { signedOut } }',
          signedOutAt: new Date('2026-10-06T14:10:00.000Z'),
          revisitedAt: new Date('2026-10-06T14:14:00.000Z'), // the last minute of the fifteen
          refreshTokenCookieName: 'staff_refresh_token',
        },
        expected: {
          reloadAnswer: {
            signedInStaffMember: {
              staffMemberId: 10110008,
              name: 'Riku Hasegawa',
              email: 'riku.hasegawa@expense-note.example',
            },
          },
          signOutAnswer: {
            signOut: {
              signedOut: true,
            },
          },
          refusalAfterSignOut: [
            expect.objectContaining({
              message: '102.X000.001', // Unauthenticated, the engine's own code
            }),
          ],
          clearedCookieArguments: [
            'staff_refresh_token',
            {
              httpOnly: true,
              secure: true,
              sameSite: 'lax',
              path: '/graphql-staff',
            },
          ],
        },
      },
    ]

    test.each(cases)('credentials.email: $params.credentials.email', async ({
      params,
      expected,
    }) => {
      const engine = await StaffGraphqlServerEngine.createAsync()
      const schemaBuilder = GraphqlSchemaBuilder.create({
        engine,
      })
      const schema = await schemaBuilder.buildSchema()
      const saveCookieSpy = jest.fn()
      const clearCookieSpy = jest.fn()

      // 1. Sign in. Neither credential is presented; a refresh-token cookie is written.
      const signInContext = await StaffGraphqlContext.createAsync({
        expressRequest: /** @type {*} */ ({
          headers: {},
          context: {
            res: {
              cookie: saveCookieSpy,
            },
          },
        }),
        requestParams: /** @type {*} */ (null),
        engine,
        requestedAt: params.signedInAt,
      })
      const signInResponse = await graphql({
        schema,
        source: params.signInSource,
        variableValues: {
          input: params.credentials,
        },
        contextValue: signInContext,
      })
      const {
        accessToken,
      } = /** @type {*} */ (signInResponse.data).signIn
      // The refresh token as the browser was handed it: the cookie clerk makes one call,
      // `res.cookie(name, token, options)`, and the token is its second argument.
      const [savedCookieArguments] = saveCookieSpy.mock.calls
      const [, refreshToken] = savedCookieArguments

      // 2. The reload: the same page asking again who is holding the session it kept.
      const reloadContext = await StaffGraphqlContext.createAsync({
        expressRequest: /** @type {*} */ ({
          headers: {
            'x-renchan-access-token': accessToken,
            cookie: `${params.refreshTokenCookieName}=${refreshToken}`,
          },
        }),
        requestParams: /** @type {*} */ (null),
        engine,
        requestedAt: params.reloadedAt,
      })
      const reloadResponse = await graphql({
        schema,
        source: params.reloadSource,
        contextValue: reloadContext,
      })

      // 3. Sign out, on the cookie alone. This operation has to work once the access token has
      // expired, so it authenticates by the refresh token and never by the header.
      const signOutContext = await StaffGraphqlContext.createAsync({
        expressRequest: /** @type {*} */ ({
          headers: {
            cookie: `${params.refreshTokenCookieName}=${refreshToken}`,
          },
          context: {
            res: {
              clearCookie: clearCookieSpy,
            },
          },
        }),
        requestParams: /** @type {*} */ (null),
        engine,
        requestedAt: params.signedOutAt,
      })
      const signOutResponse = await graphql({
        schema,
        source: params.signOutSource,
        contextValue: signOutContext,
      })

      // 4. The same access token once more, still inside its fifteen minutes.
      const revisitContext = await StaffGraphqlContext.createAsync({
        expressRequest: /** @type {*} */ ({
          headers: {
            'x-renchan-access-token': accessToken,
          },
        }),
        requestParams: /** @type {*} */ (null),
        engine,
        requestedAt: params.revisitedAt,
      })
      const revisitResponse = await graphql({
        schema,
        source: params.reloadSource,
        contextValue: revisitContext,
      })

      const actualOnReload = reloadResponse.data
      const actualOnSignOut = signOutResponse.data
      const actualAfterSignOut = revisitResponse.errors

      expect(actualOnReload)
        .toEqual(expected.reloadAnswer)

      expect(actualOnSignOut)
        .toEqual(expected.signOutAnswer)

      expect(actualAfterSignOut)
        .toEqual(expected.refusalAfterSignOut)

      expect(clearCookieSpy)
        .toHaveBeenCalledWith(...expected.clearedCookieArguments)
    })
  })
})

describe('execute-staff-session-operations', () => {
  /*
   * The other half of what keeps a session usable through a working day: an access token lives
   * fifteen minutes, so a page open longer than that renews it from the refresh cookie rather than
   * asking for the password again. Section 10 names no criterion for it, and no other test reaches
   * the renewal through the engine — `renewAccessToken` is exercised as a class in
   * `tests/_orders/SignIn/RenewAccessTokenMutationResolver.js`, but nothing else asks whether the
   * token it hands back actually authenticates anything.
   *
   * That is what this drives: sign in, renew on the cookie, then spend the *renewed* token on
   * `signedInStaffMember`. The answer names the member of staff who signed in, so the renewed
   * token belongs to that session and not merely to some session.
   *
   * The renewed token is asserted by shape, being freshly generated: sixty-four lower-case hex
   * characters, the thirty-two random bytes `SessionCredentialGenerator` mints.
   */
  describe('should hand back an access token that authenticates, renewed from the refresh cookie', () => {
    const cases = [
      {
        params: {
          signInSource: 'mutation ($input: SignInInput!) { signIn(input: $input) { staffMemberId accessToken } }',
          credentials: {
            email: 'aoi.tsuchiya@expense-note.example', // seeded: Aoi Tsuchiya
            password: 'aoi-february-8130',
          },
          signedInAt: new Date('2026-10-07T08:00:00.000Z'),
          renewSource: 'mutation { renewAccessToken { accessToken } }',
          renewedAt: new Date('2026-10-07T08:04:00.000Z'),
          reloadSource: 'query { signedInStaffMember { staffMemberId name email } }',
          reloadedAt: new Date('2026-10-07T08:06:00.000Z'),
          refreshTokenCookieName: 'staff_refresh_token',
        },
        expected: {
          signedInStaffMember: {
            staffMemberId: 10110009,
            name: 'Aoi Tsuchiya',
            email: 'aoi.tsuchiya@expense-note.example',
          },
        },
        expectedPattern: /^[0-9a-f]{64}$/u,
        expectedTotalLength: 64,
      },
      {
        params: {
          signInSource: 'mutation ($input: SignInInput!) { signIn(input: $input) { staffMemberId accessToken } }',
          credentials: {
            email: 'daiki.morishita@expense-note.example', // seeded: Daiki Morishita
            password: 'daiki-march-4703',
          },
          signedInAt: new Date('2026-10-08T16:00:00.000Z'),
          renewSource: 'mutation { renewAccessToken { accessToken } }',
          renewedAt: new Date('2026-10-08T16:09:00.000Z'),
          reloadSource: 'query { signedInStaffMember { staffMemberId name email } }',
          reloadedAt: new Date('2026-10-08T16:12:00.000Z'),
          refreshTokenCookieName: 'staff_refresh_token',
        },
        expected: {
          signedInStaffMember: {
            staffMemberId: 10110010,
            name: 'Daiki Morishita',
            email: 'daiki.morishita@expense-note.example',
          },
        },
        expectedPattern: /^[0-9a-f]{64}$/u,
        expectedTotalLength: 64,
      },
    ]

    test.each(cases)('credentials.email: $params.credentials.email', async ({
      params,
      expected,
      expectedPattern,
      expectedTotalLength,
    }) => {
      const engine = await StaffGraphqlServerEngine.createAsync()
      const schemaBuilder = GraphqlSchemaBuilder.create({
        engine,
      })
      const schema = await schemaBuilder.buildSchema()
      const saveCookieSpy = jest.fn()

      // 1. Sign in, for the refresh cookie the renewal is spent against.
      const signInContext = await StaffGraphqlContext.createAsync({
        expressRequest: /** @type {*} */ ({
          headers: {},
          context: {
            res: {
              cookie: saveCookieSpy,
            },
          },
        }),
        requestParams: /** @type {*} */ (null),
        engine,
        requestedAt: params.signedInAt,
      })
      await graphql({
        schema,
        source: params.signInSource,
        variableValues: {
          input: params.credentials,
        },
        contextValue: signInContext,
      })
      // The refresh token as the browser was handed it: the cookie clerk makes one call,
      // `res.cookie(name, token, options)`, and the token is its second argument.
      const [savedCookieArguments] = saveCookieSpy.mock.calls
      const [, refreshToken] = savedCookieArguments

      // 2. Renew on the cookie alone, which is all this operation is given.
      const renewContext = await StaffGraphqlContext.createAsync({
        expressRequest: /** @type {*} */ ({
          headers: {
            cookie: `${params.refreshTokenCookieName}=${refreshToken}`,
          },
          context: {
            res: {
              cookie: saveCookieSpy,
            },
          },
        }),
        requestParams: /** @type {*} */ (null),
        engine,
        requestedAt: params.renewedAt,
      })
      const renewResponse = await graphql({
        schema,
        source: params.renewSource,
        contextValue: renewContext,
      })
      const {
        accessToken: renewedAccessToken,
      } = /** @type {*} */ (renewResponse.data).renewAccessToken

      // 3. Spend the renewed token, to see whether it authenticates the session it came from.
      const reloadContext = await StaffGraphqlContext.createAsync({
        expressRequest: /** @type {*} */ ({
          headers: {
            'x-renchan-access-token': renewedAccessToken,
          },
        }),
        requestParams: /** @type {*} */ (null),
        engine,
        requestedAt: params.reloadedAt,
      })
      const reloadResponse = await graphql({
        schema,
        source: params.reloadSource,
        contextValue: reloadContext,
      })

      const actual = reloadResponse.data

      expect(renewedAccessToken)
        .toMatch(expectedPattern)

      expect(renewedAccessToken)
        .toHaveLength(expectedTotalLength)

      expect(actual)
        .toEqual(expected)
    })
  })
})
