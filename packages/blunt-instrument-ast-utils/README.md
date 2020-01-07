# blunt-instrument-ast-utils

Programs that have been instrumented with blunt-instrument record the value of each expression they evaluate.
Every value is associated with the node of the program's abstract syntax tree corresponding to the expression, so that you can look up all the values for any given expression.
blunt-instrument uses the [ASTs produced by babel][babel-ast].
This package contains helpers for working with those ASTs.
See the JSDoc in [src/index.js](src/index.js) for detailed information.

## Node IDs

Every node in the AST needs a unique identifier so that the tracer can indicate which node a result corresponds to.

To read a node's ID, use `getNodeId(node)`.

To assign sequential node IDs to all nodes in a tree that don't have them, use `addIdsToAST`.
blunt-instrument-babel-plugin calls this for you.

`setNodeId`, `copyNodeId`, and `copyNodeIdsBetweenASTs` are available for less common situations.

## Code slices

It can be useful to have the code snippet corresponding to an AST node attached directly to the node itself.
Given the root node and the full original source code, `attachCodeSliceToAST(ast, code)` attaches code slices to all nodes in the tree.
The `getCodeSlice(node)` function can then be used to retrieve the slice.

## ASTQuerier

The `ASTQuerier` class indexes an AST so you can quickly find nodes by certain criteria.

```javascript
const astq = new ASTQuerier(ast);
astq.getNodeById('node-id-1');
astq.getNodesByCodeSlice('x + 1'); // only works if `attachCodeSliceToAST` was used before creating the querier
```

[babel-ast]: https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#toc-asts
