import * as types from '@babel/types';

export { toNodeKey, fromNodeKey, ASTBundle } from './ASTBundle';

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
 * @param {Node} ast - the parent which will be annotated along with its descendants
 */
export function addNodeIdsToAST(ast) {
  let nextId = 1;
  types.traverseFast(ast, (node) => {
    node.biId = nextId; // eslint-disable-line no-param-reassign
    nextId += 1;
  });
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
