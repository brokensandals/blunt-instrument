# blunt-instrument-core

Contents:

- [ASTBundle](#astbundle)
- [Tracer](#tracer)
- [ArrayTrace](#arraytrace)
- [TrevCollection](#trevcollection)

## ASTBundle

Programs that have been instrumented with blunt-instrument record the value of each expression they evaluate.
Every value is associated with the node of the program's abstract syntax tree corresponding to the expression, so that you can look up all the values for any given expression.
blunt-instrument uses the [ASTs produced by babel][babel-ast].
This class wraps a set of those ASTs and adds some extra fields to them.

(The instrumenter can instrument multiple files so that they'll produce a combined trace; each file's AST will have its own astId.)

```javascript
const astb = new ASTBundle();
astb.add('one', ast1, sourceCode1);
astb.add('two', ast2, sourceCode2);
astb.getNode('one', 10);
astb.getNodeByKey(toNodeKey('one', 10));
astb.filterNodes((node) => node.codeSlice === 'x + 1');
```

See the JSDoc in [ASTBundle.js](src/ast/ASTBundle.js) for more info.

### Node IDs

Every node in the AST needs a unique identifier so that the tracer can indicate which node a result corresponds to.
This is stored in the `biId` field.

To assign sequential node IDs to all nodes in a tree that don't have them, use `addIdsToAST`.
blunt-instrument-babel-plugin calls this for you.

`biId` is only unique within a single AST.
You need to know the AST's id too to fully identify a node.
The functions `toNodeKey` and `fromNodeKey` provide a way to encode/decode the combination of AST id and node id into a single string for convenience.

`copyNodeIdsBetweenASTs` is available for less common situations.

## Tracer

Instrumented code must be given an instance of the `Tracer` class.
You can either create an instance via `new Tracer()` or rely on the `defaultTracer` instance exported by the package.
If you're using [blunt-instrument-eval][eval], it will create an instance for you; if you're using the [babel plugin][babel-plugin] directly, you can configure it as documented there.

The `Tracer` supports adding listeners which will receive two callbacks, described below.
These can be used for recording the data of a trace; see `ArrayTrace` below for a basic implementation.

### handleTrev

This will be called every time the instrumented code reports that a tracing event ("trev") occurred.
These events include the evaluation of an expression, that start of a function call, returning from a function call, etc.

```js
tracer.addListener({
  onTrev(trev) {
    console.log(trev);
  }
});
```

See [babel-plugin-blunt-instrument's README][babel-plugin] for an example of what trevs look like.
Unlike what's shown there, though, the `data` field on this trev object has not been cloned or encoded in any way, so it might be modified as soon as control returns to the instrumented code.
(The `ArrayTracer` class replaces the `data` field with an encoded copy.)

### handleRegisterAST

This will be called when the instrumented code is initializing, unless that functionality has been disabled in the babel plugin opts.
The arguments are the AST ID (important if you have instrumented multiple files that are all reporting to the same Tracer) and the root babel Node of the AST.

```js
tracer.addListener({
  onRegisterAST(astId, ast) {
    console.log(astId, ast);
  }
});
```

## ArrayTrace

An `ArrayTrace` instance will listen to all the trevs reported by a `Tracer` instance and save them to an array.
It also keeps track of any ASTs registered via the Tracer.
See [blunt-instrument-eval][eval] for a simplified way to instrument & run code & retrieve an ArrayTrace from it.

```js
import { ArrayTrace } from 'blunt-instrument-trace-utils';

const trace = new ArrayTrace();
tracer.addListener(trace);
/* ... invoke some instrumented code ... */

console.log(trace.trevs);
```

See the jsdoc in [ArrayTrace.js](src/trace/ArrayTrace.js) for more info.

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

```javascript
const tc = arrayTrace.toTC();

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

See the JSDoc in [TrevCollection.js](src/trace/TrevCollection.js) for more info.

[babel-ast]: https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#toc-asts
[eval]: ../blunt-instrument-eval/README.md
[babel-plugin]: ../babel-plugin-blunt-instrument/README.md
[object-graph-as-json]: https://github.com/brokensandals/object-graph-as-json
