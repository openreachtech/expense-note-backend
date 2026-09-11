import SignInInputValidator from '../../../../../../../../app/tools/validator/resolvers/staff/mutations/SignInInputValidator.js'

import BaseInputValidator from '../../../../../../../../app/tools/validator/BaseInputValidator.js'

describe('SignInInputValidator', () => {
  describe('super class', () => {
    test('to be instance of BaseInputValidator', () => {
      const received = SignInInputValidator.prototype

      expect(received)
        .toBeInstanceOf(BaseInputValidator)
    })
  })
})

describe('SignInInputValidator', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              email: 'haruka.arai@expense-note.example',
              password: 'password-0001',
            },
            errorHash: {
              MissingEmail: 'error-ctor-missing-email',
              MissingPassword: 'error-ctor-missing-password',
              MalformedEmail: 'error-ctor-malformed-email',
              TooLongPassword: 'error-ctor-too-long-password',
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'kenji.ogawa@expense-note.example',
              password: 'password-0002',
            },
            errorHash: {
              MissingEmail: 'error-ctor-missing-email',
              MissingPassword: 'error-ctor-missing-password',
              MalformedEmail: 'error-ctor-malformed-email',
              TooLongPassword: 'error-ctor-too-long-password',
            },
          },
        },
      ]

      test.each(cases)('input.email: $factoryParams.input.email', ({
        factoryParams,
      }) => {
        const actual = SignInInputValidator.create(factoryParams)

        expect(actual)
          .toBeInstanceOf(SignInInputValidator)
      })
    })
  })
})

describe('SignInInputValidator', () => {
  describe('#generateValidationEntries()', () => {
    // The two presence rules come first, because only the first failing rule surfaces and an empty
    // address reported as a malformed one would send somebody looking at the wrong thing. Each
    // error class stands in as a marker string: this method only pairs a rule with its error, and
    // a marker makes the pairing readable.
    describe('should declare the four rules in order', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              email: 'mio.fukuda@expense-note.example',
              password: 'password-0003',
            },
            errorHash: {
              MissingEmail: 'error-ctor-missing-email',
              MissingPassword: 'error-ctor-missing-password',
              MalformedEmail: 'error-ctor-malformed-email',
              TooLongPassword: 'error-ctor-too-long-password',
            },
          },
          expected: [
            [expect.any(Function), 'error-ctor-missing-email'],
            [expect.any(Function), 'error-ctor-missing-password'],
            [expect.any(Function), 'error-ctor-malformed-email'],
            [expect.any(Function), 'error-ctor-too-long-password'],
          ],
        },
        {
          factoryParams: {
            input: {
              email: 'not-an-address',
              password: '',
            },
            errorHash: {
              MissingEmail: 'error-ctor-missing-email',
              MissingPassword: 'error-ctor-missing-password',
              MalformedEmail: 'error-ctor-malformed-email',
              TooLongPassword: 'error-ctor-too-long-password',
            },
          },
          expected: [
            [expect.any(Function), 'error-ctor-missing-email'],
            [expect.any(Function), 'error-ctor-missing-password'],
            [expect.any(Function), 'error-ctor-malformed-email'],
            [expect.any(Function), 'error-ctor-too-long-password'],
          ],
        },
      ]

      test.each(cases)('input.email: $factoryParams.input.email', ({
        factoryParams,
        expected,
      }) => {
        const validator = SignInInputValidator.create(factoryParams)

        const actual = validator.generateValidationEntries()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SignInInputValidator', () => {
  describe('#hasEmail()', () => {
    // This rule owns nothing but "a non-empty string arrived". A blank address and a malformed one
    // both satisfy it, and the format rule is what refuses them.
    describe('should be truthy', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              email: 'souta.nishimura@expense-note.example',
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'nanami.doi@sub.expense-note.example',
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: '   ', // blank, and this rule is not the one that refuses it
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'not-an-address', // malformed, and this rule is not the one that refuses it
            },
          },
        },
      ]

      test.each(cases)('input.email: $factoryParams.input.email', ({
        factoryParams,
      }) => {
        const args = {
          input: factoryParams.input,
          errorHash: {}, // neutral value; a rule answers without reaching for an error
        }
        const validator = SignInInputValidator.create(args)

        const actual = validator.hasEmail()

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      /** @type {Array<*>} */
      const cases = [
        {
          factoryParams: {
            input: {
              email: '', // what `String!` still permits
            },
          },
        },
        {
          factoryParams: {
            input: {
              // email: undefined
              password: 'password-0004',
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: null,
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 12345,
            },
          },
        },
      ]

      test.each(cases)('input.email: $factoryParams.input.email', ({
        factoryParams,
      }) => {
        const args = {
          input: factoryParams.input,
          errorHash: {}, // neutral value; a rule answers without reaching for an error
        }
        const validator = SignInInputValidator.create(args)

        const actual = validator.hasEmail()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('SignInInputValidator', () => {
  describe('#hasPassword()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              password: 'password-0005',
            },
          },
        },
        {
          factoryParams: {
            input: {
              password: '   ', // a space is a character a password may be made of
            },
          },
        },
        {
          factoryParams: {
            input: {
              password: 'password-0008-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', // 73 bytes: present, and the byte rule is what refuses it
            },
          },
        },
      ]

      test.each(cases)('input.password: $factoryParams.input.password', ({
        factoryParams,
      }) => {
        const args = {
          input: factoryParams.input,
          errorHash: {}, // neutral value; a rule answers without reaching for an error
        }
        const validator = SignInInputValidator.create(args)

        const actual = validator.hasPassword()

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      /** @type {Array<*>} */
      const cases = [
        {
          factoryParams: {
            input: {
              password: '', // what `String!` still permits
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'rin.takahashi@expense-note.example',
              // password: undefined
            },
          },
        },
        {
          factoryParams: {
            input: {
              password: null,
            },
          },
        },
      ]

      test.each(cases)('input.password: $factoryParams.input.password', ({
        factoryParams,
      }) => {
        const args = {
          input: factoryParams.input,
          errorHash: {}, // neutral value; a rule answers without reaching for an error
        }
        const validator = SignInInputValidator.create(args)

        const actual = validator.hasPassword()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('SignInInputValidator', () => {
  describe('#isValidEmailFormat()', () => {
    // Every one of the eleven addresses the development seeders hold, because these are the
    // addresses `signIn` is tested against and a pattern refusing any of them would lock that
    // member of staff out: a `+` tag, a subdomain and a reserved `.example` domain among them.
    describe('should be truthy', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              email: 'haruka.arai@expense-note.example',
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'kenji.ogawa@expense-note.example',
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'mio.fukuda@expense-note.example',
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'souta.nishimura@expense-note.example',
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'rin.takahashi@expense-note.example',
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'yuuto.kirishima+notes@expense-note.example', // a `+` tag
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'nanami.doi@sub.expense-note.example', // a subdomain
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'riku.hasegawa@expense-note.example',
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'aoi.tsuchiya@expense-note.example',
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'daiki.morishita@expense-note.example',
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'sakura.umeda@expense-note.example',
            },
          },
        },
      ]

      test.each(cases)('input.email: $factoryParams.input.email', ({
        factoryParams,
      }) => {
        const args = {
          input: factoryParams.input,
          errorHash: {}, // neutral value; a rule answers without reaching for an error
        }
        const validator = SignInInputValidator.create(args)

        const actual = validator.isValidEmailFormat()

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              email: '',
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: '   ', // blank
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'no-at-sign.example',
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'nobody@', // nothing after the `@`
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: '@expense-note.example', // nothing before the `@`
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'two@at@signs.example',
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'has space@expense-note.example',
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'nobody@localhost', // a bare hostname, deliberately refused
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'nobody@.example', // an empty domain label
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'nobody@expense-note.', // a trailing dot
            },
          },
        },
      ]

      test.each(cases)('input.email: $factoryParams.input.email', ({
        factoryParams,
      }) => {
        const args = {
          input: factoryParams.input,
          errorHash: {}, // neutral value; a rule answers without reaching for an error
        }
        const validator = SignInInputValidator.create(args)

        const actual = validator.isValidEmailFormat()

        expect(actual)
          .toBeFalsy()
      })
    })

    // A value that is not a string belongs to the presence rule, which is declared ahead of this
    // one, so this rule answers that it has nothing to refuse.
    describe('when the address is not a string', () => {
      /** @type {Array<*>} */
      const cases = [
        {
          factoryParams: {
            input: {
              email: null,
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 12345,
            },
          },
        },
      ]

      test.each(cases)('input.email: $factoryParams.input.email', ({
        factoryParams,
      }) => {
        const args = {
          input: factoryParams.input,
          errorHash: {}, // neutral value; a rule answers without reaching for an error
        }
        const validator = SignInInputValidator.create(args)

        const actual = validator.isValidEmailFormat()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('SignInInputValidator', () => {
  describe('#isValidPasswordByteSize()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              password: 'password-0006', // 13 bytes
            },
          },
        },
        {
          factoryParams: {
            input: {
              password: 'password-0006-ccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', // 71 bytes
            },
          },
        },
        {
          factoryParams: {
            input: {
              password: 'password-0007-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // 72 bytes, the boundary bcrypt still reads whole
            },
          },
        },
        {
          factoryParams: {
            input: {
              password: 'パスワードパスワードパスワードパスワード', // 20 characters, 60 bytes
            },
          },
        },
        {
          factoryParams: {
            input: {
              password: 'パスワードパスワードパスワードパスワードパスワー', // 24 characters, 72 bytes: the boundary reached in multi-byte characters
            },
          },
        },
      ]

      test.each(cases)('input.password: $factoryParams.input.password', ({
        factoryParams,
      }) => {
        const args = {
          input: factoryParams.input,
          errorHash: {}, // neutral value; a rule answers without reaching for an error
        }
        const validator = SignInInputValidator.create(args)

        const actual = validator.isValidPasswordByteSize()

        expect(actual)
          .toBeTruthy()
      })
    })

    // The last two cases are why the rule counts bytes: each is well under 72 characters and over
    // 72 bytes, so a cap measured with `String#length` would let exactly the passwords bcrypt
    // truncates straight through.
    describe('should be falsy', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              password: 'password-0008-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', // 73 characters, 73 bytes
            },
          },
        },
        {
          factoryParams: {
            input: {
              password: 'パスワードパスワードパスワードパスワードパスワード', // 25 characters, 75 bytes
            },
          },
        },
        {
          factoryParams: {
            input: {
              password: 'password-0010-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxパスワー', // 68 characters, 76 bytes
            },
          },
        },
      ]

      test.each(cases)('input.password: $factoryParams.input.password', ({
        factoryParams,
      }) => {
        const args = {
          input: factoryParams.input,
          errorHash: {}, // neutral value; a rule answers without reaching for an error
        }
        const validator = SignInInputValidator.create(args)

        const actual = validator.isValidPasswordByteSize()

        expect(actual)
          .toBeFalsy()
      })
    })

    // A value that is not a string belongs to the presence rule, and measuring one would throw —
    // which a rule never does.
    describe('when the password is not a string', () => {
      /** @type {Array<*>} */
      const cases = [
        {
          factoryParams: {
            input: {
              password: null,
            },
          },
        },
        {
          factoryParams: {
            input: {
              password: 12345,
            },
          },
        },
      ]

      test.each(cases)('input.password: $factoryParams.input.password', ({
        factoryParams,
      }) => {
        const args = {
          input: factoryParams.input,
          errorHash: {}, // neutral value; a rule answers without reaching for an error
        }
        const validator = SignInInputValidator.create(args)

        const actual = validator.isValidPasswordByteSize()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('SignInInputValidator', () => {
  describe('#validateInput()', () => {
    describe('when every rule is fulfilled', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              email: 'haruka.arai@expense-note.example',
              password: 'password-0011',
            },
            errorHash: {
              MissingEmail: { create: () => 'created-error-missing-email' },
              MissingPassword: { create: () => 'created-error-missing-password' },
              MalformedEmail: { create: () => 'created-error-malformed-email' },
              TooLongPassword: { create: () => 'created-error-too-long-password' },
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'nanami.doi@sub.expense-note.example',
              password: '   ',
            },
            errorHash: {
              MissingEmail: { create: () => 'created-error-missing-email' },
              MissingPassword: { create: () => 'created-error-missing-password' },
              MalformedEmail: { create: () => 'created-error-malformed-email' },
              TooLongPassword: { create: () => 'created-error-too-long-password' },
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'yuuto.kirishima+notes@expense-note.example',
              password: 'password-0007-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // 72 bytes
            },
            errorHash: {
              MissingEmail: { create: () => 'created-error-missing-email' },
              MissingPassword: { create: () => 'created-error-missing-password' },
              MalformedEmail: { create: () => 'created-error-malformed-email' },
              TooLongPassword: { create: () => 'created-error-too-long-password' },
            },
          },
        },
      ]

      test.each(cases)('input.email: $factoryParams.input.email', ({
        factoryParams,
      }) => {
        const validator = SignInInputValidator.create(factoryParams)

        const actual = validator.validateInput()

        expect(actual)
          .toBeNull()
      })
    })

    describe('when a rule is not fulfilled', () => {
      const cases = [
        {
          label: 'the address is empty',
          factoryParams: {
            input: {
              email: '',
              password: 'password-0012',
            },
            errorHash: {
              MissingEmail: { create: () => 'created-error-missing-email' },
              MissingPassword: { create: () => 'created-error-missing-password' },
              MalformedEmail: { create: () => 'created-error-malformed-email' },
              TooLongPassword: { create: () => 'created-error-too-long-password' },
            },
          },
          expected: 'created-error-missing-email',
        },
        {
          label: 'the address is blank',
          factoryParams: {
            input: {
              email: '   ',
              password: 'password-0013',
            },
            errorHash: {
              MissingEmail: { create: () => 'created-error-missing-email' },
              MissingPassword: { create: () => 'created-error-missing-password' },
              MalformedEmail: { create: () => 'created-error-malformed-email' },
              TooLongPassword: { create: () => 'created-error-too-long-password' },
            },
          },
          expected: 'created-error-malformed-email',
        },
        {
          label: 'the address has no at sign',
          factoryParams: {
            input: {
              email: 'no-at-sign.example',
              password: 'password-0014',
            },
            errorHash: {
              MissingEmail: { create: () => 'created-error-missing-email' },
              MissingPassword: { create: () => 'created-error-missing-password' },
              MalformedEmail: { create: () => 'created-error-malformed-email' },
              TooLongPassword: { create: () => 'created-error-too-long-password' },
            },
          },
          expected: 'created-error-malformed-email',
        },
        {
          label: 'the address has no domain',
          factoryParams: {
            input: {
              email: 'nobody@',
              password: 'password-0015',
            },
            errorHash: {
              MissingEmail: { create: () => 'created-error-missing-email' },
              MissingPassword: { create: () => 'created-error-missing-password' },
              MalformedEmail: { create: () => 'created-error-malformed-email' },
              TooLongPassword: { create: () => 'created-error-too-long-password' },
            },
          },
          expected: 'created-error-malformed-email',
        },
        {
          label: 'the password is empty',
          factoryParams: {
            input: {
              email: 'riku.hasegawa@expense-note.example',
              password: '',
            },
            errorHash: {
              MissingEmail: { create: () => 'created-error-missing-email' },
              MissingPassword: { create: () => 'created-error-missing-password' },
              MalformedEmail: { create: () => 'created-error-malformed-email' },
              TooLongPassword: { create: () => 'created-error-too-long-password' },
            },
          },
          expected: 'created-error-missing-password',
        },
        {
          label: 'the password is 73 bytes',
          factoryParams: {
            input: {
              email: 'aoi.tsuchiya@expense-note.example',
              password: 'password-0008-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            },
            errorHash: {
              MissingEmail: { create: () => 'created-error-missing-email' },
              MissingPassword: { create: () => 'created-error-missing-password' },
              MalformedEmail: { create: () => 'created-error-malformed-email' },
              TooLongPassword: { create: () => 'created-error-too-long-password' },
            },
          },
          expected: 'created-error-too-long-password',
        },
        {
          label: 'the password is 25 multi-byte characters, so 75 bytes',
          factoryParams: {
            input: {
              email: 'daiki.morishita@expense-note.example',
              password: 'パスワードパスワードパスワードパスワードパスワード',
            },
            errorHash: {
              MissingEmail: { create: () => 'created-error-missing-email' },
              MissingPassword: { create: () => 'created-error-missing-password' },
              MalformedEmail: { create: () => 'created-error-malformed-email' },
              TooLongPassword: { create: () => 'created-error-too-long-password' },
            },
          },
          expected: 'created-error-too-long-password',
        },
        {
          label: 'both the address and the password are empty, and the address is declared first',
          factoryParams: {
            input: {
              email: '',
              password: '',
            },
            errorHash: {
              MissingEmail: { create: () => 'created-error-missing-email' },
              MissingPassword: { create: () => 'created-error-missing-password' },
              MalformedEmail: { create: () => 'created-error-malformed-email' },
              TooLongPassword: { create: () => 'created-error-too-long-password' },
            },
          },
          expected: 'created-error-missing-email',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        expected,
      }) => {
        const validator = SignInInputValidator.create(factoryParams)

        const actual = validator.validateInput()

        expect(actual)
          .toBe(expected)
      })
    })
  })
})
