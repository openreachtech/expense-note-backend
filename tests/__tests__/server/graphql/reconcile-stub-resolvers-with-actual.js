import {
  GraphqlResolversBuilder,
} from '@openreachtech/renchan'

import StaffGraphqlServerEngine from '../../../../server/graphql/StaffGraphqlServerEngine.js'
import AdminGraphqlServerEngine from '../../../../server/graphql/AdminGraphqlServerEngine.js'
import CustomerGraphqlServerEngine from '../../../../server/graphql/CustomerGraphqlServerEngine.js'

/*
 * Every operation an audience can serve from its stub pool must also exist in its actual pool.
 *
 * -----------------------------------------------------------------------------------------------
 * The mechanism this guards, read out of renchan rather than assumed
 * -----------------------------------------------------------------------------------------------
 *
 * `GraphqlResolversBuilder#buildResolverHash()` builds the resolver map from the **union** of the
 * two pools' schema names, and resolves each one `actualResolverSchemaHash[it] ??
 * stubResolverSchemaHash[it]` — so a name present only in the stub pool is served, by the stub.
 *
 * The authentication filter map is built differently. `.buildFilterSchemaHash()` is handed
 * `extractSchemas({ schemaHash: actualResolverSchemaHash })` — the **actual** names alone — as
 * `allowedSchemas`, and `FilterSchemaHashBuilder#buildSchemaHash()` emits an entry only for a name
 * on that list or on `ignoredSchemas`. A stub-only name is on neither, so `filterSchemaHash[it]` is
 * `undefined`, and the resolver wrapper invokes it as `await filter?.(envelope)` — which for
 * `undefined` is a no-op.
 *
 * **The result is an operation served with no authentication filter at all.** No `Unauthenticated`,
 * no `Unauthorized`, no `DeniedSchemaPermission` — the three refusals
 * `StaffGraphqlServerEngine#generateFilterHandler()` exists to raise. Not skipped by being named in
 * `schemasToSkipFiltering`, where an entry is at least deliberate and reviewable: skipped because
 * nothing ever built a filter for it.
 *
 * -----------------------------------------------------------------------------------------------
 * It is not live today, and that is the point
 * -----------------------------------------------------------------------------------------------
 *
 * Every operation of every audience currently has both an actual and a stub, so the actual always
 * wins and everything is filtered. **The hazard is the future**: deleting or renaming one `actual/`
 * resolver would silently convert its operation into an unauthenticated stub answering fabricated
 * success. `#expense-entry` added five such pairs, three of them mutations — `recordExpense`,
 * `correctExpense` and `removeExpense`, which write.
 *
 * A stub is a plausible thing to delete by hand and a resolver is a plausible thing to rename, and
 * neither change looks like a security change while it is being made. This is the test that makes
 * it look like one.
 *
 * -----------------------------------------------------------------------------------------------
 * Why both sets come from the loader and not from a list written here
 * -----------------------------------------------------------------------------------------------
 *
 * The two pools are read through `GraphqlResolversBuilder.createAsync({ engine })` — the same class
 * the running server builds its resolver map with, handed the same engine, reading the same
 * `actualResolversPath` and `stubResolversPath` off that engine's own config, through the same
 * loader. **A hand-written list of operation names would rot into exactly the false pass this
 * guards against**: somebody deletes the actual resolver, forgets the list, and the test goes on
 * asserting about a pair of names that no longer describe the tree.
 *
 * Each schema name is also the resolver's own `static get schema ()` rather than its filename, so a
 * class whose getter is misspelled shows up here as the name it actually registers.
 *
 * -----------------------------------------------------------------------------------------------
 * All three audiences, not only staff
 * -----------------------------------------------------------------------------------------------
 *
 * `admin` and `customer` are untouched boilerplate — one `healthCheck` query apiece, reading no row
 * — so nothing there is worth stealing today. They are checked anyway because the check costs one
 * case each and derives everything it asserts, and because the mechanism is renchan's rather than
 * this audience's: an engine added later inherits the hazard the moment its first operation is
 * written, and inherits this guard at the same time.
 */

describe('reconcile-stub-resolvers-with-actual', () => {
  /*
   * `expect.arrayContaining` is built in the Arrange phase rather than written into each case,
   * because what it contains is the stub pool the loader found — which is the whole point, and
   * cannot be known when the cases are declared. The assertion line itself stays a plain
   * `toEqual(expected)`.
   */
  describe('to leave no stub operation without an actual counterpart', () => {
    const cases = [
      {
        params: {
          audience: 'staff',
          Engine: StaffGraphqlServerEngine,
        },
      },
      {
        params: {
          audience: 'admin',
          Engine: AdminGraphqlServerEngine,
        },
      },
      {
        params: {
          audience: 'customer',
          Engine: CustomerGraphqlServerEngine,
        },
      },
    ]

    test.each(cases)('audience: $params.audience', async ({
      params,
    }) => {
      const engine = await params.Engine.createAsync()
      const resolversBuilder = await GraphqlResolversBuilder.createAsync({
        engine,
      })
      const expected = expect.arrayContaining(
        Object.keys(resolversBuilder.stubResolverSchemaHash)
      )

      const actual = Object.keys(resolversBuilder.actualResolverSchemaHash)

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('reconcile-stub-resolvers-with-actual', () => {
  /*
   * The subset check above passes vacuously against an empty stub pool, so one operation per
   * audience is named here as a sentinel — a loader that found nothing, or a path that stopped
   * resolving, fails here rather than going green up there.
   *
   * These three names are **not** the list being guarded, which is why naming them by hand does not
   * reintroduce the rot the class comment refuses. They are the cheapest possible evidence that the
   * loader read a real directory: one of them going missing is a failure worth looking at either
   * way.
   */
  describe('to load a stub pool that is not empty', () => {
    const cases = [
      {
        params: {
          audience: 'staff',
          Engine: StaffGraphqlServerEngine,
        },
        expected: expect.arrayContaining([
          'expenses',
        ]),
      },
      {
        params: {
          audience: 'admin',
          Engine: AdminGraphqlServerEngine,
        },
        expected: expect.arrayContaining([
          'healthCheck',
        ]),
      },
      {
        params: {
          audience: 'customer',
          Engine: CustomerGraphqlServerEngine,
        },
        expected: expect.arrayContaining([
          'healthCheck',
        ]),
      },
    ]

    test.each(cases)('audience: $params.audience', async ({
      params,
      expected,
    }) => {
      const engine = await params.Engine.createAsync()
      const resolversBuilder = await GraphqlResolversBuilder.createAsync({
        engine,
      })

      const actual = Object.keys(resolversBuilder.stubResolverSchemaHash)

      expect(actual)
        .toEqual(expected)
    })
  })
})
