# blunt-instrument-trace-utils

When code instrumented by blunt-instrument is executed, it produces a trace.
The trace is a sequence of trace events, which blunt-instrument refers to as "trevs".
This package assists in working with trevs.

## TrevCollection

A TrevCollection contains a list of trace events, along with the ASTs for the code that generated those events.
It provides convenience methods for denormalizing extra data onto the trevs and getting basic statistics about them.

You must already have an ASTBundle instance before creating a TrevCollection; see [blunt-instrument-ast-utils][ast-utils].

A trevs array can be acquired by using [blunt-instrument-eval][eval], which will also create a TrevCollection for you.
Alternatively, you can use [blunt-instrument-babel-plugin][babel-plugin] directly, and retrieve the `trevs` field from whatever `Trace` instance you configure it to write to.

```javascript
const tc = new TrevCollection(trevs, astBundle);

// Get all the trevs in the collection
trevCollection.trevs;

// Get a new TrevCollection filtered according to a function you provide -
// in this case, find all the times that any expression evaluated to the
// string "hello world!"
tc.filter((trev) => trev.type === 'expr' && trev.data === 'hello world!');

// Attach extra fields to all the trevs for convenience
const fancyTC = tc.withDenormalizedInfo();

// Filter out literals; i.e., for a trace of the code 'x = y + 3',
// omit all the entries reporting that 3 evaluated to 3.
import types from '@babel/types';
fancyTC.filter((trev) => !types.isLiteral(trev.denormalized.node));

// Get three Maps: one mapping Nodes to the number of trevs in the collection
// for that Node; one mapping node types to the number of trevs in the collection
// for that node type; and one mapping trev types to the number of trevs in the
// collection for that type.
const { nodes, nodeTypes, types } = tc.getFacets();
```

[ast-utils]: ../blunt-instrument-ast-utils/README.md
[eval]: ../blunt-instrument-eval/README.md
[babel-plugin]: ../blunt-instrument-babel-plugin/README.md
