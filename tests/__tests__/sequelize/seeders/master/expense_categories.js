import ExpenseCategory from '../../../../../sequelize/models/ExpenseCategory.js'

describe('expense_categories master seeder', () => {
  describe('should seed the four categories in their display order', () => {
    test('to read back transport, meals, supplies and other', async () => {
      const expected = [
        expect.objectContaining({
          id: 10000001,
          name: 'transport',
          displayOrder: 1,
        }),
        expect.objectContaining({
          id: 10000002,
          name: 'meals',
          displayOrder: 2,
        }),
        expect.objectContaining({
          id: 10000003,
          name: 'supplies',
          displayOrder: 3,
        }),
        expect.objectContaining({
          id: 10000004,
          name: 'other',
          displayOrder: 4,
        }),
      ]

      const actual = await ExpenseCategory.findAll({
        order: [
          ['displayOrder', 'ASC'],
        ],
      })

      expect(actual)
        .toEqual(expected)
    })
  })
})
