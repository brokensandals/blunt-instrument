# blunt-instrument-babel-plugin

A babel plugin that automatically adds tracing to the input code (as much as possible).
When the output code is executed, it will produce a log of all the expressions that were evaluated during the course of execution, and their values at each point.

## Usage from code

**Note**: you probably want to use [blunt-instrument-eval][blunt-instrument-eval/README.md] instead of using this directly.

### Creating instrumented code

```javascript
import * as babel from '@babel/core';
import bluntInstrumentPlugin from 'blunt-instrument-babel-plugin';

const originalCode = `
  function fac(n) {
    return n == 1 ? n * fac(n - 1);
  }`;

// All options are optional. The defaults are shown here.
const opts = {
  outputs: { // See the 'extracting
    assignTo: null,
    exportAs: null,
  },
};

const instrumentedCode = babel.transformSync(
  originalCode, { plugins: [[bluntInstrumentPlugin, opts]] }
).code;
```

### Extracting instrumentation outputs

When you run the instrumented code, it will create an **instrumentation object** that looks like:

```javascript
{
  ast: { /** the root babel Node of the abstract syntax tree of the original code */ },
  trace: [
    // Everything recorded by the tracer during execution of the code.
    // Each element is a trace event aka "trev" object.
    {
      id: 1,
      type: 'expr', // these trevs record the result of evaluating some expression
      nodeId: 'src-5', // the corresponding node in `ast` will contain a field `extra.biNodeId` that matches this;
                       // that is the Expression node corresponding to the expression that was evaluated
      data: 'foo', // the value/object the expression evaluated to
    },
    {
      id: 2,
      type: 'fn-start', // these trevs record the beginning of a function's execution
      nodeId: 'src-2', // the Function node that is being entered
      // FIXME: the data field is now encoded using object-graph-as-json, as mentioned below, so it actually looks slightly different than this
      data: { // the values of `this`, `arguments`, and all named parameters, at the beginning of the function's execution
        this: { /* ... */ },
        arguments: { 0: 'bar'},
        myParam: 'bar'
      },
    },
    {
      id: 3,
      parentId: 2, // when defined, this is the id of the trev representing the enclosing context.
                   // this is analogous to the call stack: when a function is called, an fn-start
                   // trev is created, and all trevs created after that until the function returns
                   // will be descended from that trev
      type: 'fn-ret', // these trevs record the end of a function's execution
                       // they can be triggered by a return statement or after the last statement in a function executes
      nodeId: 'src-4', // the corresponding ReturnStatement node; or, if the end of the function was reached without a return
                       // statement being executed, the corresponding Function node
      data: 'foo', // the return value, or undefined
    },
    // ...
  ],
}
```

To access it, you should set one of the `outputs` options in the plugin config.

If you set `assignTo`, the plugin will generate code that stores the instrumentation object in some variable (or object property, or anything that can go on the left hand side of an assignment expression) that you provide.
You could set this to the name of a global variable and read that variable after the instrumented code runs.
A cleaner approach is to wrap the instrumented code in a function that defines the variable and then returns it at the end, like this (this is roughly what [blunt-instrument-eval][blunt-instrument-eval] does):

```javascript
const instrumentedCode = babel.transformSync(
  originalCode, { plugins: [[bluntInstrumentPlugin, { outputs: { assignTo: 'instrumentation' }}]]});

const wrappedCode = `
  (function() {
    var instrumentation;
    (function() {${instrumentedCode}})();
    return instrumentation;
  })()
`;

const instrumentation = (0, eval)(wrappedCode);
```

Alternatively, you can set `exportAs` to some name, and the plugin will generate a statement like:

```javascript
export const nameYouSpecified = /* the instrumentation object */;
```

### Data Encoding

One difficulty in producing a full trace of a program is that every value (every number and string, every state of every array and object) needs to be copied or serialized in some way.
Currently, the `data` field in every trev is produced using [object-graph-as-json][object-graph-as-json], which attempts to preserve as much information about the objects being copied as it can.

[blunt-instrument-eval]: ../blunt-instrument-eval/README.md
[object-graph-as-json]: https://github.com/brokensandals/object-graph-as-json
