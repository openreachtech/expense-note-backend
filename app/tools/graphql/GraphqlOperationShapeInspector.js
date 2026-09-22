import {
  Kind,
  parse,
} from 'graphql'

import GRAPHQL_DOCUMENT_CONSTANT_HASH from '../../constants/graphqlDocumentConstants.js'

const {
  GRAPHQL_DOCUMENT: {
    MAXIMUM_ROOT_SELECTION_COUNT,
    MAXIMUM_SELECTION_DEPTH,
  },
} = GRAPHQL_DOCUMENT_CONSTANT_HASH

/*
 * What marks a field as the schema describing itself rather than this product answering.
 *
 * The GraphQL specification reserves the double underscore for its own meta-fields — `__schema`,
 * `__type`, `__typename` — and forbids a schema from declaring anything else with it. So the
 * prefix is a guarantee, not a heuristic.
 */
const META_FIELD_NAME_PREFIX = '__'

/**
 * How wide and how deep the operations in one GraphQL document are, and whether any of them is
 * past what this product will run.
 *
 * -------------------------------------------------------------------------------------------
 * What it measures, and why those two things
 * -------------------------------------------------------------------------------------------
 *
 * **Root selections, aliases included.** A document may name the same field over and over under
 * different aliases, and every one of them is resolved. That is the amplification the limit
 * exists for: sixteen kilobytes of body holds about two hundred and fifty aliased `expenses`
 * calls, each of which runs a `count()` and a `findAll()` of up to a hundred joined rows. Counting
 * *selections* rather than *distinct field names* is the whole point — ten calls to one field
 * count as ten.
 *
 * **Selection depth.** Nothing reachable in the staff schema today is deeper than four, because
 * the schema declares no type that points back at one above it. This is the guard for the day one
 * does; see `constants/graphqlDocumentConstants.cjs`, which carries both numbers and the
 * measurement each was chosen against.
 *
 * -------------------------------------------------------------------------------------------
 * Three things it deliberately does
 * -------------------------------------------------------------------------------------------
 *
 * **It expands fragments.** A limit that counted only what the operation body names outright would
 * be bypassed by moving the aliases into a fragment and spreading it — `query { ...Many }` is one
 * root selection to a naive counter and two hundred and fifty to the executor. So a spread is
 * counted as what it spreads, and an inline fragment as what it holds.
 *
 * **It refuses to follow a fragment twice.** A cyclic spread would otherwise recurse forever, and
 * this runs before GraphQL's own `NoFragmentCyclesRule` has had a chance to refuse the document.
 * The name of every fragment already entered is carried down the walk, and re-entering one
 * contributes nothing. The effect is to **under**-count a cyclic document, which is safe in one
 * direction only and that is the direction it takes: an under-counted document is passed on to
 * GraphQL, which then refuses it for the cycle.
 *
 * **It does not count depth beneath a meta-field.** `getIntrospectionQuery()` measures fifteen
 * levels deep — `TypeRef` unwraps `ofType` nine times — so any cap that let it through would let
 * everything through. Nothing is given up by exempting it: no resolver of this application runs
 * for `__schema` or `__type`, and no row is read. A meta-field contributes zero depth wherever it
 * appears, which also makes a bare `__typename` free.
 *
 * -------------------------------------------------------------------------------------------
 * What it is not
 * -------------------------------------------------------------------------------------------
 *
 * It knows nothing of the schema, of HTTP, or of who is asking. It reads a parsed document and
 * answers one question about its shape. The refusal — the status code, the error code, and which
 * requests are even looked at — belongs to whoever mounts it; in this product that is
 * `StaffGraphqlServerEngine#generateExcessiveOperationRefusingMiddleware()`.
 */
export default class GraphqlOperationShapeInspector {
  /**
   * Constructor.
   *
   * @param {GraphqlOperationShapeInspectorParams} params - Parameters.
   */
  constructor ({
    document,
  }) {
    this.document = document
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof GraphqlOperationShapeInspector ? X : never} T, X
   * @param {GraphqlOperationShapeInspectorFactoryParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    document,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        document,
      })
    )
  }

  /**
   * Parse the text of a document into the tree this class reads.
   *
   * **Answers null rather than throwing on text that is not a document.** A caller presenting a
   * syntax error is refused by GraphQL itself, with a message naming the line and the column, and
   * that is a far better answer than anything this class could give. So a parse failure here means
   * "not mine to judge", and the caller passes the request on untouched.
   *
   * @param {{
   *   source: string
   * }} params - Parameters.
   * @returns {import('graphql').DocumentNode | null} The parsed document, or null when the text is not one.
   * @public
   */
  static parseSource ({
    source,
  }) {
    try {
      return this.graphqlParser(source)
    } catch (parseFailure) {
      return null
    }
  }

  /**
   * get: The parser this class reads a document with — a seam so a test can substitute it.
   *
   * @returns {typeof parse} The `graphql` parser.
   */
  static get graphqlParser () {
    return parse
  }

  /**
   * get: The node kinds this class distinguishes — a seam, and one named dependency on `graphql`.
   *
   * @returns {typeof Kind} The `graphql` node kinds.
   */
  get graphqlKinds () {
    return Kind
  }

  /**
   * get: The most root selections one operation may name.
   *
   * @returns {number} Number of selections.
   */
  get maximumRootSelectionCount () {
    return MAXIMUM_ROOT_SELECTION_COUNT
  }

  /**
   * get: The deepest one operation may nest.
   *
   * @returns {number} Number of levels.
   */
  get maximumSelectionDepth () {
    return MAXIMUM_SELECTION_DEPTH
  }

  /**
   * Whether any operation in this document is past what this product will run.
   *
   * One document may carry several operations, and only one of them is executed per request — but
   * which one is chosen from `operationName`, which the caller supplies, so every operation
   * present is one that could be the executed one.
   *
   * @returns {boolean} true: at least one operation is too wide or too deep.
   * @public
   */
  hasExcessiveOperation () {
    return this.extractOperations()
      .some(operation =>
        this.isExcessiveOperation({
          operation,
        })
      )
  }

  /**
   * Extract the operations this document declares.
   *
   * @returns {Array<import('graphql').OperationDefinitionNode>} Operations, in the order declared.
   */
  extractOperations () {
    return /** @type {*} */ (
      this.document.definitions
        .filter(definition =>
          definition.kind === this.graphqlKinds.OPERATION_DEFINITION
        )
    )
  }

  /**
   * Whether one operation is past either limit.
   *
   * @param {{
   *   operation: import('graphql').OperationDefinitionNode
   * }} params - Parameters.
   * @returns {boolean} true: the operation is too wide or too deep.
   * @public
   */
  isExcessiveOperation ({
    operation,
  }) {
    const rootSelectionCount = this.countRootSelections({
      operation,
    })
    const selectionDepth = this.calculateOperationDepth({
      operation,
    })

    return rootSelectionCount > this.maximumRootSelectionCount
      || selectionDepth > this.maximumSelectionDepth
  }

  /**
   * Count the fields one operation names at its root, aliases and fragments included.
   *
   * @param {{
   *   operation: import('graphql').OperationDefinitionNode
   * }} params - Parameters.
   * @returns {number} Number of root fields the executor would resolve.
   * @public
   */
  countRootSelections ({
    operation,
  }) {
    return this.countSelectionSetFields({
      selectionSet: operation.selectionSet,
      enteredFragmentNames: [],
    })
  }

  /**
   * Count the fields one selection set names, expanding every fragment it reaches.
   *
   * @param {{
   *   selectionSet: import('graphql').SelectionSetNode
   *   enteredFragmentNames: Array<string>
   * }} params - Parameters.
   * @returns {number} Number of fields.
   */
  countSelectionSetFields ({
    selectionSet,
    enteredFragmentNames,
  }) {
    return selectionSet.selections
      .map(selection =>
        this.countSelectionFields({
          selection,
          enteredFragmentNames,
        })
      )
      .reduce(
        (total, count) => total + count,
        0
      )
  }

  /**
   * Count the fields one selection contributes.
   *
   * A field is itself one, whatever it is aliased to and whatever it holds beneath it. A fragment
   * contributes what it spreads.
   *
   * @param {{
   *   selection: import('graphql').SelectionNode
   *   enteredFragmentNames: Array<string>
   * }} params - Parameters.
   * @returns {number} Number of fields.
   */
  countSelectionFields ({
    selection,
    enteredFragmentNames,
  }) {
    if (selection.kind === this.graphqlKinds.FIELD) {
      return 1
    }

    if (selection.kind === this.graphqlKinds.INLINE_FRAGMENT) {
      return this.countSelectionSetFields({
        selectionSet: selection.selectionSet,
        enteredFragmentNames,
      })
    }

    return this.countSpreadFields({
      selection,
      enteredFragmentNames,
    })
  }

  /**
   * Count the fields one fragment spread contributes.
   *
   * A spread naming a fragment this walk has already entered, or one the document never declares,
   * contributes nothing — see the class comment on why under-counting is the safe direction.
   *
   * @param {{
   *   selection: import('graphql').FragmentSpreadNode
   *   enteredFragmentNames: Array<string>
   * }} params - Parameters.
   * @returns {number} Number of fields.
   */
  countSpreadFields ({
    selection,
    enteredFragmentNames,
  }) {
    const fragment = this.extractFragment({
      name: selection.name.value,
      enteredFragmentNames,
    })

    if (!fragment) {
      return 0
    }

    return this.countSelectionSetFields({
      selectionSet: fragment.selectionSet,
      enteredFragmentNames: [
        ...enteredFragmentNames,
        selection.name.value,
      ],
    })
  }

  /**
   * Calculate how deep one operation nests.
   *
   * @param {{
   *   operation: import('graphql').OperationDefinitionNode
   * }} params - Parameters.
   * @returns {number} Number of levels; a root field holding nothing is one.
   * @public
   */
  calculateOperationDepth ({
    operation,
  }) {
    return this.calculateSelectionSetDepth({
      selectionSet: operation.selectionSet,
      enteredFragmentNames: [],
    })
  }

  /**
   * Calculate how deep the deepest selection of one selection set reaches.
   *
   * @param {{
   *   selectionSet: import('graphql').SelectionSetNode
   *   enteredFragmentNames: Array<string>
   * }} params - Parameters.
   * @returns {number} Number of levels.
   */
  calculateSelectionSetDepth ({
    selectionSet,
    enteredFragmentNames,
  }) {
    return selectionSet.selections
      .map(selection =>
        this.calculateSelectionDepth({
          selection,
          enteredFragmentNames,
        })
      )
      .reduce(
        (deepest, depth) => Math.max(deepest, depth),
        0
      )
  }

  /**
   * Calculate how deep one selection reaches.
   *
   * A fragment adds no level of its own: it stands for what it holds, at the place it is spread.
   *
   * @param {{
   *   selection: import('graphql').SelectionNode
   *   enteredFragmentNames: Array<string>
   * }} params - Parameters.
   * @returns {number} Number of levels.
   */
  calculateSelectionDepth ({
    selection,
    enteredFragmentNames,
  }) {
    if (this.isMetaFieldSelection({
      selection,
    })) {
      return 0
    }

    if (selection.kind === this.graphqlKinds.FIELD) {
      return 1 + this.calculateFieldChildDepth({
        selection,
        enteredFragmentNames,
      })
    }

    if (selection.kind === this.graphqlKinds.INLINE_FRAGMENT) {
      return this.calculateSelectionSetDepth({
        selectionSet: selection.selectionSet,
        enteredFragmentNames,
      })
    }

    return this.calculateSpreadDepth({
      selection,
      enteredFragmentNames,
    })
  }

  /**
   * Whether one selection is the schema describing itself.
   *
   * @param {{
   *   selection: import('graphql').SelectionNode
   * }} params - Parameters.
   * @returns {boolean} true: a meta-field, whose depth this class does not count.
   */
  isMetaFieldSelection ({
    selection,
  }) {
    if (selection.kind !== this.graphqlKinds.FIELD) {
      return false
    }

    return selection.name.value.startsWith(META_FIELD_NAME_PREFIX)
  }

  /**
   * Calculate how deep what one field holds reaches.
   *
   * A leaf holds no selection set at all, and reaches no further.
   *
   * @param {{
   *   selection: import('graphql').FieldNode
   *   enteredFragmentNames: Array<string>
   * }} params - Parameters.
   * @returns {number} Number of levels beneath the field.
   */
  calculateFieldChildDepth ({
    selection,
    enteredFragmentNames,
  }) {
    if (!selection.selectionSet) {
      return 0
    }

    return this.calculateSelectionSetDepth({
      selectionSet: selection.selectionSet,
      enteredFragmentNames,
    })
  }

  /**
   * Calculate how deep one fragment spread reaches.
   *
   * @param {{
   *   selection: import('graphql').FragmentSpreadNode
   *   enteredFragmentNames: Array<string>
   * }} params - Parameters.
   * @returns {number} Number of levels.
   */
  calculateSpreadDepth ({
    selection,
    enteredFragmentNames,
  }) {
    const fragment = this.extractFragment({
      name: selection.name.value,
      enteredFragmentNames,
    })

    if (!fragment) {
      return 0
    }

    return this.calculateSelectionSetDepth({
      selectionSet: fragment.selectionSet,
      enteredFragmentNames: [
        ...enteredFragmentNames,
        selection.name.value,
      ],
    })
  }

  /**
   * Extract one fragment this document declares, by name.
   *
   * Answers null for a name this walk has already entered, which is what stops a cyclic spread
   * recursing forever, and null for a name the document never declares.
   *
   * @param {{
   *   name: string
   *   enteredFragmentNames: Array<string>
   * }} params - Parameters.
   * @returns {import('graphql').FragmentDefinitionNode | null} The fragment, or null.
   */
  extractFragment ({
    name,
    enteredFragmentNames,
  }) {
    if (enteredFragmentNames.includes(name)) {
      return null
    }

    const declaredFragment = this.document.definitions
      .find(definition =>
        definition.kind === this.graphqlKinds.FRAGMENT_DEFINITION
        && definition.name.value === name
      )

    return /** @type {*} */ (
      declaredFragment
      ?? null
    )
  }
}

/**
 * @typedef {{
 *   document: import('graphql').DocumentNode
 * }} GraphqlOperationShapeInspectorParams
 */

/**
 * @typedef {GraphqlOperationShapeInspectorParams} GraphqlOperationShapeInspectorFactoryParams
 */
