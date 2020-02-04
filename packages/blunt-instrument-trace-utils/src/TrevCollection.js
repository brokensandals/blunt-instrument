import { ASTBundle } from 'blunt-instrument-ast-utils';

/**
 * @typedef {Object} TrevExtended
 * @property {number} id
 * @property {?number} parentId - indicates the trev which enclosed this one on the call stack
 * @property {string} type - type of trace event
 * @property {string} astId - AST id of the node representing the code which this trev is for
 * @property {number} nodeId - node id of the node representing the code which this trev is for
 * @property {*} data - traced data, encoded via object-graph-as-json
 * @property {?number} fnStartId - for type=fn-resume, the id of the type=fn-start trev in which
 *   the generator/async function first began executing
 * @property {?Object} denormalized - populated by TrevCollection.withDenormalizedInfo()
 * @property {number[]} denormalized.ancestorIds - ids of every trev above this on the call stack
 * @property {Node} denormalized.node - babel node corresponding to the astId and nodeId
 */

/**
 * @typedef {Object} TrevCollectionFacets
 * @property {Map} nodes - map of babel @type {Node} to @type {number} of times trevs for
 *   that node in the collection
 * @property {Map} nodeTypes - map of @type {string} babel node type to @type {number} of trevs
 *   for that node type in the collection
 * @property {Map} types - map of @type {string} trev type to @type {number} of trevs of that
 *   type in the collection
 */

/**
 * Wraps a group of trace events and their associated AST(s).
 */
export default class TrevCollection {
  /**
   * @param {TrevExtended} trevs
   * @param {ASTBundle} astb
   */
  constructor(trevs, astb) {
    this.trevs = trevs;
    this.astb = astb;

    const trevsById = new Map();
    trevs.forEach((trev) => {
      trevsById.set(trev.id, trev);
    });
    this.trevsById = trevsById;
  }

  /**
   * @param {number} id
   * @returns the trev for the given ID, or undefined
   */
  getTrev(id) {
    return this.trevsById.get(id);
  }

  /**
   * @returns {TrevCollection} with the `denormalized` field populated on each trev
   * @throws when a trev's parentId or astId & nodeId combination is invalid
   */
  withDenormalizedInfo() {
    const newTrevs = [];
    const ancestorsForParent = [];
    const getAncestors = (parentId) => {
      if (!parentId) {
        return [];
      }

      const existing = ancestorsForParent[parentId];
      if (existing) {
        return existing;
      }

      const parent = this.getTrev(parentId);
      if (!parent) {
        throw new Error(`Trev has invalid parentId [${parentId}]`);
      }

      const ancestors = [...getAncestors(parent.parentId), parentId];
      ancestorsForParent[parentId] = ancestors;
      return ancestors;
    };

    this.trevs.forEach((trev) => {
      const node = this.astb.getNode(trev.astId, trev.nodeId);
      if (!node) {
        throw new Error(`Trev id [${trev.id}] has unknown node id [${trev.nodeId}] for AST id [${trev.astId}]`);
      }

      const denormalized = {
        ancestorIds: getAncestors(trev.parentId),
        node,
      };
      newTrevs.push({ ...trev, denormalized });
    });

    return new TrevCollection(newTrevs, this.astb);
  }

  /**
   * @returns {TrevCollection} with the `denormalized` field removed from each trev
   */
  withoutDenormalizedInfo() {
    const newTrevs = this.trevs.map((trev) => {
      const { denormalized, ...rest } = trev;
      return rest;
    });
    return new TrevCollection(newTrevs, this.astb);
  }

  /**
   * Calls the provided function for each trev in the collection, and returns a new
   * TrevCollection containing only the ones for which it returned true.
   * @param {function} fn
   * @returns {TrevCollection}
   */
  filter(fn) {
    const filtered = this.trevs.filter(fn);
    return new TrevCollection(filtered, this.astb);
  }

  /**
   * @returns {TrevCollectionFacets}
   */
  getFacets() {
    const facets = {
      nodes: new Map(),
      nodeTypes: new Map(),
      types: new Map(),
    };

    this.trevs.forEach((trev) => {
      const node = this.astb.getNode(trev.astId, trev.nodeId);
      if (!node) {
        return;
      }

      facets.nodes.set(node, (facets.nodes.get(node) || 0) + 1);
      facets.nodeTypes.set(node.type, (facets.nodeTypes.get(node.type) || 0) + 1);
      facets.types.set(trev.type, (facets.types.get(trev.type) || 0) + 1);
    });

    return facets;
  }

  /**
   * @returns {Object} a representation of this TrevCollection that can be serialized as JSON
   *   and later deserialized and loaded using fromJSON
   */
  asJSON() {
    const tc = this.withoutDenormalizedInfo();
    return {
      asts: tc.astb.asts,
      trevs: tc.trevs,
    };
  }

  /**
   * Restores an instance that was saved using asJSON()
   * @param {Object} input
   * @returns {TrevCollection}
   */
  static fromJSON(input) {
    if (!input.asts || !input.trevs) {
      throw new Error('Expected `asts` and `trevs` fields');
    }

    const astb = new ASTBundle(input.asts);
    return new TrevCollection(input.trevs, astb);
  }

  /**
   * @returns {TrevCollection} empty TrevCollection with no ASTs.
   */
  static empty() {
    return new TrevCollection([], new ASTBundle());
  }
}
