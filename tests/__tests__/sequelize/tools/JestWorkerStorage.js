import fs from 'fs'
import path from 'path'

import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const JestWorkerStorage = require('../../../../sequelize/tools/JestWorkerStorage.cjs')

describe('JestWorkerStorage', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#canonicalStoragePath', () => {
        const cases = [
          {
            params: {
              canonicalStoragePath: 'sequelize/storage/development.sqlite3',
              jestWorkerId: '1',
            },
          },
          {
            params: {
              canonicalStoragePath: 'sequelize/storage/alpha.sqlite3',
              jestWorkerId: '2',
            },
          },
        ]

        test.each(cases)('canonicalStoragePath: $params.canonicalStoragePath', ({
          params,
        }) => {
          const storage = new JestWorkerStorage(params)

          expect(storage)
            .toHaveProperty('canonicalStoragePath', params.canonicalStoragePath)
        })
      })

      describe('#jestWorkerId', () => {
        const cases = [
          {
            params: {
              canonicalStoragePath: 'sequelize/storage/development.sqlite3',
              jestWorkerId: '3',
            },
          },
          {
            params: {
              canonicalStoragePath: 'sequelize/storage/beta.sqlite3',
              jestWorkerId: null,
            },
          },
        ]

        test.each(cases)('jestWorkerId: $params.jestWorkerId', ({
          params,
        }) => {
          const storage = new JestWorkerStorage(params)

          expect(storage)
            .toHaveProperty('jestWorkerId', params.jestWorkerId)
        })
      })
    })
  })
})

describe('JestWorkerStorage', () => {
  describe('.create()', () => {
    describe('should be instance of own class', () => {
      const cases = [
        {
          factoryParams: {
            canonicalStoragePath: 'sequelize/storage/development.sqlite3',
            jestWorkerId: '1',
          },
          expected: JestWorkerStorage,
        },
        {
          factoryParams: {
            canonicalStoragePath: 'sequelize/storage/gamma.sqlite3',
            jestWorkerId: null,
          },
          expected: JestWorkerStorage,
        },
      ]

      test.each(cases)('canonicalStoragePath: $factoryParams.canonicalStoragePath', ({
        factoryParams,
        expected,
      }) => {
        const storage = JestWorkerStorage.create(factoryParams)

        expect(storage)
          .toBeInstanceOf(expected)
      })
    })
  })
})

describe('JestWorkerStorage', () => {
  describe('.create()', () => {
    describe('should be call by constructor', () => {
      const cases = [
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/development.sqlite3',
            jestWorkerId: '2',
          },
        },
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/delta.sqlite3',
            jestWorkerId: '5',
          },
        },
      ]

      test.each(cases)('jestWorkerId: $params.jestWorkerId', ({
        params,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(JestWorkerStorage) // Arrange

        SpyClass.create(params) // Act

        expect(SpyClass.__spy__) // Assert
          .toHaveBeenCalledWith(params)
      })
    })
  })
})

describe('JestWorkerStorage', () => {
  describe('.create()', () => {
    /*
     * The default reads `JEST_WORKER_ID` out of the environment, and the environment facade refuses
     * to be written to -- deliberately, so nothing can move an environment variable under a running
     * process. So the default is described by what it produces in the process it is read in: this
     * test file is itself running inside a jest worker, where the variable is always set.
     */
    describe('should read the worker id it is not given from the environment', () => {
      test('to carry the id of the worker this test runs in', () => {
        const expected = {
          canonicalStoragePath: 'sequelize/storage/development.sqlite3',
          jestWorkerId: expect.any(String),
        }
        const SpyClass = globalThis.constructorSpy.spyOn(JestWorkerStorage)

        SpyClass.create({
          canonicalStoragePath: 'sequelize/storage/development.sqlite3',
        })

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('JestWorkerStorage', () => {
  describe('.get:fileSystemClient', () => {
    describe('when called as is', () => {
      test('to be fixed value', () => {
        const expected = fs

        const actual = JestWorkerStorage.fileSystemClient

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('JestWorkerStorage', () => {
  describe('.get:pathClient', () => {
    describe('when called as is', () => {
      test('to be fixed value', () => {
        const expected = path

        const actual = JestWorkerStorage.pathClient

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('JestWorkerStorage', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        params: {
          canonicalStoragePath: 'sequelize/storage/development.sqlite3',
          jestWorkerId: '1',
        },
      },
      {
        params: {
          canonicalStoragePath: 'sequelize/storage/epsilon.sqlite3',
          jestWorkerId: '4',
        },
      },
    ]

    test.each(cases)('jestWorkerId: $params.jestWorkerId', ({
      params,
    }) => {
      const storage = JestWorkerStorage.create(params)
      const expected = JestWorkerStorage

      const actual = storage.Ctor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('JestWorkerStorage', () => {
  describe('#runsInJestWorker()', () => {
    describe('with a worker id', () => {
      const cases = [
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/development.sqlite3',
            jestWorkerId: '1',
          },
        },
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/development.sqlite3',
            jestWorkerId: '12',
          },
        },
      ]

      test.each(cases)('jestWorkerId: $params.jestWorkerId', ({
        params,
      }) => {
        const storage = JestWorkerStorage.create(params)

        const actual = storage.runsInJestWorker()

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('without a worker id', () => {
      const cases = [
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/development.sqlite3',
            jestWorkerId: null,
          },
        },
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/zeta.sqlite3',
            jestWorkerId: '',
          },
        },
      ]

      test.each(cases)('canonicalStoragePath: $params.canonicalStoragePath', ({
        params,
      }) => {
        const storage = JestWorkerStorage.create(params)

        const actual = storage.runsInJestWorker()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('JestWorkerStorage', () => {
  describe('#generateStoragePath()', () => {
    describe('inside a jest worker', () => {
      const cases = [
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/development.sqlite3',
            jestWorkerId: '1',
          },
          expected: 'sequelize/storage/development.jest-worker-1.sqlite3',
        },
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/development.sqlite3',
            jestWorkerId: '3',
          },
          expected: 'sequelize/storage/development.jest-worker-3.sqlite3',
        },
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/eta.sqlite3',
            jestWorkerId: '12',
          },
          expected: 'sequelize/storage/eta.jest-worker-12.sqlite3',
        },
      ]

      test.each(cases)('jestWorkerId: $params.jestWorkerId', ({
        params,
        expected,
      }) => {
        const storage = JestWorkerStorage.create(params)

        const actual = storage.generateStoragePath()

        expect(actual)
          .toBe(expected)
      })
    })

    /*
     * This is the half of the behavior that keeps `npm run db:refresh`, the `db:*` scripts and the
     * running server on the canonical file: a storage with no worker id hands back exactly what it
     * was given, untouched.
     */
    describe('outside a jest worker', () => {
      const cases = [
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/development.sqlite3',
            jestWorkerId: null,
          },
          expected: 'sequelize/storage/development.sqlite3',
        },
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/theta.sqlite3',
            jestWorkerId: null,
          },
          expected: 'sequelize/storage/theta.sqlite3',
        },
      ]

      test.each(cases)('canonicalStoragePath: $params.canonicalStoragePath', ({
        params,
        expected,
      }) => {
        const storage = JestWorkerStorage.create(params)

        const actual = storage.generateStoragePath()

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('JestWorkerStorage', () => {
  describe('#generateWorkerStoragePath()', () => {
    const cases = [
      {
        params: {
          canonicalStoragePath: 'sequelize/storage/development.sqlite3',
          jestWorkerId: '2',
        },
        expected: 'sequelize/storage/development.jest-worker-2.sqlite3',
      },
      {
        params: {
          canonicalStoragePath: 'sequelize/storage/iota.sqlite3',
          jestWorkerId: '7',
        },
        expected: 'sequelize/storage/iota.jest-worker-7.sqlite3',
      },
    ]

    test.each(cases)('jestWorkerId: $params.jestWorkerId', ({
      params,
      expected,
    }) => {
      const storage = JestWorkerStorage.create(params)

      const actual = storage.generateWorkerStoragePath()

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('JestWorkerStorage', () => {
  describe('#copyFromCanonicalStorage()', () => {
    describe('with a canonical file to copy', () => {
      const cases = [
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/development.sqlite3',
            jestWorkerId: '1',
          },
          expected: 'sequelize/storage/development.jest-worker-1.sqlite3',
        },
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/kappa.sqlite3',
            jestWorkerId: '3',
          },
          expected: 'sequelize/storage/kappa.jest-worker-3.sqlite3',
        },
      ]

      test.each(cases)('jestWorkerId: $params.jestWorkerId', ({
        params,
        expected,
      }) => {
        const copyFileSyncTally = jest.fn()
        jest.spyOn(JestWorkerStorage, 'fileSystemClient', 'get')
          .mockReturnValue({
            existsSync: () => true,
            copyFileSync: copyFileSyncTally,
          })
        const storage = JestWorkerStorage.create(params)

        const actual = storage.copyFromCanonicalStorage()

        expect(actual)
          .toBe(expected)
        expect(copyFileSyncTally)
          .toHaveBeenCalledWith(params.canonicalStoragePath, expected)
      })
    })

    /*
     * A missing canonical file is the `NODE_ENV=live` case, and the case of a bare `npx jest` that
     * skipped the setup script. Neither may fail the whole run before a single test has started.
     */
    describe('with no canonical file to copy', () => {
      const cases = [
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/development.sqlite3',
            jestWorkerId: '1',
          },
        },
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/lambda.sqlite3',
            jestWorkerId: '2',
          },
        },
      ]

      test.each(cases)('canonicalStoragePath: $params.canonicalStoragePath', ({
        params,
      }) => {
        const copyFileSyncTally = jest.fn()
        jest.spyOn(JestWorkerStorage, 'fileSystemClient', 'get')
          .mockReturnValue({
            existsSync: () => false,
            copyFileSync: copyFileSyncTally,
          })
        const storage = JestWorkerStorage.create(params)

        const actual = storage.copyFromCanonicalStorage()

        expect(actual)
          .toBeNull()
        expect(copyFileSyncTally)
          .not
          .toHaveBeenCalled()
      })
    })

    /*
     * The guard that makes it impossible for this class to write over the canonical file.
     */
    describe('outside a jest worker', () => {
      const cases = [
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/development.sqlite3',
            jestWorkerId: null,
          },
        },
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/mu.sqlite3',
            jestWorkerId: null,
          },
        },
      ]

      test.each(cases)('canonicalStoragePath: $params.canonicalStoragePath', ({
        params,
      }) => {
        const copyFileSyncTally = jest.fn()
        jest.spyOn(JestWorkerStorage, 'fileSystemClient', 'get')
          .mockReturnValue({
            existsSync: () => true,
            copyFileSync: copyFileSyncTally,
          })
        const storage = JestWorkerStorage.create(params)

        const actual = storage.copyFromCanonicalStorage()

        expect(actual)
          .toBeNull()
        expect(copyFileSyncTally)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('JestWorkerStorage', () => {
  describe('#removeWorkerStorage()', () => {
    describe('inside a jest worker', () => {
      const cases = [
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/development.sqlite3',
            jestWorkerId: '1',
          },
          expected: 'sequelize/storage/development.jest-worker-1.sqlite3',
        },
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/nu.sqlite3',
            jestWorkerId: '9',
          },
          expected: 'sequelize/storage/nu.jest-worker-9.sqlite3',
        },
      ]

      test.each(cases)('jestWorkerId: $params.jestWorkerId', ({
        params,
        expected,
      }) => {
        const removeTally = jest.fn()
        jest.spyOn(JestWorkerStorage, 'fileSystemClient', 'get')
          .mockReturnValue({
            rmSync: removeTally,
          })
        const storage = JestWorkerStorage.create(params)

        const actual = storage.removeWorkerStorage()

        expect(actual)
          .toBe(expected)
        expect(removeTally)
          .toHaveBeenCalledWith(
            expected,
            {
              force: true,
            }
          )
      })
    })

    /*
     * Without this guard a teardown would delete the canonical database itself, and the next run
     * would start from an empty file with no record of why.
     */
    describe('outside a jest worker', () => {
      const cases = [
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/development.sqlite3',
            jestWorkerId: null,
          },
        },
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/xi.sqlite3',
            jestWorkerId: null,
          },
        },
      ]

      test.each(cases)('canonicalStoragePath: $params.canonicalStoragePath', ({
        params,
      }) => {
        const removeTally = jest.fn()
        jest.spyOn(JestWorkerStorage, 'fileSystemClient', 'get')
          .mockReturnValue({
            rmSync: removeTally,
          })
        const storage = JestWorkerStorage.create(params)

        const actual = storage.removeWorkerStorage()

        expect(actual)
          .toBeNull()
        expect(removeTally)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})
