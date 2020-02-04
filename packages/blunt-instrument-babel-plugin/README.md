# blunt-instrument-babel-plugin

A babel plugin that automatically adds tracing to the input code (as much as possible).
When the output code is executed, it will produce a log of all the expressions that were evaluated during the course of execution, and their values at each point.

## Usage from code

**Note**: you probably want to use [blunt-instrument-eval][blunt-instrument-eval/README.md] instead of doing all this yourself.

### Creating instrumented code

```javascript
import * as babel from '@babel/core';
import bluntInstrumentPlugin from 'blunt-instrument-babel-plugin';

const originalCode = `
  function fac(n) {
    return n == 1 ? n * fac(n - 1);
  }`;

// All options EXCEPT ast.id are optional. The defaults of the others are shown here.
const opts = {
  runtime: {
    mechanism: 'import',
    tracerVar: undefined, // For mechanism='var', make this a string
  },
  ast: {
    id: 'myCode', // This can be any non-empty string, but if you're instrumenting multiple source
                  // files that will be traced together, each one should get a unique id.
    selfRegister: true, // Causes the AST of the original code to be embedded in the generated
                        // code. After the code runs, it can be retrieved from trace.asts[key]
    callback: (ast) => {}, // If provided, this function will be called with the AST of the
                           // original code after the biId property has been added to each node.
  },
};

const instrumentedCode = babel.transformSync(
  originalCode, { plugins: [[bluntInstrumentPlugin, opts]] }
).code;
```

### Injecting the Tracer and retrieving the trace

The instrumented code will report data to an instance of the Tracer class from [blunt-instrument-runtime][blunt-instrument-runtime].
To do anything with the trace, you need to set up the callbacks on the Tracer instance, either manually or by attaching an `ArrayTrace` from [blunt-instrument-trace-utils][blunt-instrument-trace-utils].
Make sure the callbacks have been set on the Tracer *before* the instrumented code is executed.

By default, the instrumented code attempts to use a global tracer by importing `defaultTracer` from [blunt-instrument-runtime][blunt-instrument-runtime].

Alternatively, you can indicate that the tracer instance should be found in a specific variable, by setting `runtime.mechanism` to `'var'` and specifying the variable name in `runtime.tracerVar`:

```javascript
import { Tracer } from 'blunt-instrument-runtime';
import { ArrayTrace } from 'blunt-instrument-trace-utils';

const opts = {
  runtime: {
    mechanism: 'var',
    tracerVar: 'tracer',
  },
  ast: {
    id: 'example',
  },
};
const instrumentedCode = babel.transformSync(
  originalCode, { plugins: [[bluntInstrumentPlugin, opts]]});

const tracer = new Tracer();
const trace = new ArrayTrace();
trace.attach(tracer);
const fn = new Function('tracer', instrumentedCode);
fn(tracer);

// trace.trevs now contains a log of your code's execution
// trace.asts.example contains the code's abstract syntax tree, so you can correlate
//   trevs to the code that caused them
```

## Trace format

```javascript
[
  // Everything recorded by the tracer during execution of the code.
  // Each element is a trace event aka "trev" object.
  {
    id: 1,
    type: 'expr', // these trevs record the result of evaluating some expression
    nodeId: 'src-5', // the corresponding node in `ast` will contain a field `biId` that matches this;
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
]
```

If you are retrieving trevs from an `ArrayTrace`, the `data` field will have been cloned & encoded using a format called object-graph-as-json; see the [blunt-instrument-trace-utils README][blunt-instrument-trace-utils].

[blunt-instrument-eval]: ../blunt-instrument-eval/README.md
[blunt-instrument-runtime]: ../blunt-instrument-runtime/README.md
[blunt-instrument-trace-utils]: ../blunt-instrument-trace-utils/README.md
