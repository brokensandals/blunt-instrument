import * as types from '@babel/types';

/**
 * Copies all node IDs from one AST to another. This should be called with
 * two ASTs that have exactly the same shape.
 * @param {Node} from
 * @param {Node} to
 * @throws error if the two trees do not have the same number and types of nodes
 */
export function copyNodeIdsBetweenASTs(from, to) {
  const fromNodes = [];
  const toNodes = [];
  types.traverseFast(from, (node) => fromNodes.push(node));
  types.traverseFast(to, (node) => toNodes.push(node));

  if (fromNodes.length !== toNodes.length) {
    throw new Error(`Source tree has ${fromNodes.length} nodes but destination tree has ${toNodes.length}`);
  }

  for (let i = 0; i < fromNodes.length; i += 1) {
    if (fromNodes[i].type !== toNodes[i].type) {
      throw new Error(`Source node type ${fromNodes[i].type} does not match destination node type ${toNodes[i].type}`);
    }
    toNodes[i].biId = fromNodes[i].biId;
  }
}

/**
 * Traverse an AST and attach sequential identifiers to each node.
 * Nodes which already have an ID will not be altered.
 * @param {Node} ast - the parent which will be annotated along with its descendants
 * @param {string} prefix - a string to be prepended to all sequential identifiers generated
 */
export function addNodeIdsToAST(ast, prefix) {
  let nextId = 1;
  types.traverseFast(ast, (node) => {
    if (!node.biId) {
      const nodeId = prefix + nextId;
      nextId += 1;
      node.biId = nodeId; // eslint-disable-line no-param-reassign
    }
  });
}

/**
 * Retrieve the source code slice from a node, if it has been set.
 * Use `attachCodeSlicesToAST` to set the code slices.
 * @param {Node} node
 * @return {string} the code slice or null
 */
export function getCodeSlice(node) {
  if (typeof node.codeSlice !== 'string') {
    return null;
  }

  return node.codeSlice;
}

/**
 * Attach a field `codeSlice` to each node in an AST, containing the snippet of source
 * code to which the node corresponds. Requires the node to have integer `start` and
 * `end` fields indicating the section of code to which it corresponds.
 * @param {Node} ast - the parent which will be annotated along with its descendants
 * @param {string} code - full source code corresponding to the AST
 */
export function attachCodeSlicesToAST(ast, code) {
  types.traverseFast(ast, (node) => {
    if (Number.isInteger(node.start) && Number.isInteger(node.end)) {
      if (node.start < 0 || node.end > code.length) {
        throw new Error(`Node start [${node.start}] or end [${node.end}] is out of range`);
      }

      // eslint-disable-next-line no-param-reassign
      node.codeSlice = code.slice(node.start, node.end);
    }
  });
}

/**
 * Wraps a babel AST to enable more convenient or efficient lookups.
 * Every node should have a field `biId` to uniquely identify it.
 * If you want to do lookups by source code, you should call `attachCodeSlicesToAST`
 * on the AST before creating the querier.
 */
export class ASTQuerier {
  /**
   * @param {Node} ast - root node of the babel AST
   */
  constructor(ast) {
    this.ast = ast;

    const nodesById = new Map();
    const nodesByCodeSlice = new Map();
    types.traverseFast(ast, (node) => {
      if (!node.type) {
        return;
      }
      if (!node.biId) {
        throw new Error(`Node is missing node ID: ${JSON.stringify(node)}`);
      }

      nodesById.set(node.biId, node);

      const codeSlice = getCodeSlice(node);
      if (codeSlice) {
        let nodes = nodesByCodeSlice.get(codeSlice);
        if (!nodes) {
          nodes = [];
          nodesByCodeSlice.set(codeSlice, nodes);
        }
        nodes.push(node);
      }
    });

    this.nodesById = nodesById;
    this.nodesByCodeSlice = nodesByCodeSlice;
  }

  /**
   * Look up an AST node by its node ID.
   * @param {string} id
   * @return {Node} the node or undefined
   */
  getNodeById(id) {
    return this.nodesById.get(id);
  }

  /**
   * Returns all nodes whose corresponding code snippet is exactly the
   * given string. This only works if `attachCodeSlicesToAST` was called
   * on the AST before creating the querier instance.
   * @param {string} codeSlice exact code snippet to search for
   * @returns {Node[]} array of matching nodes, possibly empty
   */
  getNodesByCodeSlice(codeSlice) {
    return this.nodesByCodeSlice.get(codeSlice) || [];
  }

  /**
   * Retrieve all nodes for which a given function returns true.
   * @param {function} filterFn takes a node and returns true if it should be included in the output
   * @returns {Node[]} all matching nodes
   */
  filterNodes(filterFn) {
    const results = [];
    types.traverseFast(this.ast, (node) => {
      if (filterFn(node)) {
        results.push(node);
      }
    });
    return results;
  }
}
