# `tests/_orders/` — the suites that write to the database

A test belongs here when the method under test **writes** — directly, or by calling something that
does. Read-only methods go in `tests/__tests__/`, mirroring the source path. The split is by what
the method *does*, never by which class it belongs to, so one class is usually split across both
trees.

A new file here **must be added to its folder's `_.test.js` barrel** or it never runs.

## These suites assume a freshly seeded database, and that is deliberate

**`npm test` is the only supported way to run them.** `test.sh` tears the database down, sets it up
and seeds it — `db:teardown` → `db:setup` → `db:seed:master` → `db:seed:dev` — before either phase,
and runs `tests/__tests__/` to completion before `tests/_orders/`. Every suite here is written
against that fresh state and asserts **absolute** values against it.

**So these suites are not re-runnable on their own.** Running one twice without a refresh in between
fails, and the failures do not say why:

```
npx jest tests/_orders/Expense/_.test.js      # 59 passed
npx jest tests/_orders/Expense/_.test.js      # 23 failed  <- no refresh in between
```

They surface as unique-constraint violations from files that write rows with explicit ids, and as
row-count and read-back mismatches from files that assert a member of staff's page holds exactly
what one case put there. Neither names the real cause. **If you are iterating on one file with
`npx jest` directly, run `npm run db:refresh` first.**

On Windows both scripts need `npm_config_script_shell=bash` — they begin `export NODE_ENV=…`, and
npm defaults to `cmd.exe`, which answers `'export' is not recognized`.

## Do not "fix" this with relative assertions

The obvious repair — asserting *one more row than before* instead of an absolute count — is
**strictly worse**, because it passes when the operation writes the **wrong** row. The
fresh-database assumption is the right one. It only needed writing down, which is what this file is.

## Two rules about explicit row ids, which have both cost real diagnosis time

**Never give a row an explicit id in a table the product itself writes.** An explicit id sets the
table's auto-increment high-water mark, so the next value the product is handed is the block's own
next id — and the block manufactures its own collision. `expenses` is such a table: a test creates
rows *through the operation under test* and identifies them by the id the database returned. The
`expenses` development seeder is the sole exception, and its docblock explains why it is safe.

That failure is a race, so it moves between runs and reads as flaky fixtures. It is also near
invisible: jest prints a `SequelizeUniqueConstraintError` by its `message`, which is the bare string
`Validation error`. **The useful text is in `error.original.message`.**

**Never create `expense_categories` rows.** `tests/__tests__/sequelize/seeders/master/expense_categories.js`
asserts that table's entire row set with one `toEqual`, so a row left behind turns a different
feature's test red. To exercise a category that does not exist, name an id no row holds.

## Where an explicit id *is* allowed

In a table nothing but the tests and seeders write — `staff_members` qualifies, because the spec
puts account creation outside the product, so no product path inserts one. Build such an id from
your feature's own allocated prefix (see `hor-bank-id` and `.hora/id-bank.json` at the repository
root) and never from another requester's.
