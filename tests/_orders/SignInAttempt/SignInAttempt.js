import SignInAttempt from '../../../sequelize/models/SignInAttempt.js'

describe('SignInAttempt', () => {
  describe('.create()', () => {
    describe('should store the attempted address lower cased', () => {
      const cases = [
        {
          params: {
            email: 'Anna@Example.com',
            attemptedAt: new Date('2026-09-01T01:02:03.004Z'),
          },
          expected: expect.objectContaining({
            id: expect.any(Number),
            email: 'anna@example.com',
            attemptedAt: new Date('2026-09-01T01:02:03.004Z'),
          }),
        },
        {
          params: {
            email: 'BRUNO@EXAMPLE.COM',
            attemptedAt: new Date('2026-09-02T02:03:04.005Z'),
          },
          expected: expect.objectContaining({
            id: expect.any(Number),
            email: 'bruno@example.com',
            attemptedAt: new Date('2026-09-02T02:03:04.005Z'),
          }),
        },
        {
          params: {
            email: 'Carla.Di-Marco+notes@Sub.Example.COM',
            attemptedAt: new Date('2026-09-03T03:04:05.006Z'),
          },
          expected: expect.objectContaining({
            id: expect.any(Number),
            email: 'carla.di-marco+notes@sub.example.com',
            attemptedAt: new Date('2026-09-03T03:04:05.006Z'),
          }),
        },
      ]

      test.each(cases)('email: $params.email', async ({
        params,
        expected,
      }) => {
        const actual = await SignInAttempt.create(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SignInAttempt', () => {
  describe('.create()', () => {
    describe('should store two failures on one address under one stored address', () => {
      const cases = [
        {
          params: {
            firstAttempt: {
              email: 'Dario@Example.com',
              attemptedAt: new Date('2026-09-04T04:05:06.007Z'),
            },
            secondAttempt: {
              email: 'dario@EXAMPLE.com',
              attemptedAt: new Date('2026-09-04T04:06:06.008Z'),
            },
          },
          expected: expect.objectContaining({
            id: expect.any(Number),
            email: 'dario@example.com',
            attemptedAt: new Date('2026-09-04T04:06:06.008Z'),
          }),
        },
        {
          params: {
            firstAttempt: {
              email: 'ELENA@Example.com',
              attemptedAt: new Date('2026-09-05T05:06:07.009Z'),
            },
            secondAttempt: {
              email: 'Elena@example.COM',
              attemptedAt: new Date('2026-09-05T05:07:07.010Z'),
            },
          },
          expected: expect.objectContaining({
            id: expect.any(Number),
            email: 'elena@example.com',
            attemptedAt: new Date('2026-09-05T05:07:07.010Z'),
          }),
        },
      ]

      test.each(cases)('secondAttempt.email: $params.secondAttempt.email', async ({
        params,
        expected,
      }) => {
        await SignInAttempt.create(params.firstAttempt)

        const actual = await SignInAttempt.create(params.secondAttempt)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SignInAttempt', () => {
  describe('.bulkCreate()', () => {
    describe('should store every attempted address of a batch lower cased', () => {
      const cases = [
        {
          params: {
            records: [
              {
                email: 'Fabio@Example.com',
                attemptedAt: new Date('2026-09-06T06:07:08.011Z'),
              },
              {
                email: 'GINA@EXAMPLE.COM',
                attemptedAt: new Date('2026-09-06T06:08:08.012Z'),
              },
            ],
          },
          expected: [
            expect.objectContaining({
              email: 'fabio@example.com',
              attemptedAt: new Date('2026-09-06T06:07:08.011Z'),
            }),
            expect.objectContaining({
              email: 'gina@example.com',
              attemptedAt: new Date('2026-09-06T06:08:08.012Z'),
            }),
          ],
        },
        {
          params: {
            records: [
              {
                email: 'Hugo@Sub.Example.COM',
                attemptedAt: new Date('2026-09-07T07:08:09.013Z'),
              },
              {
                email: 'ILARIA@Example.com',
                attemptedAt: new Date('2026-09-07T07:09:09.014Z'),
              },
            ],
          },
          expected: [
            expect.objectContaining({
              email: 'hugo@sub.example.com',
              attemptedAt: new Date('2026-09-07T07:08:09.013Z'),
            }),
            expect.objectContaining({
              email: 'ilaria@example.com',
              attemptedAt: new Date('2026-09-07T07:09:09.014Z'),
            }),
          ],
        },
      ]

      test.each(cases)('records[0].email: $params.records.0.email', async ({
        params,
        expected,
      }) => {
        const actual = await SignInAttempt.bulkCreate(params.records)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SignInAttempt', () => {
  describe('.update()', () => {
    describe('should normalize the address a bulk update writes', () => {
      const cases = [
        {
          params: {
            currentAttempt: {
              email: 'luca@example.com',
              attemptedAt: new Date('2026-09-08T08:09:10.015Z'),
            },
            values: {
              email: 'Luca.Corrected@Example.COM',
            },
          },
          // The hook rewrites the values object in place, and the spy holds that same object,
          // so what it was called with reads as the normalized form.
          expected: {
            attributes: expect.objectContaining({
              email: 'luca.corrected@example.com',
            }),
          },
        },
        {
          params: {
            currentAttempt: {
              email: 'marta@example.com',
              attemptedAt: new Date('2026-09-09T09:10:11.016Z'),
            },
            values: {
              email: 'MARTA.CORRECTED@EXAMPLE.COM',
            },
          },
          expected: {
            attributes: expect.objectContaining({
              email: 'marta.corrected@example.com',
            }),
          },
        },
      ]

      test.each(cases)('values.email: $params.values.email', async ({
        params,
        expected,
      }) => {
        const currentAttempt = await SignInAttempt.create(params.currentAttempt)
        const normalizeSpy = jest.spyOn(SignInAttempt, 'normalizeEmailOfAttributes')

        await SignInAttempt.update(params.values, {
          where: {
            id: currentAttempt.id,
          },
        })

        expect(normalizeSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})
