import BaseInputValidator from '../../../../../app/tools/validator/BaseInputValidator.js'

describe('BaseInputValidator', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#input', () => {
        const cases = [
          {
            params: {
              input: {
                email: 'haruka.arai@expense-note.example',
                password: 'password-0001',
              },
            },
          },
          {
            params: {
              input: {
                email: 'kenji.ogawa@expense-note.example',
                password: 'password-0002',
              },
            },
          },
        ]

        test.each(cases)('input.email: $params.input.email', ({
          params,
        }) => {
          const args = {
            input: params.input,
            errorHash: {}, // neutral value; not under test
          }
          const actual = BaseInputValidator.create(args)

          expect(actual)
            .toHaveProperty('input', params.input)
        })
      })

      describe('#errorHash', () => {
        const cases = [
          {
            params: {
              errorHash: {
                MissingAlpha: 'error-ctor-missing-alpha',
              },
            },
          },
          {
            params: {
              errorHash: {
                MissingBeta: 'error-ctor-missing-beta',
                MalformedBeta: 'error-ctor-malformed-beta',
              },
            },
          },
        ]

        test.each(cases)('errorHash: $params.errorHash', ({
          params,
        }) => {
          const args = {
            input: {
              email: 'mio.fukuda@expense-note.example', // neutral value; not under test
            },
            errorHash: params.errorHash,
          }
          const actual = BaseInputValidator.create(args)

          expect(actual)
            .toHaveProperty('errorHash', params.errorHash)
        })
      })
    })
  })
})

describe('BaseInputValidator', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          factoryParams: {
            input: {
              email: 'souta.nishimura@expense-note.example',
              password: 'password-0003',
            },
            errorHash: {
              MissingAlpha: 'error-ctor-missing-alpha',
            },
          },
        },
        {
          factoryParams: {
            input: {
              email: 'rin.takahashi@expense-note.example',
              password: 'password-0004',
            },
            errorHash: {
              MissingBeta: 'error-ctor-missing-beta',
            },
          },
        },
      ]

      test.each(cases)('input.email: $factoryParams.input.email', ({
        factoryParams,
      }) => {
        const actual = BaseInputValidator.create(factoryParams)

        expect(actual)
          .toBeInstanceOf(BaseInputValidator)
      })
    })

    describe('should be call by constructor', () => {
      const cases = [
        {
          params: {
            input: {
              email: 'yuuto.kirishima+notes@expense-note.example',
              password: 'password-0005',
            },
            errorHash: {
              MissingGamma: 'error-ctor-missing-gamma',
            },
          },
        },
        {
          params: {
            input: {
              email: 'nanami.doi@sub.expense-note.example',
              password: 'password-0006',
            },
            errorHash: {
              MissingDelta: 'error-ctor-missing-delta',
            },
          },
        },
      ]

      test.each(cases)('input.email: $params.input.email', ({
        params,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(BaseInputValidator)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(params)
      })
    })
  })
})

describe('BaseInputValidator', () => {
  describe('#generateValidationEntries()', () => {
    describe('when not inherited', () => {
      test('should throw error', () => {
        const validator = BaseInputValidator.create({
          input: {
            email: 'riku.hasegawa@expense-note.example',
          },
          errorHash: {},
        })
        const expected = 'BaseInputValidator#generateValidationEntries() must be inherited'

        const actual = () => validator.generateValidationEntries()

        expect(actual)
          .toThrow(expected)
      })
    })
  })
})

describe('BaseInputValidator', () => {
  describe('#validateInput()', () => {
    // Every case below stubs the rules, because the base declares none of its own: what is under
    // test is how it runs them. A rule's error stands in as an object answering `.create()` with a
    // marker, so a marker coming back is proof the base created the error rather than answering
    // with the class the entry carried.
    describe('when every rule is fulfilled', () => {
      const cases = [
        {
          label: 'two rules, both fulfilled',
          mockValidationEntries: [
            [() => true, { create: () => 'created-error-0001' }],
            [() => true, { create: () => 'created-error-0002' }],
          ],
        },
        {
          label: 'one rule, fulfilled',
          mockValidationEntries: [
            [() => true, { create: () => 'created-error-0003' }],
          ],
        },
      ]

      test.each(cases)('label: $label', ({
        mockValidationEntries,
      }) => {
        const validator = BaseInputValidator.create({
          input: {
            email: 'aoi.tsuchiya@expense-note.example', // neutral value; the stubbed rules read nothing
          },
          errorHash: {},
        })
        jest.spyOn(validator, 'generateValidationEntries')
          .mockReturnValue(mockValidationEntries)

        const actual = validator.validateInput()

        expect(actual)
          .toBeNull()
      })
    })

    describe('when one rule is not fulfilled', () => {
      const cases = [
        {
          label: 'the first of two rules',
          mockValidationEntries: [
            [() => false, { create: () => 'created-error-0004' }],
            [() => true, { create: () => 'created-error-0005' }],
          ],
          expected: 'created-error-0004',
        },
        {
          label: 'the second of two rules',
          mockValidationEntries: [
            [() => true, { create: () => 'created-error-0006' }],
            [() => false, { create: () => 'created-error-0007' }],
          ],
          expected: 'created-error-0007',
        },
        {
          label: 'the third of three rules',
          mockValidationEntries: [
            [() => true, { create: () => 'created-error-0008' }],
            [() => true, { create: () => 'created-error-0009' }],
            [() => false, { create: () => 'created-error-0010' }],
          ],
          expected: 'created-error-0010',
        },
      ]

      test.each(cases)('label: $label', ({
        mockValidationEntries,
        expected,
      }) => {
        const validator = BaseInputValidator.create({
          input: {
            email: 'daiki.morishita@expense-note.example', // neutral value; the stubbed rules read nothing
          },
          errorHash: {},
        })
        jest.spyOn(validator, 'generateValidationEntries')
          .mockReturnValue(mockValidationEntries)

        const actual = validator.validateInput()

        expect(actual)
          .toBe(expected)
      })
    })

    describe('when several rules are not fulfilled', () => {
      const cases = [
        {
          label: 'the first two of three rules',
          mockValidationEntries: [
            [() => false, { create: () => 'created-error-0011' }],
            [() => false, { create: () => 'created-error-0012' }],
            [() => true, { create: () => 'created-error-0013' }],
          ],
          expected: 'created-error-0011',
        },
        {
          label: 'the last two of three rules',
          mockValidationEntries: [
            [() => true, { create: () => 'created-error-0014' }],
            [() => false, { create: () => 'created-error-0015' }],
            [() => false, { create: () => 'created-error-0016' }],
          ],
          expected: 'created-error-0015',
        },
        {
          label: 'every one of three rules',
          mockValidationEntries: [
            [() => false, { create: () => 'created-error-0017' }],
            [() => false, { create: () => 'created-error-0018' }],
            [() => false, { create: () => 'created-error-0019' }],
          ],
          expected: 'created-error-0017',
        },
      ]

      test.each(cases)('label: $label', ({
        mockValidationEntries,
        expected,
      }) => {
        const validator = BaseInputValidator.create({
          input: {
            email: 'sakura.umeda@expense-note.example', // neutral value; the stubbed rules read nothing
          },
          errorHash: {},
        })
        jest.spyOn(validator, 'generateValidationEntries')
          .mockReturnValue(mockValidationEntries)

        const actual = validator.validateInput()

        expect(actual)
          .toBe(expected)
      })
    })

    describe('should create the error the failing rule carries', () => {
      const cases = [
        {
          label: 'the only rule declared',
          mockErrorCtor: {
            create: () => 'created-error-0020',
          },
          expected: 'created-error-0020',
        },
        {
          label: 'the only rule declared, answering another error',
          mockErrorCtor: {
            create: () => 'created-error-0021',
          },
          expected: 'created-error-0021',
        },
      ]

      test.each(cases)('label: $label', ({
        mockErrorCtor,
        expected,
      }) => {
        const validator = BaseInputValidator.create({
          input: {
            email: 'haruka.arai@expense-note.example', // neutral value; the stubbed rule reads nothing
          },
          errorHash: {},
        })

        const createSpy = jest.spyOn(mockErrorCtor, 'create')
        jest.spyOn(validator, 'generateValidationEntries')
          .mockReturnValue([
            [() => false, mockErrorCtor],
          ])

        const actual = validator.validateInput()

        expect(actual)
          .toBe(expected)
        expect(createSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})
