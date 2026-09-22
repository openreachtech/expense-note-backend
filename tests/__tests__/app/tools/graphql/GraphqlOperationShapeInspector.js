import {
  Kind,
  parse,
} from 'graphql'

import GraphqlOperationShapeInspector from '../../../../../app/tools/graphql/GraphqlOperationShapeInspector.js'

/*
 * The shape limits this class enforces, and what every case below is measured against.
 *
 * They are `constants/graphqlDocumentConstants.cjs`'s two values, written out here as literals
 * rather than imported, so that changing either constant fails a test instead of quietly moving
 * every boundary case with it. That is the one thing a test of a limit owes: the number has to be
 * stated twice, or the test is asserting the implementation against itself.
 *
 * `10` root selections and `6` levels of depth. The measurement behind both is in the constants
 * file, and the short form is: every document this product actually sends names one root field and
 * nests four deep.
 */

describe('GraphqlOperationShapeInspector', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#document', () => {
        const cases = [
          {
            params: {
              source: 'query { expenseCategories { expenseCategories { id } } }',
            },
          },
          {
            params: {
              source: 'mutation { removeExpense (input: { expenseId: 1 }) { expenseId } }',
            },
          },
        ]

        test.each(cases)('source: $params.source', ({
          params,
        }) => {
          const document = parse(params.source)

          const actual = GraphqlOperationShapeInspector.create({
            document,
          })

          expect(actual)
            .toHaveProperty('document', document)
        })
      })
    })
  })
})

describe('GraphqlOperationShapeInspector', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          factoryParams: {
            source: 'query { expenseCategories { expenseCategories { id } } }',
          },
        },
        {
          factoryParams: {
            source: 'query { signedInStaffMember { name } }',
          },
        },
      ]

      test.each(cases)('source: $factoryParams.source', ({
        factoryParams,
      }) => {
        const document = parse(factoryParams.source)

        const actual = GraphqlOperationShapeInspector.create({
          document,
        })

        expect(actual)
          .toBeInstanceOf(GraphqlOperationShapeInspector)
      })
    })

    describe('should be call by constructor', () => {
      const cases = [
        {
          params: {
            source: 'query { expenseCategories { expenseCategories { id } } }',
          },
        },
        {
          params: {
            source: 'query { signedInStaffMember { name } }',
          },
        },
      ]

      test.each(cases)('source: $params.source', ({
        params,
      }) => {
        const document = parse(params.source)
        const SpyClass = globalThis.constructorSpy.spyOn(GraphqlOperationShapeInspector)

        SpyClass.create({
          document,
        })

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith({
            document,
          })
      })
    })
  })
})

describe('GraphqlOperationShapeInspector', () => {
  describe('.parseSource()', () => {
    /*
     * The tree is compared against one `graphql` itself produced from the same text, rather than
     * against a hand-written AST: what is being asserted is that this method hands back what the
     * parser hands back, not that this test can spell out a syntax tree.
     */
    describe('to answer the tree the parser makes of text that is a document', () => {
      const cases = [
        {
          params: {
            source: 'query { signedInStaffMember { name } }',
          },
        },
        {
          params: {
            source: 'mutation { signOut { signedOut } }',
          },
        },
        {
          params: {
            source: 'query { a } fragment Unused on Query { b }',
          },
        },
      ]

      test.each(cases)('source: $params.source', ({
        params,
      }) => {
        const expected = parse(params.source)

        const actual = GraphqlOperationShapeInspector.parseSource(params)

        expect(actual)
          .toEqual(expected)
      })
    })

    /*
     * A caller presenting a syntax error is refused by GraphQL itself, with a message naming the
     * line and the column. So this method says "not mine to judge" rather than throwing, and the
     * middleware above it passes the request on untouched.
     */
    describe('to answer null for text that is not a document', () => {
      const cases = [
        {
          params: {
            source: 'query {',
          },
        },
        {
          params: {
            source: 'this is not a graphql document at all',
          },
        },
        {
          params: {
            source: '',
          },
        },
      ]

      test.each(cases)('source: $params.source', ({
        params,
      }) => {
        const actual = GraphqlOperationShapeInspector.parseSource(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('GraphqlOperationShapeInspector', () => {
  describe('.get:graphqlParser', () => {
    test('to be the parser the graphql package publishes', () => {
      const expected = parse

      const actual = GraphqlOperationShapeInspector.graphqlParser

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('GraphqlOperationShapeInspector', () => {
  describe('#get:graphqlKinds', () => {
    describe('to be the node kinds the graphql package publishes', () => {
      const cases = [
        {
          factoryParams: {
            source: 'query { signedInStaffMember { name } }',
          },
        },
        {
          factoryParams: {
            source: 'mutation { signOut { signedOut } }',
          },
        },
      ]

      test.each(cases)('source: $factoryParams.source', ({
        factoryParams,
      }) => {
        const document = parse(factoryParams.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })
        const expected = Kind

        const actual = inspector.graphqlKinds

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('GraphqlOperationShapeInspector', () => {
  describe('#get:maximumRootSelectionCount', () => {
    describe('to be the count the constants declare, whatever document is held', () => {
      const cases = [
        {
          factoryParams: {
            source: 'query { signedInStaffMember { name } }',
          },
          expected: 10,
        },
        {
          factoryParams: {
            source: 'mutation { signOut { signedOut } }',
          },
          expected: 10,
        },
      ]

      test.each(cases)('source: $factoryParams.source', ({
        factoryParams,
        expected,
      }) => {
        const document = parse(factoryParams.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })

        const actual = inspector.maximumRootSelectionCount

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('GraphqlOperationShapeInspector', () => {
  describe('#get:maximumSelectionDepth', () => {
    describe('to be the depth the constants declare, whatever document is held', () => {
      const cases = [
        {
          factoryParams: {
            source: 'query { signedInStaffMember { name } }',
          },
          expected: 6,
        },
        {
          factoryParams: {
            source: 'mutation { signOut { signedOut } }',
          },
          expected: 6,
        },
      ]

      test.each(cases)('source: $factoryParams.source', ({
        factoryParams,
        expected,
      }) => {
        const document = parse(factoryParams.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })

        const actual = inspector.maximumSelectionDepth

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('GraphqlOperationShapeInspector', () => {
  describe('#hasExcessiveOperation()', () => {
    /*
     * The four shapes that are past a limit, and the fourth is the one the limit exists for.
     *
     * The eleven-alias case is the amplification itself in miniature: eleven calls to one field,
     * which a counter of *distinct field names* would read as one. The fragment case is the
     * bypass — the same eleven calls moved behind a single spread — and it is refused for the same
     * count, which is what makes expanding fragments load-bearing rather than tidy.
     *
     * The second operation of a two-operation document counts too: which one runs is chosen from
     * the caller's own `operationName`, so every operation present could be the executed one.
     */
    describe('to refuse a document past a limit', () => {
      const cases = [
        {
          factoryParams: {
            source: 'query { a1: f b1: f c1: f d1: f e1: f f1: f g1: f h1: f i1: f j1: f k1: f }',
          },
        },
        {
          factoryParams: {
            source: 'query { f0 { f1 { f2 { f3 { f4 { f5 { f6 } } } } } } }',
          },
        },
        {
          factoryParams: {
            source: 'query { ...Many } fragment Many on Query { a1: f b1: f c1: f d1: f e1: f f1: f g1: f h1: f i1: f j1: f k1: f }',
          },
        },
        {
          factoryParams: {
            source: 'query First { f } query Second { a1: f b1: f c1: f d1: f e1: f f1: f g1: f h1: f i1: f j1: f k1: f }',
          },
        },
      ]

      test.each(cases)('source: $factoryParams.source', ({
        factoryParams,
      }) => {
        const document = parse(factoryParams.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })

        const actual = inspector.hasExcessiveOperation()

        expect(actual)
          .toBeTruthy()
      })
    })

    /*
     * Both boundaries sit here, exactly at the limit rather than under it, because a limit tested
     * only well inside itself would pass with an off-by-one.
     *
     * The first case is the real document: the deepest one this product sends, taken from
     * `tests/__tests__/server/graphql/resolvers/staff/stub/execute-expense-stub-operations.js`,
     * which is four levels deep — `expenses` to `expenses` to `expenseCategory` to `name`. It is
     * here so that a limit tightened past legitimate traffic fails as a limit rather than as a
     * mystery in the stub-execution suite.
     *
     * The introspection case carries the meta-field exemption: `getIntrospectionQuery()` measures
     * fifteen levels deep, so without the exemption a cap clearing it would clear everything.
     */
    describe('to allow a document within both limits', () => {
      const cases = [
        {
          factoryParams: {
            source: 'query { expenses (input: $input) { expenses { id expenseCategory { id name } } pagination { sort { key } } } }',
          },
        },
        {
          factoryParams: {
            source: 'query { a1: f b1: f c1: f d1: f e1: f f1: f g1: f h1: f i1: f j1: f }',
          },
        },
        {
          factoryParams: {
            source: 'query { f0 { f1 { f2 { f3 { f4 { f5 } } } } } }',
          },
        },
        {
          factoryParams: {
            source: 'query { __type (name: "Expense") { fields { type { ofType { ofType { ofType { name } } } } } } }',
          },
        },
        {
          factoryParams: {
            source: 'fragment Lonely on Query { f }',
          },
        },
      ]

      test.each(cases)('source: $factoryParams.source', ({
        factoryParams,
      }) => {
        const document = parse(factoryParams.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })

        const actual = inspector.hasExcessiveOperation()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('GraphqlOperationShapeInspector', () => {
  describe('#extractOperations()', () => {
    describe('to name every operation the document declares, and nothing else', () => {
      const cases = [
        {
          factoryParams: {
            source: 'query { f }',
          },
          expected: 1,
        },
        {
          factoryParams: {
            source: 'query First { f } mutation Second { g }',
          },
          expected: 2,
        },
        {
          factoryParams: {
            source: 'query First { f } fragment Aside on Query { g }',
          },
          expected: 1,
        },
      ]

      test.each(cases)('source: $factoryParams.source', ({
        factoryParams,
        expected,
      }) => {
        const document = parse(factoryParams.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })

        const actual = inspector.extractOperations()

        expect(actual)
          .toHaveLength(expected)
      })
    })

    describe('to name none where the document declares only fragments', () => {
      const cases = [
        {
          factoryParams: {
            source: 'fragment Lonely on Query { f }',
          },
        },
        {
          factoryParams: {
            source: 'fragment First on Query { f } fragment Second on Query { g }',
          },
        },
      ]

      test.each(cases)('source: $factoryParams.source', ({
        factoryParams,
      }) => {
        const document = parse(factoryParams.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })

        const actual = inspector.extractOperations()

        expect(actual)
          .toHaveLength(0)
      })
    })
  })
})

describe('GraphqlOperationShapeInspector', () => {
  describe('#isExcessiveOperation()', () => {
    describe('to refuse an operation past either limit', () => {
      const cases = [
        {
          params: {
            source: 'query { a1: f b1: f c1: f d1: f e1: f f1: f g1: f h1: f i1: f j1: f k1: f }',
          },
        },
        {
          params: {
            source: 'query { f0 { f1 { f2 { f3 { f4 { f5 { f6 } } } } } } }',
          },
        },
      ]

      test.each(cases)('source: $params.source', ({
        params,
      }) => {
        const document = parse(params.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })
        const [operation] = document.definitions

        const actual = inspector.isExcessiveOperation({
          operation,
        })

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('to allow an operation at both limits', () => {
      const cases = [
        {
          params: {
            source: 'query { a1: f b1: f c1: f d1: f e1: f f1: f g1: f h1: f i1: f j1: f }',
          },
        },
        {
          params: {
            source: 'query { f0 { f1 { f2 { f3 { f4 { f5 } } } } } }',
          },
        },
      ]

      test.each(cases)('source: $params.source', ({
        params,
      }) => {
        const document = parse(params.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })
        const [operation] = document.definitions

        const actual = inspector.isExcessiveOperation({
          operation,
        })

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('GraphqlOperationShapeInspector', () => {
  describe('#countRootSelections()', () => {
    /*
     * Aliases count one apiece — three calls to one field are three, not one — which is the whole
     * point of counting selections rather than distinct names. A spread counts as what it spreads,
     * and an inline fragment as what it holds, so neither is a way around the count.
     */
    describe('to count every field the executor would resolve at the root', () => {
      const cases = [
        {
          params: {
            source: 'query { f }',
          },
          expected: 1,
        },
        {
          params: {
            source: 'query { a1: f b1: f c1: f }',
          },
          expected: 3,
        },
        {
          params: {
            source: 'query { f { deep { deeper } } }',
          },
          expected: 1,
        },
        {
          params: {
            source: 'query { ...Pair } fragment Pair on Query { f g }',
          },
          expected: 2,
        },
        {
          params: {
            source: 'query { f ... on Query { g h } }',
          },
          expected: 3,
        },
        {
          params: {
            source: 'query { ...Outer } fragment Outer on Query { f ...Inner } fragment Inner on Query { g h }',
          },
          expected: 3,
        },
      ]

      test.each(cases)('source: $params.source', ({
        params,
        expected,
      }) => {
        const document = parse(params.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })
        const [operation] = document.definitions

        const actual = inspector.countRootSelections({
          operation,
        })

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('GraphqlOperationShapeInspector', () => {
  describe('#countSelectionSetFields()', () => {
    describe('to count the fields one selection set names', () => {
      const cases = [
        {
          params: {
            source: 'query { f g h }',
            enteredFragmentNames: [],
          },
          expected: 3,
        },
        {
          params: {
            source: 'query { ...Pair } fragment Pair on Query { f g }',
            enteredFragmentNames: [],
          },
          expected: 2,
        },
        {
          params: {
            source: 'query { ...Pair } fragment Pair on Query { f g }',
            enteredFragmentNames: ['Pair'],
          },
          expected: 0,
        },
      ]

      test.each(cases)('enteredFragmentNames: $params.enteredFragmentNames, source: $params.source', ({
        params,
        expected,
      }) => {
        const document = parse(params.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })
        const [operation] = document.definitions
        const { selectionSet } = operation

        const actual = inspector.countSelectionSetFields({
          selectionSet,
          enteredFragmentNames: params.enteredFragmentNames,
        })

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('GraphqlOperationShapeInspector', () => {
  describe('#countSelectionFields()', () => {
    describe('to count what one selection contributes', () => {
      const cases = [
        {
          params: {
            source: 'query { f }',
            enteredFragmentNames: [],
          },
          expected: 1,
        },
        {
          params: {
            source: 'query { aliased: f { deep { deeper } } }',
            enteredFragmentNames: [],
          },
          expected: 1,
        },
        {
          params: {
            source: 'query { ... on Query { f g h } }',
            enteredFragmentNames: [],
          },
          expected: 3,
        },
        {
          params: {
            source: 'query { ...Pair } fragment Pair on Query { f g }',
            enteredFragmentNames: [],
          },
          expected: 2,
        },
      ]

      test.each(cases)('source: $params.source', ({
        params,
        expected,
      }) => {
        const document = parse(params.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })
        const [operation] = document.definitions
        const [selection] = operation.selectionSet.selections

        const actual = inspector.countSelectionFields({
          selection,
          enteredFragmentNames: params.enteredFragmentNames,
        })

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('GraphqlOperationShapeInspector', () => {
  describe('#countSpreadFields()', () => {
    /*
     * The two ways a spread contributes nothing: a name the document never declares, and a name
     * this walk has already entered. The second is what stops a cyclic spread recursing forever,
     * and it under-counts on purpose — an under-counted document is passed on to GraphQL, which
     * then refuses it for the cycle.
     */
    describe('to count what one spread contributes', () => {
      const cases = [
        {
          params: {
            source: 'query { ...Pair } fragment Pair on Query { f g }',
            enteredFragmentNames: [],
          },
          expected: 2,
        },
        {
          params: {
            source: 'query { ...Missing }',
            enteredFragmentNames: [],
          },
          expected: 0,
        },
        {
          params: {
            source: 'query { ...Pair } fragment Pair on Query { f g }',
            enteredFragmentNames: ['Pair'],
          },
          expected: 0,
        },
        {
          params: {
            source: 'query { ...Cycle } fragment Cycle on Query { f ...Cycle }',
            enteredFragmentNames: [],
          },
          expected: 1,
        },
      ]

      test.each(cases)('enteredFragmentNames: $params.enteredFragmentNames, source: $params.source', ({
        params,
        expected,
      }) => {
        const document = parse(params.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })
        const [operation] = document.definitions
        const [selection] = operation.selectionSet.selections

        const actual = inspector.countSpreadFields({
          selection,
          enteredFragmentNames: params.enteredFragmentNames,
        })

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('GraphqlOperationShapeInspector', () => {
  describe('#calculateOperationDepth()', () => {
    /*
     * The first case is the deepest document this product actually sends, and it measures four.
     * That number is what both limits were chosen against, so it is written out as a case rather
     * than left implied.
     */
    describe('to measure how deep one operation nests', () => {
      const cases = [
        {
          params: {
            source: 'query { expenses (input: $input) { expenses { id expenseCategory { id name } } pagination { sort { key } } } }',
          },
          expected: 4,
        },
        {
          params: {
            source: 'query { f }',
          },
          expected: 1,
        },
        {
          params: {
            source: 'query { f { g } h }',
          },
          expected: 2,
        },
        {
          params: {
            source: 'query { f { ...Deep } } fragment Deep on X { g { h } }',
          },
          expected: 3,
        },
        {
          params: {
            source: 'query { __schema { types { fields { type { ofType { ofType { name } } } } } } }',
          },
          expected: 0,
        },
      ]

      test.each(cases)('source: $params.source', ({
        params,
        expected,
      }) => {
        const document = parse(params.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })
        const [operation] = document.definitions

        const actual = inspector.calculateOperationDepth({
          operation,
        })

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('GraphqlOperationShapeInspector', () => {
  describe('#calculateSelectionSetDepth()', () => {
    describe('to measure the deepest selection of one selection set', () => {
      const cases = [
        {
          params: {
            source: 'query { f g { h } }',
            enteredFragmentNames: [],
          },
          expected: 2,
        },
        {
          params: {
            source: 'query { ...Deep } fragment Deep on Query { f { g } }',
            enteredFragmentNames: [],
          },
          expected: 2,
        },
        {
          params: {
            source: 'query { ...Deep } fragment Deep on Query { f { g } }',
            enteredFragmentNames: ['Deep'],
          },
          expected: 0,
        },
      ]

      test.each(cases)('enteredFragmentNames: $params.enteredFragmentNames, source: $params.source', ({
        params,
        expected,
      }) => {
        const document = parse(params.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })
        const [operation] = document.definitions
        const { selectionSet } = operation

        const actual = inspector.calculateSelectionSetDepth({
          selectionSet,
          enteredFragmentNames: params.enteredFragmentNames,
        })

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('GraphqlOperationShapeInspector', () => {
  describe('#calculateSelectionDepth()', () => {
    /*
     * A fragment adds no level of its own — it stands for what it holds, at the place it is spread
     * — so the two fragment cases measure exactly what the equivalent inline nesting would.
     */
    describe('to measure how deep one selection reaches', () => {
      const cases = [
        {
          params: {
            source: 'query { f }',
            enteredFragmentNames: [],
          },
          expected: 1,
        },
        {
          params: {
            source: 'query { f { g { h } } }',
            enteredFragmentNames: [],
          },
          expected: 3,
        },
        {
          params: {
            source: 'query { ... on Query { f { g } } }',
            enteredFragmentNames: [],
          },
          expected: 2,
        },
        {
          params: {
            source: 'query { ...Deep } fragment Deep on Query { f { g } }',
            enteredFragmentNames: [],
          },
          expected: 2,
        },
        {
          params: {
            source: 'query { __typename }',
            enteredFragmentNames: [],
          },
          expected: 0,
        },
      ]

      test.each(cases)('source: $params.source', ({
        params,
        expected,
      }) => {
        const document = parse(params.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })
        const [operation] = document.definitions
        const [selection] = operation.selectionSet.selections

        const actual = inspector.calculateSelectionDepth({
          selection,
          enteredFragmentNames: params.enteredFragmentNames,
        })

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('GraphqlOperationShapeInspector', () => {
  describe('#isMetaFieldSelection()', () => {
    describe('to name a field the GraphQL specification reserves for itself', () => {
      const cases = [
        {
          params: {
            source: 'query { __schema { types { name } } }',
          },
        },
        {
          params: {
            source: 'query { __type (name: "Expense") { name } }',
          },
        },
        {
          params: {
            source: 'query { __typename }',
          },
        },
      ]

      test.each(cases)('source: $params.source', ({
        params,
      }) => {
        const document = parse(params.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })
        const [operation] = document.definitions
        const [selection] = operation.selectionSet.selections

        const actual = inspector.isMetaFieldSelection({
          selection,
        })

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('to name nothing else', () => {
      const cases = [
        {
          params: {
            source: 'query { expenseCategories { expenseCategories { id } } }',
          },
        },
        {
          params: {
            source: 'query { ... on Query { __typename } }',
          },
        },
        {
          params: {
            source: 'query { ...Meta } fragment Meta on Query { __typename }',
          },
        },
      ]

      test.each(cases)('source: $params.source', ({
        params,
      }) => {
        const document = parse(params.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })
        const [operation] = document.definitions
        const [selection] = operation.selectionSet.selections

        const actual = inspector.isMetaFieldSelection({
          selection,
        })

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('GraphqlOperationShapeInspector', () => {
  describe('#calculateFieldChildDepth()', () => {
    describe('to measure how deep what one field holds reaches', () => {
      const cases = [
        {
          params: {
            source: 'query { f }',
            enteredFragmentNames: [],
          },
          expected: 0,
        },
        {
          params: {
            source: 'query { f { g } }',
            enteredFragmentNames: [],
          },
          expected: 1,
        },
        {
          params: {
            source: 'query { f { g { h { i } } } }',
            enteredFragmentNames: [],
          },
          expected: 3,
        },
      ]

      test.each(cases)('source: $params.source', ({
        params,
        expected,
      }) => {
        const document = parse(params.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })
        const [operation] = document.definitions
        const [selection] = operation.selectionSet.selections

        const actual = inspector.calculateFieldChildDepth({
          selection,
          enteredFragmentNames: params.enteredFragmentNames,
        })

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('GraphqlOperationShapeInspector', () => {
  describe('#calculateSpreadDepth()', () => {
    describe('to measure how deep one spread reaches', () => {
      const cases = [
        {
          params: {
            source: 'query { ...Deep } fragment Deep on Query { f { g } }',
            enteredFragmentNames: [],
          },
          expected: 2,
        },
        {
          params: {
            source: 'query { ...Missing }',
            enteredFragmentNames: [],
          },
          expected: 0,
        },
        {
          params: {
            source: 'query { ...Deep } fragment Deep on Query { f { g } }',
            enteredFragmentNames: ['Deep'],
          },
          expected: 0,
        },
        {
          params: {
            source: 'query { ...Cycle } fragment Cycle on Query { f { ...Cycle } }',
            enteredFragmentNames: [],
          },
          expected: 1,
        },
      ]

      test.each(cases)('enteredFragmentNames: $params.enteredFragmentNames, source: $params.source', ({
        params,
        expected,
      }) => {
        const document = parse(params.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })
        const [operation] = document.definitions
        const [selection] = operation.selectionSet.selections

        const actual = inspector.calculateSpreadDepth({
          selection,
          enteredFragmentNames: params.enteredFragmentNames,
        })

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('GraphqlOperationShapeInspector', () => {
  describe('#extractFragment()', () => {
    describe('to answer the fragment the document declares under that name', () => {
      const cases = [
        {
          params: {
            source: 'query { f } fragment Wanted on Query { g }',
            name: 'Wanted',
            enteredFragmentNames: [],
          },
        },
        {
          params: {
            source: 'query { f } fragment First on Query { g } fragment Second on Query { h }',
            name: 'Second',
            enteredFragmentNames: ['First'],
          },
        },
      ]

      test.each(cases)('name: $params.name, source: $params.source', ({
        params,
      }) => {
        const document = parse(params.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })
        const expected = params.name

        const actual = inspector.extractFragment({
          name: params.name,
          enteredFragmentNames: params.enteredFragmentNames,
        })

        expect(actual)
          .toHaveProperty('name.value', expected)
      })
    })

    describe('to answer null for a name it must not follow', () => {
      const cases = [
        {
          params: {
            source: 'query { f }',
            name: 'Missing',
            enteredFragmentNames: [],
          },
        },
        {
          params: {
            source: 'query { f } fragment Entered on Query { g }',
            name: 'Entered',
            enteredFragmentNames: ['Entered'],
          },
        },
      ]

      test.each(cases)('name: $params.name, source: $params.source', ({
        params,
      }) => {
        const document = parse(params.source)
        const inspector = GraphqlOperationShapeInspector.create({
          document,
        })

        const actual = inspector.extractFragment({
          name: params.name,
          enteredFragmentNames: params.enteredFragmentNames,
        })

        expect(actual)
          .toBeNull()
      })
    })
  })
})
