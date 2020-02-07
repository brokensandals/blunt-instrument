import cloneDeep from 'lodash/cloneDeep';
import attachCodeSlicesToAST from './attachCodeSlicesToAST';
import toNodeKey from './toNodeKey';
import traverseAST from './traverseAST';

/**
 * Holds a group of ASTs that were instrumented together, and allows looking up individual
 * nodes by the combination of AST id and node id (or, equivalently, the composite key).
 * All nodes should have a `biId` field before being passed to this class.
 */
export default class ASTBundle {
  constructor() {
    this.asts = {};
    this.nodesByKey = new Map();
    this.sources = {};
  }

  /**
   * Clones, adds, and indexes the given AST.
   * The following fields are added to each AST node method:
   * - a `biASTId` string field
   * - a `biKey` string field containing the result of `toNodeKey`
   * - a `codeSlice` string field
   * @param {string} astId
   * @param {Node} ast - root babel node of the AST
   * @param {string} code - the source code corresponding to the AST
   */
  add(astId, ast, code) {
    ast = cloneDeep(ast); // eslint-disable-line no-param-reassign
    traverseAST(ast, (node) => {
      if (!node.biId) {
        throw new Error('Node is missing node ID');
      }
      node.biASTId = astId; // eslint-disable-line no-param-reassign
      node.biKey = toNodeKey(astId, node.biId); // eslint-disable-line no-param-reassign
      this.nodesByKey.set(node.biKey, node);
    });
    attachCodeSlicesToAST(ast, code);
    this.asts[astId] = ast;
    this.sources[astId] = code;
  }

  /**
   * Retrieve the specified node from the specified AST.
   * @param {string} astId
   * @param {number} nodeId
   * @returns {Node|undefined}
   */
  getNode(astId, nodeId) {
    return this.nodesByKey.get(toNodeKey(astId, nodeId));
  }

  /**
   * Retrieve the specified node using its composite key.
   * @param {*} nodeKey
   * @returns {Node|undefined}
   */
  getNodeByKey(nodeKey) {
    return this.nodesByKey.get(nodeKey);
  }

  /**
   * Retrieve all nodes for which a given function returns true.
   * @param {function} filterFn takes a node and returns true if it should be included in the output
   * @returns {Node[]} all matching nodes
   */
  filterNodes(filterFn) {
    const results = [];
    Object.keys(this.asts).forEach((astId) => {
      traverseAST(this.asts[astId], (node) => {
        if (filterFn(node)) {
          results.push(node);
        }
      });
    });
    return results;
  }

  /**
   * @returns {Object} a representation of this ASTBundle that can be serialized as JSON
   *   and later deserialized and loaded using fromJSON
   */
  asJSON() {
    const asts = {};

    Object.keys(this.asts).forEach((key) => {
      asts[key] = cloneDeep(this.asts[key]);
      traverseAST(asts[key], (node) => {
        delete node.biASTId; // eslint-disable-line no-param-reassign
        delete node.biKey; // eslint-disable-line no-param-reassign
        delete node.codeSlice; // eslint-disable-line no-param-reassign
      });
    });

    return {
      asts,
      sources: this.sources,
    };
  }

  /**
   * Restores an instance that was saved using asJSON()
   * @param {Object} input
   * @returns {ASTBundle}
   */
  static fromJSON(input) {
    if (!input.asts || !input.sources) {
      throw new Error('Expected `asts` and `sources` fields');
    }

    const astb = new ASTBundle();
    Object.keys(input.asts).forEach((key) => {
      astb.add(key, input.asts[key], input.sources[key]);
    });
    return astb;
  }
}
