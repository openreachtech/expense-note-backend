/*
 * The stable id of every operation of the staff audience.
 *
 * An id is this audience's own identity for one schema field, and it is what a resolver's error
 * codes embed: `203.M001.001` is the first input-validator error of `signIn`. The id therefore
 * outlives any renaming of the operation and must never be reused for another one.
 *
 * `Q###` for a query, `M###` for a mutation — the letter already carries the kind, so `M001` and
 * `Q001` coexist. Numbering is plain and sequential within each kind, not blocked per feature:
 * `#sign-in` opens the file with the four operations below, and `#expense-entry` and
 * `#monthly-summary` append theirs in the order `_plan.md` fixes.
 *
 * Every query and every mutation of this audience holds an entry here, including one that
 * declares no error code of its own.
 */
const STAFF_RESOLVER_ID_HASH = {
  query: {
    signedInStaffMember: 'Q001',

    expenses: 'Q002',
    expenseCategories: 'Q003',
  },

  mutation: {
    signIn: 'M001',
    signOut: 'M002',
    renewAccessToken: 'M003',

    recordExpense: 'M004',
    correctExpense: 'M005',
    removeExpense: 'M006',
  },
}

export default STAFF_RESOLVER_ID_HASH
