/**
 * Parses a string composite key for a node back into an AST id and a node id.
 * @param {string} nodeKey
 * @returns {object} object with string property `astId` and number property `nodeId`
 */
export default function fromNodeKey(nodeKey) {
  const split = nodeKey.split(':');
  return {
    astId: decodeURIComponent(split[0]),
    nodeId: Number(split[1]),
  };
}
