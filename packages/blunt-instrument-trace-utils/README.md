# blunt-instrument-trace-utils

When code instrumented by blunt-instrument is executed, it generates a series of trace events ("trevs").
This package contains two classes for working with trevs:

- [ArrayTrace](#arraytrace) records the trevs in-memory
- [TrevCollection](#trevcollection) offers some conveniences for interpreting & filtering trevs

## ArrayTrace

An `ArrayTrace` instance will listen to all the trevs reported by a `Tracer` instance and save them to an array.
It also keeps track of any ASTs registered via the Tracer.
See [blunt-instrument-runtime][runtime] for more info about Tracers.
See [blunt-instrument-eval][eval] for a simplified way to instrument & run code & retrieve an ArrayTrace from it.

```js
import { ArrayTrace } from 'blunt-instrument-trace-utils';

const trace = new ArrayTrace();
trace.attach(myTracer);
/* ... invoke some instrumented code ... */

console.log(trace.trevs);
```

See the [babel plugin's README][babel-plugin] for an example of what an array of trevs looks like.

### Data Encoding

One difficulty in producing a full trace of a program is that every value (every number and string, every state of every array and object) needs to be copied or serialized in some way.
`ArrayTrace` encodes the `data` field in every trev using [object-graph-as-json][object-graph-as-json], which attempts to preserve as much information about the objects being copied as it can.

By default, each instance of `ArrayTrace` creates a new instance of `Encoder`, but you can specify an encoder to the constructor instead if you wish:

```js
const trace = new ArrayTrace({ encoder: myEncoder });
```

## TrevCollection

A TrevCollection contains a list of trace events, along with the ASTs for the code that generated those events.
It provides convenience methods for denormalizing extra data onto the trevs and getting basic statistics about them.

You must already have an ASTBundle instance before creating a TrevCollection; see [blunt-instrument-ast-utils][ast-utils].

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

// Get the number of trevs by node, node type, and type.
const { nodes, nodeTypes, types } = tc.getFacets();
```

See the docs in [TrevCollection.js](src/TrevCollection.js) for more info.

[ast-utils]: ../blunt-instrument-ast-utils/README.md
[eval]: ../blunt-instrument-eval/README.md
[babel-plugin]: ../blunt-instrument-babel-plugin/README.md
[runtime]: ../blunt-instrument-runtime/README.md
[object-graph-as-json]: https://github.com/brokensandals/object-graph-as-json
