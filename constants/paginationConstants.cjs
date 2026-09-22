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
 * **`100` is CHOSEN, not derived, and it is not yet confirmed by the user.** It was proposed by
 * the peer session driving this work, on this reasoning: section 3 says about twenty members of
 * staff today and perhaps fifty within two years, and no screen in section 11 or section 12 shows
 * more than one person's month of expenses -- so a hundred sits comfortably above every real
 * screen and far below a denial of service.
 *
 * **A peer cannot settle this and did not.** A maximum page size changes what a caller may do: at
 * 101 they are refused. That is the same test the two section 11 clarifications and Q49 were held
 * to, and all three went to a person. Q50's own entry says where it belongs -- section 7's
 * non-functional requirements -- so the sentence is proposed as its own pull request and this
 * value stands as an implementation choice until somebody answers it.
 *
 * If the answer differs, this constant changes and so does the one test literal asserting it. If a
 * later screen genuinely needs a larger page, **that is a specification change rather than a
 * number raised quietly here** -- which is the clause that makes choosing a value now safe.
 */
module.exports = {
  PAGINATION: {
    MAXIMUM_LIMIT: 100,
  },
}
