import traverseAST from './traverseAST';

/**
 * Traverse an AST and attach sequential identifiers to each node.
 * @param {Node} ast - the parent which will be annotated along with its descendants
 */
export default function addNodeIdsToAST(ast) {
  let nextId = 1;
  traverseAST(ast, (node) => {
    node.biId = nextId; // eslint-disable-line no-param-reassign
    nextId += 1;
  });
}
