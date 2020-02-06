import toNodeKey from './toNodeKey';
import traverseAST from './traverseAST';

/**
 * Holds a group of ASTs that were instrumented together, and allows looking up individual
 * nodes by the combination of AST id and node id (or, equivalently, the composite key).
 * All nodes should have a `biId` field before being passed to this class.
 */
export default class ASTBundle {
  /**
   * Note: all the ASTs will be passed to the add() method, which mutates them
   * @param {object} asts a collection of ASTs; each key should be the AST's id, and each value
   *    should be the root babel Node of the AST
   */
  constructor(asts = {}) {
    this.asts = { ...asts };
    this.nodesByKey = new Map();

    Object.keys(asts).forEach((astId) => {
      this.add(astId, asts[astId]);
    });
  }

  /**
   * Adds and indexes the given AST.
    * Note: the given AST is modified by this method:
   * - an `biASTId` string field is added to each node
   * - a `biKey` string field is added to each node containing the result of `toNodeKey`
   * @param {string} astId
   * @param {Node} ast - root babel node of the AST
   */
  add(astId, ast) {
    this.asts[astId] = ast;
    traverseAST(ast, (node) => {
      if (!node.biId) {
        throw new Error('Node is missing node ID');
      }
      node.biASTId = astId; // eslint-disable-line no-param-reassign
      node.biKey = toNodeKey(astId, node.biId); // eslint-disable-line no-param-reassign
      this.nodesByKey.set(node.biKey, node);
    });
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
}
