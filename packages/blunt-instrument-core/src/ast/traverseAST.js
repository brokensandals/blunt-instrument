/**
 * Traverses the given babel AST and calls the given function with each node in
 * the tree.
 * I would just use the traverseFast function from @babel/types, but I don't want
 * to pull in that dependency to this package.
 * @param {Node} node - babel node
 * @param {function} fn
 */
export default function traverseAST(node, fn) {
  if (!(node && typeof node === 'object')) {
    return;
  }

  if (node.type) {
    fn(node);
  }

  Object.values(node).forEach((val) => traverseAST(val, fn));
}
