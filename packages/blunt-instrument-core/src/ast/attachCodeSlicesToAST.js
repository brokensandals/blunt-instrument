import traverseAST from './traverseAST';

/**
 * Attach a field `codeSlice` to each node in an AST, containing the snippet of source
 * code to which the node corresponds. Requires the node to have integer `start` and
 * `end` fields indicating the section of code to which it corresponds.
 * @param {Node} ast - the parent which will be annotated along with its descendants
 * @param {string} code - full source code corresponding to the AST
 */
export default function attachCodeSlicesToAST(ast, code) {
  traverseAST(ast, (node) => {
    if (Number.isInteger(node.start) && Number.isInteger(node.end)) {
      if (node.start < 0 || node.end > code.length) {
        throw new Error(`Node start [${node.start}] or end [${node.end}] is out of range`);
      }

      // eslint-disable-next-line no-param-reassign
      node.codeSlice = code.slice(node.start, node.end);
    }
  });
}
