import * as types from '@babel/types';

/**
 * Builds a string composite key from an AST id and a node id.
 * @param {string} astId
 * @param {number} nodeId
 * @returns {string}
 */
export function toNodeKey(astId, nodeId) {
  return `${encodeURIComponent(astId)}:${nodeId}`;
}

/**
 * Parses a string composite key for a node back into an AST id and a node id.
 * @param {string} nodeKey
 * @returns {object} object with string property `astId` and number property `nodeId`
 */
export function fromNodeKey(nodeKey) {
  const split = nodeKey.split(':');
  return {
    astId: decodeURIComponent(split[0]),
    nodeId: Number(split[1]),
  };
}

/**
 * Holds a group of ASTs that were instrumented together, and allows looking up individual
 * nodes by the combination of AST id and node id (or, equivalently, the composite key).
 * All nodes should have a `biId` field before being passed to this class.
 */
export class ASTBundle {
  /**
   * Note: the given ASTs are modified by this method:
   * - an `biAstId` string field is added to each node
   * - a `biKey` string field is added to each node containing the result of `toNodeKey`
   * @param {object} asts a collection of ASTs; each key should be the AST's id, and each value
   *    should be the root babel Node of the AST
   */
  constructor(asts) {
    this.asts = asts;
    const nodesByKey = new Map();

    Object.keys(asts).forEach((astId) => {
      types.traverseFast(asts[astId], (node) => {
        if (!node.biId) {
          throw new Error('Node is missing node ID');
        }
        node.biAstId = astId; // eslint-disable-line no-param-reassign
        node.biKey = toNodeKey(astId, node.biId); // eslint-disable-line no-param-reassign
        nodesByKey.set(node.biKey, node);
      });
    });

    this.nodesByKey = nodesByKey;
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
      types.traverseFast(this.asts[astId], (node) => {
        if (filterFn(node)) {
          results.push(node);
        }
      });
    });
    return results;
  }
}
