import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const config = require('../../../sequelize/config.cjs')

/*
 * Why a configuration file has a test at all.
 *
 * Sequelize's default when `logging` is absent is `console.log` -- it reads
 * `hasOwnProperty('logging') ? this.options.logging : console.log` -- so an environment that omits
 * the key writes every statement it executes to stdout. Spec section 7's Personal data row says a
 * member of staff's email address is never written to a log line, and the address travels in `WHERE`
 * clauses rather than in bound parameters: the account lookup `signIn` performs, and the `COUNT(*)`
 * that section 7's per-address limit runs on every attempt, both carry it.
 *
 * `live`, `staging` and `production` each omitted the key, so each of them logged an address on
 * every sign-in. No other test in this repository could have failed on it, because `development`
 * sets `logging: false` and the whole suite runs there -- the defect lived only in the configuration
 * of the environments the suite never uses. That is what this test is for: it reads the file rather
 * than the connection, so it holds for environments this machine cannot open.
 */

describe('config.cjs', () => {
  describe('should declare an explicit logging setting on every environment', () => {
    const cases = [
      {
        params: {
          environment: 'development',
        },
      },
      {
        params: {
          environment: 'live',
        },
      },
      {
        params: {
          environment: 'staging',
        },
      },
      {
        params: {
          environment: 'production',
        },
      },
    ]

    test.each(cases)('environment: $params.environment', ({
      params,
    }) => {
      const expected = false

      const actual = config[params.environment].logging

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('config.cjs', () => {
  describe('should cover every environment the file defines', () => {
    /*
     * The list above is written out one environment per case, so an environment added to the file
     * without a case would go unchecked and silently log. This compares the two.
     */
    test('should hold exactly the four environments the cases enumerate', () => {
      const expected = [
        'development',
        'live',
        'production',
        'staging',
      ]

      const actual = Object.keys(config)
        .toSorted()

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('config.cjs', () => {
  describe('should keep the suite off the canonical database file', () => {
    /*
     * SQLite serializes writers across a whole database file, and jest runs its suites in parallel
     * processes. Pointed at one shared file, `--maxWorkers=3` made three writers contend for one
     * lock -- `SQLITE_BUSY: database is locked` -- and let each worker read rows another had just
     * inserted, so the same commit failed 1, 12, 16 and 23 tests on successive runs.
     *
     * Every worker is therefore handed its own copy, which is what this asserts: the file the suite
     * opens is never the canonical one. A change that dropped the wiring would put the suite back on
     * the shared file and be caught here rather than by a flake weeks later.
     *
     * The literal is written out rather than read from `constants/databaseStorageConstants.cjs`,
     * deliberately -- a test comparing a value against the constant it came from asserts nothing.
     */
    test('to name a per-worker copy while jest is running', () => {
      const expected = 'sequelize/storage/development.sqlite3'

      const actual = config.development.storage

      expect(actual)
        .not
        .toBe(expected)
    })
  })
})
