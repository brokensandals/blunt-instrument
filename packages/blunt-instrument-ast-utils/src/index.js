import * as types from '@babel/types';

/**
 * Retrieves the blunt-instrument node ID from a babel node, if one has been set.
 * @param {Node} node
 * @return {string} the node ID, or null if there is none
 */
export function getNodeId(node) {
  if (!node.extra) {
    return null;
  }

  if (typeof node.extra.biNodeId !== 'string') {
    return null;
  }

  return node.extra.biNodeId;
}

/**
 * Sets the blunt-instrument node ID on a babel node,
 * which is used for correlating traced events to AST nodes.
 * Currently this is stored in node.extra.biNodeId
 * @param {Node} node
 * @param {string} id
 */
export function setNodeId(node, id) {
  // TODO: I really have no idea whether this sort of thing is
  // what 'extra' is for
  if (!node.extra) {
    node.extra = {};
  }

  node.extra.biNodeId = id;
}

/**
 * Copy the node ID from one AST node to another.
 * @param {Node} from 
 * @param {Node} to 
 */
export function copyNodeId(from, to) {
  setNodeId(to, getNodeId(from));
}

/**
 * Traverse an AST and attach sequential identifiers to each node.
 * Nodes which already have an ID will not be altered.
 * @param {Node} root - the parent which will be annotated along with its descendants
 * @param {string} prefix - a string to be prepended to all sequential identifiers generated
 */
export function annotateWithNodeIds(root, prefix) {
  let nextId = 1;
  types.traverseFast(root, (node) => {
    if (!getNodeId(node)) {
      const nodeId = prefix + nextId;
      nextId += 1;
      setNodeId(node, nodeId);
    }
  });
}

/**
 * Wraps a babel AST to enable more convenient or efficient lookups.
 * Every node should have a field `extra.biNodeId` to uniquely identify it.
 */
export class ASTQuerier {
  /**
   * @param {Node} ast - root node of the babel AST
   * @param {string} code - source code corresponding to the AST
   */
  constructor(ast, code) {
    this.ast = ast;
    this.code = code;

    const nodesById = new Map();
    types.traverseFast(ast, (node) => {
      if (!node.type) {
        return;
      }
      if (!getNodeId(node)) {
        throw new Error('Node is missing biNodeId: ' + node);
      }

      // TODO avoid destructive modification
      node.extra.code = code.slice(node.start, node.end);

      nodesById.set(node.extra.biNodeId, node);
    });

    this.nodesById = nodesById;
  }
}
