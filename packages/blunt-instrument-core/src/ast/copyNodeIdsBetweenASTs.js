import traverseAST from './traverseAST';

/**
 * Copies all node IDs from one AST to another. This should be called with
 * two ASTs that have exactly the same shape.
 * @param {Node} from
 * @param {Node} to
 * @throws error if the two trees do not have the same number and types of nodes
 */
export default function copyNodeIdsBetweenASTs(from, to) {
  const fromNodes = [];
  const toNodes = [];
  traverseAST(from, (node) => fromNodes.push(node));
  traverseAST(to, (node) => toNodes.push(node));

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
