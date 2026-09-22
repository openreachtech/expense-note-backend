import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const JestWorkerStorageAllocator = require('../../../../sequelize/tools/JestWorkerStorageAllocator.cjs')
const JestWorkerStorage = require('../../../../sequelize/tools/JestWorkerStorage.cjs')

describe('JestWorkerStorageAllocator', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#canonicalStoragePath', () => {
        const cases = [
          {
            params: {
              canonicalStoragePath: 'sequelize/storage/development.sqlite3',
              maxWorkers: 3,
            },
          },
          {
            params: {
              canonicalStoragePath: 'sequelize/storage/alpha.sqlite3',
              maxWorkers: 5,
            },
          },
        ]

        test.each(cases)('canonicalStoragePath: $params.canonicalStoragePath', ({
          params,
        }) => {
          const allocator = new JestWorkerStorageAllocator(params)

          expect(allocator)
            .toHaveProperty('canonicalStoragePath', params.canonicalStoragePath)
        })
      })

      describe('#maxWorkers', () => {
        const cases = [
          {
            params: {
              canonicalStoragePath: 'sequelize/storage/development.sqlite3',
              maxWorkers: 1,
            },
          },
          {
            params: {
              canonicalStoragePath: 'sequelize/storage/beta.sqlite3',
              maxWorkers: 4,
            },
          },
        ]

        test.each(cases)('maxWorkers: $params.maxWorkers', ({
          params,
        }) => {
          const allocator = new JestWorkerStorageAllocator(params)

          expect(allocator)
            .toHaveProperty('maxWorkers', params.maxWorkers)
        })
      })
    })
  })
})

describe('JestWorkerStorageAllocator', () => {
  describe('.create()', () => {
    describe('should be instance of own class', () => {
      const cases = [
        {
          factoryParams: {
            canonicalStoragePath: 'sequelize/storage/development.sqlite3',
            maxWorkers: 2,
          },
          expected: JestWorkerStorageAllocator,
        },
        {
          factoryParams: {
            canonicalStoragePath: 'sequelize/storage/gamma.sqlite3',
            maxWorkers: 6,
          },
          expected: JestWorkerStorageAllocator,
        },
      ]

      test.each(cases)('maxWorkers: $factoryParams.maxWorkers', ({
        factoryParams,
        expected,
      }) => {
        const allocator = JestWorkerStorageAllocator.create(factoryParams)

        expect(allocator)
          .toBeInstanceOf(expected)
      })
    })
  })
})

describe('JestWorkerStorageAllocator', () => {
  describe('.create()', () => {
    describe('should be call by constructor', () => {
      const cases = [
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/development.sqlite3',
            maxWorkers: 3,
          },
        },
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/delta.sqlite3',
            maxWorkers: 7,
          },
        },
      ]

      test.each(cases)('maxWorkers: $params.maxWorkers', ({
        params,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(JestWorkerStorageAllocator) // Arrange

        SpyClass.create(params) // Act

        expect(SpyClass.__spy__) // Assert
          .toHaveBeenCalledWith(params)
      })
    })
  })
})

describe('JestWorkerStorageAllocator', () => {
  describe('.get:JestWorkerStorageCtor', () => {
    describe('when called as is', () => {
      test('to be fixed value', () => {
        const expected = JestWorkerStorage

        const actual = JestWorkerStorageAllocator.JestWorkerStorageCtor

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('JestWorkerStorageAllocator', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        params: {
          canonicalStoragePath: 'sequelize/storage/development.sqlite3',
          maxWorkers: 1,
        },
      },
      {
        params: {
          canonicalStoragePath: 'sequelize/storage/epsilon.sqlite3',
          maxWorkers: 8,
        },
      },
    ]

    test.each(cases)('maxWorkers: $params.maxWorkers', ({
      params,
    }) => {
      const allocator = JestWorkerStorageAllocator.create(params)
      const expected = JestWorkerStorageAllocator

      const actual = allocator.Ctor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('JestWorkerStorageAllocator', () => {
  describe('#generateJestWorkerIds()', () => {
    /*
     * jest numbers its workers from 1 and issues no id above `maxWorkers`, so this range is exactly
     * the set of ids a run can produce -- a run it decides to take in band being worker 1.
     */
    const cases = [
      {
        params: {
          canonicalStoragePath: 'sequelize/storage/development.sqlite3',
          maxWorkers: 1,
        },
        expected: [
          '1',
        ],
      },
      {
        params: {
          canonicalStoragePath: 'sequelize/storage/development.sqlite3',
          maxWorkers: 3,
        },
        expected: [
          '1',
          '2',
          '3',
        ],
      },
      {
        params: {
          canonicalStoragePath: 'sequelize/storage/development.sqlite3',
          maxWorkers: 5,
        },
        expected: [
          '1',
          '2',
          '3',
          '4',
          '5',
        ],
      },
    ]

    test.each(cases)('maxWorkers: $params.maxWorkers', ({
      params,
      expected,
    }) => {
      const allocator = JestWorkerStorageAllocator.create(params)

      const actual = allocator.generateJestWorkerIds()

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('JestWorkerStorageAllocator', () => {
  describe('#buildWorkerStorages()', () => {
    const cases = [
      {
        params: {
          canonicalStoragePath: 'sequelize/storage/development.sqlite3',
          maxWorkers: 2,
        },
        expected: [
          expect.objectContaining({
            canonicalStoragePath: 'sequelize/storage/development.sqlite3',
            jestWorkerId: '1',
          }),
          expect.objectContaining({
            canonicalStoragePath: 'sequelize/storage/development.sqlite3',
            jestWorkerId: '2',
          }),
        ],
      },
      {
        params: {
          canonicalStoragePath: 'sequelize/storage/zeta.sqlite3',
          maxWorkers: 3,
        },
        expected: [
          expect.objectContaining({
            canonicalStoragePath: 'sequelize/storage/zeta.sqlite3',
            jestWorkerId: '1',
          }),
          expect.objectContaining({
            canonicalStoragePath: 'sequelize/storage/zeta.sqlite3',
            jestWorkerId: '2',
          }),
          expect.objectContaining({
            canonicalStoragePath: 'sequelize/storage/zeta.sqlite3',
            jestWorkerId: '3',
          }),
        ],
      },
    ]

    test.each(cases)('maxWorkers: $params.maxWorkers', ({
      params,
      expected,
    }) => {
      const allocator = JestWorkerStorageAllocator.create(params)

      const actual = allocator.buildWorkerStorages()

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('JestWorkerStorageAllocator', () => {
  describe('#allocateStorages()', () => {
    describe('with a canonical file to copy', () => {
      const cases = [
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/development.sqlite3',
            maxWorkers: 2,
          },
          expected: [
            'sequelize/storage/development.jest-worker-1.sqlite3',
            'sequelize/storage/development.jest-worker-2.sqlite3',
          ],
        },
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/eta.sqlite3',
            maxWorkers: 3,
          },
          expected: [
            'sequelize/storage/eta.jest-worker-1.sqlite3',
            'sequelize/storage/eta.jest-worker-2.sqlite3',
            'sequelize/storage/eta.jest-worker-3.sqlite3',
          ],
        },
      ]

      test.each(cases)('maxWorkers: $params.maxWorkers', ({
        params,
        expected,
      }) => {
        jest.spyOn(JestWorkerStorage, 'fileSystemClient', 'get')
          .mockReturnValue({
            existsSync: () => true,
            copyFileSync: jest.fn(),
            rmSync: jest.fn(),
          })
        const allocator = JestWorkerStorageAllocator.create(params)

        const actual = allocator.allocateStorages()

        expect(actual)
          .toEqual(expected)
      })
    })

    /*
     * Nothing to copy is not a failure -- `NODE_ENV=live` writes no SQLite file at all, and
     * `globalSetup` runs before every suite regardless of the environment it is about to test.
     */
    describe('with no canonical file to copy', () => {
      const cases = [
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/development.sqlite3',
            maxWorkers: 2,
          },
        },
        {
          params: {
            canonicalStoragePath: 'sequelize/storage/theta.sqlite3',
            maxWorkers: 4,
          },
        },
      ]

      test.each(cases)('maxWorkers: $params.maxWorkers', ({
        params,
      }) => {
        jest.spyOn(JestWorkerStorage, 'fileSystemClient', 'get')
          .mockReturnValue({
            existsSync: () => false,
            copyFileSync: jest.fn(),
            rmSync: jest.fn(),
          })
        const allocator = JestWorkerStorageAllocator.create(params)

        const actual = allocator.allocateStorages()

        expect(actual)
          .toHaveLength(0)
      })
    })
  })
})

describe('JestWorkerStorageAllocator', () => {
  describe('#releaseStorages()', () => {
    const cases = [
      {
        params: {
          canonicalStoragePath: 'sequelize/storage/development.sqlite3',
          maxWorkers: 2,
        },
        expected: [
          'sequelize/storage/development.jest-worker-1.sqlite3',
          'sequelize/storage/development.jest-worker-2.sqlite3',
        ],
      },
      {
        params: {
          canonicalStoragePath: 'sequelize/storage/iota.sqlite3',
          maxWorkers: 3,
        },
        expected: [
          'sequelize/storage/iota.jest-worker-1.sqlite3',
          'sequelize/storage/iota.jest-worker-2.sqlite3',
          'sequelize/storage/iota.jest-worker-3.sqlite3',
        ],
      },
    ]

    test.each(cases)('maxWorkers: $params.maxWorkers', ({
      params,
      expected,
    }) => {
      jest.spyOn(JestWorkerStorage, 'fileSystemClient', 'get')
        .mockReturnValue({
          rmSync: jest.fn(),
        })
      const allocator = JestWorkerStorageAllocator.create(params)

      const actual = allocator.releaseStorages()

      expect(actual)
        .toEqual(expected)
    })
  })
})
