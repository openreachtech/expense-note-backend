'use strict'

const env = require('../app/globals/env.cjs')

/*
 * `logging` is set on EVERY environment, deliberately, and it must stay set.
 *
 * Sequelize's default when the key is absent is `console.log` -- `sequelize.js` reads
 * `hasOwnProperty('logging') ? this.options.logging : console.log` -- so an environment that simply
 * omits it writes every statement it executes to stdout.
 *
 * Spec section 7's Personal data row: a member of staff's name and email address, and a memo which
 * may name a client, and "None of the three is ever written to a log line". Sequelize logs the SQL
 * text, and the address travels in `WHERE` clauses rather than in bound parameters -- the account
 * lookup `signIn` performs, and the `COUNT(*)` that section 7's per-address sign-in limit runs on
 * every attempt, both read
 *
 *     WHERE `email` = 'someone@example.com'
 *
 * So with logging left at its default, every sign-in writes an address to a log line. `development`
 * already set `logging: false`, which is exactly why no test could catch this: the whole suite runs
 * with logging off, and the defect lives in the configuration of the environments it does not run
 * in. Found at #sign-in's checkpoint 9 by walking section 10's criterion against the built system.
 *
 * The password digest is not at risk here and never was: it is compared through the encipher in JS,
 * never in a SQL equality, so it reaches no `WHERE`, and single-row inserts bind their values.
 * Section 8 declares no log aggregation, so nothing wants these statements.
 */

module.exports = {
  development: {
    database: 'development_database',
    username: null,
    password: null,

    dialect: 'sqlite',
    storage: 'sequelize/storage/development.sqlite3',
    logging: false,
  },
  live: {
    username: 'root',
    password: 'password',
    database: 'live',
    host: '127.0.0.1',

    dialect: 'mariadb',
    port: '3306',
    logging: false,
  },
  staging: {
    database: 'staging_database',
    username: 'admin-staging',
    password: 'staging-password',

    dialect: 'mysql',
    host: 'http://sample.example.com',
    port: 3306,
    logging: false,
  },
  production: {
    database: env.DATABASE_NAME,
    username: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD,

    dialect: env.DATABASE_DIALECT,
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    logging: false,
  },
}
