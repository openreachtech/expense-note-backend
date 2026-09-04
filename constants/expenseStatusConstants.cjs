'use strict'

/*
 * Status an expense row carries.
 *
 * `RECORDED` is the only value 1.0.0 writes. The column exists as the seam approval is built on
 * (spec 9.3), so a later version adds a key here rather than inventing a value at a call site.
 *
 * The four expense categories are deliberately NOT here. A category is a seeded row of
 * `expense_categories` with an id of its own (spec 9.2), never an enum written into the code, so
 * making them operator-editable later adds a screen and changes nothing else.
 */
module.exports = {
  EXPENSE_STATUS: {
    RECORDED: 'recorded',
  },
}
