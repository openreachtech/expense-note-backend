import PasswordEncipher from '../../../../app/session/PasswordEncipher.js'

import bcrypt from 'bcryptjs'

describe('PasswordEncipher', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#costFactor', () => {
        const cases = [
          {
            params: {
              costFactor: 4,
            },
          },
          {
            params: {
              costFactor: 6,
            },
          },
        ]

        test.each(cases)('costFactor: $params.costFactor', ({
          params,
        }) => {
          const encipher = new PasswordEncipher(params)

          expect(encipher)
            .toHaveProperty('costFactor', params.costFactor)
        })
      })
    })
  })
})

describe('PasswordEncipher', () => {
  describe('.create()', () => {
    describe('should be instance of own class', () => {
      const cases = [
        {
          factoryParams: {
            costFactor: 4,
          },
          expected: PasswordEncipher,
        },
        {
          factoryParams: {
            costFactor: 6,
          },
          expected: PasswordEncipher,
        },
      ]

      test.each(cases)('costFactor: $factoryParams.costFactor', ({
        factoryParams,
        expected,
      }) => {
        const encipher = PasswordEncipher.create(factoryParams)

        expect(encipher)
          .toBeInstanceOf(expected)
      })
    })
  })
})

describe('PasswordEncipher', () => {
  describe('.create()', () => {
    describe('should be call by constructor', () => {
      const cases = [
        {
          params: {
            costFactor: 4,
          },
        },
        {
          params: {
            costFactor: 6,
          },
        },
      ]

      test.each(cases)('costFactor: $params.costFactor', ({
        params,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(PasswordEncipher) // Arrange

        SpyClass.create(params) // Act

        expect(SpyClass.__spy__) // Assert
          .toHaveBeenCalledWith(params)
      })
    })
  })
})

describe('PasswordEncipher', () => {
  describe('.create()', () => {
    describe('should fill default costFactor', () => {
      test('with no arguments', () => {
        // The cost factor every digest this project writes carries.
        const expected = {
          costFactor: 10,
        }
        const SpyClass = globalThis.constructorSpy.spyOn(PasswordEncipher)

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('PasswordEncipher', () => {
  describe('.get:bcryptClient', () => {
    describe('when called as is', () => {
      test('to be fixed value', () => {
        const expected = bcrypt

        const actual = PasswordEncipher.bcryptClient

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('PasswordEncipher', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        factoryParams: {
          costFactor: 4,
        },
        expected: PasswordEncipher,
      },
      {
        factoryParams: {
          costFactor: 6,
        },
        expected: PasswordEncipher,
      },
    ]

    test.each(cases)('costFactor: $factoryParams.costFactor', ({
      factoryParams,
      expected,
    }) => {
      const encipher = PasswordEncipher.create(factoryParams) // Arrange

      const actual = encipher.Ctor // Act

      expect(actual) // Assert
        .toBe(expected) // same reference
    })
  })
})

describe('PasswordEncipher', () => {
  describe('#hashPassword()', () => {
    describe('should answer a bcrypt digest', () => {
      const cases = [
        {
          factoryParams: {
            costFactor: 4,
          },
          params: {
            password: 'monday-morning-0001',
          },
          expectedPattern: /^\$2[aby]\$/u,
          expectedTotalLength: 60,
        },
        {
          factoryParams: {
            costFactor: 5,
          },
          params: {
            password: 'monday-morning-0002',
          },
          expectedPattern: /^\$2[aby]\$/u,
          expectedTotalLength: 60,
        },
      ]

      test.each(cases)('password: $params.password', async ({
        factoryParams,
        params,
        expectedPattern,
        expectedTotalLength,
      }) => {
        const encipher = PasswordEncipher.create(factoryParams) // Arrange

        const actual = await encipher.hashPassword(params) // Act

        expect(actual) // Assert
          .toMatch(expectedPattern)
        expect(actual)
          .toHaveLength(expectedTotalLength)
      })
    })
  })
})

describe('PasswordEncipher', () => {
  describe('#hashPassword()', () => {
    describe('should never answer the password itself', () => {
      // A digest carrying its own input would make a database dump a list of passwords, and the
      // bcrypt prefix alone would not catch that, so the plaintext is looked for directly.
      const cases = [
        {
          factoryParams: {
            costFactor: 4,
          },
          params: {
            password: 'monday-morning-0003',
          },
        },
        {
          factoryParams: {
            costFactor: 5,
          },
          params: {
            password: 'monday-morning-0004',
          },
        },
      ]

      test.each(cases)('password: $params.password', async ({
        factoryParams,
        params,
      }) => {
        const encipher = PasswordEncipher.create(factoryParams) // Arrange

        const actual = await encipher.hashPassword(params) // Act

        expect(actual) // Assert
          .not
          .toContain(params.password)
      })
    })
  })
})

describe('PasswordEncipher', () => {
  describe('#hashPassword()', () => {
    describe('should salt every call', () => {
      // Two members of staff sharing a password must not end up sharing a digest.
      const cases = [
        {
          factoryParams: {
            costFactor: 4,
          },
          params: {
            password: 'monday-morning-0005',
          },
        },
        {
          factoryParams: {
            costFactor: 5,
          },
          params: {
            password: 'monday-morning-0006',
          },
        },
      ]

      test.each(cases)('password: $params.password', async ({
        factoryParams,
        params,
      }) => {
        const encipher = PasswordEncipher.create(factoryParams) // Arrange
        const expected = await encipher.hashPassword(params)

        const actual = await encipher.hashPassword(params) // Act

        expect(actual) // Assert
          .not
          .toBe(expected)
      })
    })
  })
})

describe('PasswordEncipher', () => {
  describe('#hashPassword()', () => {
    describe('should write the configured cost factor into the digest', () => {
      const cases = [
        {
          factoryParams: {
            costFactor: 4,
          },
          params: {
            password: 'monday-morning-0007',
          },
          expectedPattern: /^\$2b\$04\$/u,
        },
        {
          factoryParams: {
            costFactor: 6,
          },
          params: {
            password: 'monday-morning-0008',
          },
          expectedPattern: /^\$2b\$06\$/u,
        },
      ]

      test.each(cases)('password: $params.password', async ({
        factoryParams,
        params,
        expectedPattern,
      }) => {
        const encipher = PasswordEncipher.create(factoryParams) // Arrange

        const actual = await encipher.hashPassword(params) // Act

        expect(actual) // Assert
          .toMatch(expectedPattern)
      })
    })
  })
})

describe('PasswordEncipher', () => {
  describe('#hashPassword()', () => {
    describe('should hand the password and the cost factor to bcrypt', () => {
      const cases = [
        {
          factoryParams: {
            costFactor: 4,
          },
          params: {
            password: 'monday-morning-0009',
          },
          expected: [
            'monday-morning-0009',
            4,
          ],
        },
        {
          factoryParams: {
            costFactor: 5,
          },
          params: {
            password: 'monday-morning-0010',
          },
          expected: [
            'monday-morning-0010',
            5,
          ],
        },
      ]

      test.each(cases)('password: $params.password', async ({
        factoryParams,
        params,
        expected,
      }) => {
        const encipher = PasswordEncipher.create(factoryParams) // Arrange
        const hashSpy = jest.spyOn(PasswordEncipher.bcryptClient, 'hash')

        await encipher.hashPassword(params) // Act

        expect(hashSpy) // Assert
          .toHaveBeenCalledWith(...expected)
      })
    })
  })
})

describe('PasswordEncipher', () => {
  describe('#comparesPassword()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          factoryParams: {
            costFactor: 4,
          },
          params: {
            password: 'monday-morning-0011',
          },
        },
        {
          factoryParams: {
            costFactor: 5,
          },
          params: {
            password: 'monday-morning-0012',
          },
        },
      ]

      test.each(cases)('password: $params.password', async ({
        factoryParams,
        params,
      }) => {
        const encipher = PasswordEncipher.create(factoryParams) // Arrange
        const passwordHash = await encipher.hashPassword(params)

        const actual = await encipher.comparesPassword({ // Act
          password: params.password,
          passwordHash,
        })

        expect(actual) // Assert
          .toBeTruthy()
      })
    })
  })
})

describe('PasswordEncipher', () => {
  describe('#comparesPassword()', () => {
    describe('should be falsy', () => {
      // An address with no account and a correct address with the wrong password are refused
      // identically, so this answer is the whole of what separates the two candidates.
      const cases = [
        {
          factoryParams: {
            costFactor: 4,
          },
          params: {
            password: 'monday-morning-0013',
          },
          mockStoredPassword: 'stored-password-0013',
        },
        {
          factoryParams: {
            costFactor: 5,
          },
          params: {
            password: 'monday-morning-0014',
          },
          mockStoredPassword: 'stored-password-0014',
        },
      ]

      test.each(cases)('password: $params.password', async ({
        factoryParams,
        params,
        mockStoredPassword,
      }) => {
        const encipher = PasswordEncipher.create(factoryParams) // Arrange
        const passwordHash = await encipher.hashPassword({
          password: mockStoredPassword,
        })

        const actual = await encipher.comparesPassword({ // Act
          password: params.password,
          passwordHash,
        })

        expect(actual) // Assert
          .toBeFalsy()
      })
    })
  })
})

describe('PasswordEncipher', () => {
  describe('#comparesPassword()', () => {
    describe('should accept a digest written under another cost factor', () => {
      // bcrypt reads the factor out of the digest handed in, which is what lets the constant be
      // raised later without a migration: every digest already stored keeps verifying.
      const cases = [
        {
          factoryParams: {
            costFactor: 6,
          },
          params: {
            password: 'monday-morning-0015',
          },
          mockStoredCostFactor: 4,
        },
        {
          factoryParams: {
            costFactor: 4,
          },
          params: {
            password: 'monday-morning-0016',
          },
          mockStoredCostFactor: 5,
        },
      ]

      test.each(cases)('password: $params.password', async ({
        factoryParams,
        params,
        mockStoredCostFactor,
      }) => {
        const encipher = PasswordEncipher.create(factoryParams) // Arrange
        const writingEncipher = PasswordEncipher.create({
          costFactor: mockStoredCostFactor,
        })
        const passwordHash = await writingEncipher.hashPassword(params)

        const actual = await encipher.comparesPassword({ // Act
          password: params.password,
          passwordHash,
        })

        expect(actual) // Assert
          .toBeTruthy()
      })
    })
  })
})

describe('PasswordEncipher', () => {
  describe('#comparesPassword()', () => {
    describe('should hand the candidate and the digest to bcrypt', () => {
      // Never a string equality: the stored value is a one-way hash, so an equality against it
      // could only ever be false. bcrypt reads the salt out of the second argument.
      const cases = [
        {
          factoryParams: {
            costFactor: 4,
          },
          params: {
            password: 'monday-morning-0017',
            passwordHash: '$2b$04$bySWRGidgK5bQ2JitXwe3.KMm0ocNTg4NtijizhXoa3C0o0UyzUeK',
          },
          expected: [
            'monday-morning-0017',
            '$2b$04$bySWRGidgK5bQ2JitXwe3.KMm0ocNTg4NtijizhXoa3C0o0UyzUeK',
          ],
        },
        {
          factoryParams: {
            costFactor: 5,
          },
          params: {
            password: 'monday-morning-0018',
            passwordHash: '$2b$05$6Chu8df7JFJaVL7/qJDTueWoqInYVa5kCOi875gvZi6g/GGPkPhAa',
          },
          expected: [
            'monday-morning-0018',
            '$2b$05$6Chu8df7JFJaVL7/qJDTueWoqInYVa5kCOi875gvZi6g/GGPkPhAa',
          ],
        },
      ]

      test.each(cases)('password: $params.password', async ({
        factoryParams,
        params,
        expected,
      }) => {
        const encipher = PasswordEncipher.create(factoryParams) // Arrange
        const compareSpy = jest.spyOn(PasswordEncipher.bcryptClient, 'compare')

        await encipher.comparesPassword(params) // Act

        expect(compareSpy) // Assert
          .toHaveBeenCalledWith(...expected)
      })
    })
  })
})
