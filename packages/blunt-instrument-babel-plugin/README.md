# blunt-instrument-babel-plugin

A babel plugin that automatically adds tracing to the input code (as much as possible).
When the output code is executed, it will produce a log of all the expressions that were evaluated during the course of execution, and their values at each point.

## Usage from code

**Note**: you probably want to use [blunt-instrument-eval][blunt-instrument-eval/README.md] instead of using this directly.

### Creating instrumented code

```javascript
import * as babel from '@babel/core';
import { bluntInstrumentPlugin } from 'blunt-instrument-babel-plugin';

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
  valueTranscriber: 'simple',
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

### Transcribers

One difficulty in producing a full trace of a program is that every value (every number and string, every state of every array and object) needs to be copied or serialized in some way.
Different copying mechanisms will have different limitations and performance costs.

You can choose which mechanism to use by setting the `valueTranscriber` option.
The currently supported options are `none` and `simple`.

#### none

This option causes all values to be put directly into the trace without any attempt to clone or serialize them.
This will work fine for programs that only deal with immutable data types or never mutate data.

For example, for this program:

```javascript
const array = [];
array.push(1);
array.push(2);
array.push(3);
```

The tracer will record separate trevs for when `array` is evaluated on lines 2, 3, and 4.
But when run with `{valueTranscriber: 'none'}`, all of those trevs will have the same `data`, which will be `[1, 2, 3]` at the end of program execution.
By contrast, the `simple` transcriber would copy the array at each point, resulting in three separate values: `[]`, `[1]`, and `[1, 2]`.

#### simple

This option handles values as follows:

- Objects and arrays (anything where `typeof value === 'object'`) are converted to JSON and back again before inserting into the trace.
- All other values are inserted directly into the trace without any attempt to clone or serialize them.

This ensures that if an object or array is mutated after the tracer records it, the mutation does not alter the recorded value.
However, there are limitations:

- Mutations on values of other mutable types, such as functions, can still alter the trace.
- Cyclic references in objects or arrays will cause the tracer to throw an exception.
- Values within objects and arrays are subject to the limitations of `JSON.stringify`; for example, `BigInt` values nested within objects/arrays will cause the tracer to throw an exception, and functions nested within objects/arrays will be omitted.

[blunt-instrument-eval]: ../blunt-instrument-eval/README.md
