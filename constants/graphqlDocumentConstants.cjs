'use strict'

/*
 * The shape a single GraphQL operation may have before this product refuses to run it.
 *
 * **What these two numbers are for.** A GraphQL document may ask for the same field many times
 * over, under different aliases, and every one of them runs. `MAX_JSON_BODY_SIZE` in
 * `server/graphql/StaffGraphqlServerEngine.js` caps the body at sixteen kilobytes, and one aliased
 * call is about sixty-two bytes:
 *
 *   a1:expenses(input:{pagination:{limit:100,offset:0}}){expenses{id}}
 *
 * so one HTTP request can hold on the order of two hundred and fifty of them. Each one runs a
 * `count()` and a `findAll()` of up to a hundred rows with `ExpenseCategory` joined — roughly five
 * hundred database round trips for one request, on a path no rate limit covers
 * (`express-rate-limit` is wired only into the two limits under `app/tools/rateLimit/limits/`,
 * neither of which counts a read). The body cap alone does not close it, because the body is small
 * and the work is not.
 *
 * -----------------------------------------------------------------------------------------------
 * MAXIMUM_ROOT_SELECTION_COUNT -- measured, not rounded
 * -----------------------------------------------------------------------------------------------
 *
 * **Every document this product actually sends asks for exactly one root field.** All twenty-four
 * operations written down in this repository and in `expense-note-frontend-staff` were parsed and
 * counted before this number was chosen, and the histogram is `{ 1: 24 }` -- the four sign-in
 * payloads, the `signedInStaffMember` query, and every document in
 * `tests/__tests__/server/graphql/resolvers/staff/stub/execute-expense-stub-operations.js`.
 *
 * The widest root type the staff schema declares is `Mutation`, with six fields (`signIn`,
 * `signOut`, `renewAccessToken`, `recordExpense`, `correctExpense`, `removeExpense`), so a
 * document asking for every operation of one kind at once -- which nothing does, but which is not
 * abusive -- reaches six. **Ten clears that by four**, which is room for four more operations to
 * be added to one root type by a later feature without anybody having to revisit this number, and
 * it cuts the two-hundred-and-fifty-fold amplification above to a tenfold one.
 *
 * -----------------------------------------------------------------------------------------------
 * MAXIMUM_SELECTION_DEPTH -- measured, not rounded
 * -----------------------------------------------------------------------------------------------
 *
 * **The deepest legitimate document this product has is four levels deep**, and it is the one in
 * the stub-execution suite named above:
 *
 *   expenses -> expenses -> expenseCategory -> name        (4)
 *   expenses -> pagination -> sort -> key                  (4)
 *
 * Everything else is two or three. **Six clears four by two**, which is room for one more nested
 * object under `expenseCategory` or inside `pagination` -- the two places a field could plausibly
 * be nested next -- without this number being touched.
 *
 * **What the depth limit is honestly for.** The staff schema declares no cyclic type today:
 * `Expense` points at `ExpenseCategory` and `ExpenseCategory` points back at nothing, so GraphQL's
 * own validation already refuses anything deeper than the schema nests, and this limit catches
 * nothing that is reachable now. It is there for the day a type does point back -- an
 * `ExpenseCategory.expenses` field would make an arbitrarily deep document legal, and the cost of
 * it exponential. Written now, it costs nothing; written then, it is written after the incident.
 *
 * **Introspection is exempt, and the number is why.** `getIntrospectionQuery()` was parsed and
 * measured: it is **fifteen** levels deep, because `TypeRef` unwraps `ofType` nine times. A cap
 * that cleared it would clear everything worth capping. So the depth of a selection rooted at a
 * meta-field (`__schema`, `__type`, `__typename`) is not counted at all -- see
 * `app/tools/graphql/GraphqlOperationShapeInspector.js`. Nothing is lost by exempting it: no
 * resolver of this application runs for a meta-field and no row is read, and the engine's own
 * `MAX_JSON_BODY_SIZE` comment says in writing that the sixteen-kilobyte cap was sized to leave
 * room for exactly this query.
 *
 * -----------------------------------------------------------------------------------------------
 *
 * Both numbers are implementation choices, in the same standing as `PAGINATION.MAXIMUM_LIMIT`:
 * spec section 7 fixes no shape limit on a document, so neither is derived from the specification.
 * Unlike that one they refuse nothing any declared screen does -- the measurement above is what
 * makes that claim rather than a hope -- so neither needs a person to settle it before it is safe
 * to apply. **A later screen that genuinely needs more is a specification change**, raised as one,
 * not a number quietly raised here.
 */
module.exports = {
  GRAPHQL_DOCUMENT: {
    MAXIMUM_ROOT_SELECTION_COUNT: 10,
    MAXIMUM_SELECTION_DEPTH: 6,
  },
}
