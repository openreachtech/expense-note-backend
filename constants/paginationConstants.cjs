'use strict'

/*
 * The largest page any operation in 1.0.0 will serve.
 *
 * `PaginationInput.limit` is `Int!`, and nothing in the specification fixes a ceiling -- not
 * section 11, not section 7's non-functional requirements, not the pinned contract. So a caller
 * could ask for a hundred thousand rows and be served them, with every category joined. That is
 * not a live defect while a member of staff has a few hundred expenses, but the shape is permanent
 * while the data is not, and `#monthly-summary` inherits this pagination shape.
 *
 * **`100` is DECIDED, and section 7 is now its authority rather than this file.** Spec section 7
 * carries a `Page size` row: a paginated read answers at most 100 rows per request, and a larger
 * `limit` is refused as invalid input rather than silently reduced. `monthlyExpenses` inherits the
 * same ceiling by that row's own words. **Read the spec, not this comment, for what the rule is** --
 * this constant implements it.
 *
 * **The provenance is kept whole because each step of it did different work.** The number was
 * SUGGESTED by the peer session driving this work, on the reasoning section 7 now carries: section
 * 3 foresees fifty members of staff within two years, and no screen in section 11 or 12 shows more
 * than one person's own entries. It was then PROPOSED as section 7's own row, with the alternatives
 * and the arguments against each set out so somebody could reject it on its merits. And it was
 * DECIDED by the user, who chose it over a different number and over leaving it open.
 *
 * **A suggestion is not a decision, and that distinction is why this ended up in the spec at all.**
 * An earlier draft of this comment recorded the value as chosen-not-confirmed precisely so it could
 * not be mistaken for settled; that label is now wrong, and correcting it is the last step of the
 * chain rather than a tidy-up.
 *
 * Refused rather than clamped, and that half is section 7's too: silently reducing 500 to 100 hands
 * a screen a truncated list that looks complete, and the caller learns otherwise only by reading a
 * pagination block it had no reason to doubt.
 *
 * If a later screen genuinely needs a larger page, **that is a change to section 7's row rather
 * than a number raised quietly here**.
 */
module.exports = {
  PAGINATION: {
    MAXIMUM_LIMIT: 100,
  },
}
