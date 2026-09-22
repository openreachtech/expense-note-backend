'use strict'

/*
 * Where the `development` SQLite database file lives.
 *
 * The value was a literal inside `sequelize/config.cjs` until the CI failure recorded below forced
 * a second reader of it, and two readers of one path must not each carry their own copy of the
 * string.
 *
 * **Why a second reader exists.** SQLite allows exactly one writer at a time across the whole
 * database file, and jest runs test files in parallel worker processes -- `--maxWorkers=3` in this
 * repository's CI. Three workers writing one file contend for that single writer lock, and a
 * transaction that holds it long enough (the sign-in suite hashes a password inside its
 * transaction) makes a concurrent writer wait past its busy timeout and fail with
 * `SQLITE_BUSY: database is locked`. Worse than the lock, the workers also *see each other's rows*:
 * a listing assertion counts what another worker inserted a moment ago, and the same commit fails
 * differently on every run.
 *
 * So each jest worker is given its own copy of this file to work in, and the canonical file named
 * here is the one `test.sh` migrates and seeds once, the one `npm run db:refresh` rebuilds, and the
 * one the server reads when jest is not running. Nothing but jest ever uses a copy.
 *
 * The path is relative because Sequelize resolves `storage` from the process working directory, and
 * every script that opens this database runs from the repository root.
 */
module.exports = {
  DATABASE_STORAGE: {
    DEVELOPMENT_PATH: 'sequelize/storage/development.sqlite3',
  },
}
