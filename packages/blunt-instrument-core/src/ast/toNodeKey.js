/**
 * Builds a string composite key from an AST id and a node id.
 * @param {string} astId
 * @param {number} nodeId
 * @returns {string}
 */
export default function toNodeKey(astId, nodeId) {
  return `${encodeURIComponent(astId)}:${nodeId}`;
}
