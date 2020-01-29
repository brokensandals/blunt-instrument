# blunt-instrument-ast-utils

Programs that have been instrumented with blunt-instrument record the value of each expression they evaluate.
Every value is associated with the node of the program's abstract syntax tree corresponding to the expression, so that you can look up all the values for any given expression.
blunt-instrument uses the [ASTs produced by babel][babel-ast].
This package contains helpers for working with those ASTs.
See the JSDoc in [src/index.js](src/index.js) for detailed information.

## Node IDs

Every node in the AST needs a unique identifier so that the tracer can indicate which node a result corresponds to.
This should be stored in the `biId` field.

To assign sequential node IDs to all nodes in a tree that don't have them, use `addIdsToAST`.
blunt-instrument-babel-plugin calls this for you.

`biId` is only unique within a single AST.
You need to know the AST's id too to fully identify a node.
The functions `toNodeKey` and `fromNodeKey` provide a way to encode/decode the combination of AST id and node id into a single string for convenience.

`copyNodeIdsBetweenASTs` is available for less common situations.

## Code slices

It can be useful to have the code snippet corresponding to an AST node attached directly to the node itself.
Given the root node and the full original source code, `attachCodeSliceToAST(ast, code)` attaches code slices to all nodes in the tree.
Each node for which a code slice could be found will contain a string property named `codeSlice`.

## ASTBundle

The instrumenter can instrument multiple files so that they'll produce a combined trace; each file's AST will have its own astId.
An `ASTBundle` contains the one or many ASTs, keyed by their ids, and indexes all the nodes in them by the combination of AST id and node ID.

Note: two fields are added in-place to the ASTs that you pass to the constructor: `biASTId` and `biKey`.

```javascript
const astb = new ASTBundle({ one: ast1, two: ast2 );
astb.getNode('one', 10);
astb.getNodeByKey(toNodeKey('one', 10));
astb.filterNodes((node) => node.codeSlice === 'x + 1'); // assumes `attachCodeSliceToAST` has been called
```

[babel-ast]: https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#toc-asts
