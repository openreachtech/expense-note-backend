import {
  jest as jestCore,
} from '@jest/globals'

import {
  ConstructorSpy,
} from '@openreachtech/jest-constructor-spy'

import activate from '../sequelize/_.js'

/*
 * Set global variables.
 */
globalThis.jest = jestCore
globalThis.constructorSpy = ConstructorSpy.create({
  jest,
})

const activator = await activate()
globalThis.sequelizeActivator = activator

/*
 * Set global hooks.
 */
afterEach(() => {
  jest.restoreAllMocks()
})

/*
 * Close this test file's own connection when its last test has finished.
 *
 * Every test file re-evaluates this setup module in a module registry of its own, so every test
 * file opens a database connection of its own -- and, until this hook existed, closed none of them.
 * `npm test` runs the `_orders` suites under `--detectOpenHandles`, which is exactly the report
 * those connections were showing up in.
 *
 * It also became load-bearing once each worker was given its own database file
 * (`sequelize/tools/JestWorkerStorage.cjs`): `--detectOpenHandles` implies `--runInBand`, so the
 * connections live in jest's own process, and `globalTeardown` runs there too. Windows refuses to
 * delete a file a handle in the same process still holds, so the per-worker copies could not be
 * removed while any connection was left open.
 *
 * No test file registers an `afterAll` of its own, so nothing is left needing the connection after
 * this runs.
 */
afterAll(async () => {
  await activator.sequelize.close()
})
