// TODO babel probably provides a better way to do this
function findNodes(object) {
  if (object == null || typeof object !== 'object') {
    return [];
  }

  if (Array.isArray(object)) {
    return object.flatMap(findNodes);
  }

  if (object.type) {
    return [object];
  }

  return Object.keys(object).flatMap(k => findNodes(object[k]));
}

/**
 * Finds the direct children of the given Babel node.
 * @param {Node} node
 * @returns {Node[]}
 */
export default function findChildNodes(node) {
  return Object.keys(node).flatMap(k => findNodes(node[k]));
}