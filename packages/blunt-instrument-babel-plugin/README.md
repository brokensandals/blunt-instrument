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
  runtime: {
    mechanism: 'import',
    tracerVar: undefined, // For mechanism='var', make this a string
  },
  ast: {
    key: undefined, // If you are going to instrument code from multiple files and generate a
                    // combined trace, give each one a unique key. If not specified, sequential
                    // integers are used.
    selfRegister: true, // Causes the AST of the original code to be embedded in the generated
                        // code. When the code runs, it will store the AST on the tracer's
                        // `ast` field.
  },
};

const instrumentedCode = babel.transformSync(
  originalCode, { plugins: [[bluntInstrumentPlugin, opts]] }
).code;
```

### Injecting the Tracer and retrieving the trace

The instrumented code will record data to an instance of the Trace class from [blunt-instrument-runtime][blunt-instrument-runtime].
After executing the instrumented code, you can retrieve the trace from that instance.

By default, the instrumented code attempts to use a global trace by importing `defaultTrace` from [blunt-instrument-runtime][blunt-instrument-runtime].
It then calls `defaultTrace.tracerFor(opts.ast.key)` to retrieve a tracer scoped to the AST's key.

Alternatively, you can indicate that the tracer instance should be found in a specific variable, by setting `runtime.mechanism` to `'var'` and specifying the variable name in `runtime.tracerVar`:

```javascript
import { Trace } from 'blunt-instrument-runtime';

const opts = {
  runtime: {
    mechanism: 'var',
    tracerVar: 'tracer',
  },
};
const instrumentedCode = babel.transformSync(
  originalCode, { plugins: [[bluntInstrumentPlugin, opts]]});

const trace = new Trace();
const tracer = trace.tracerFor('myCode');
const fn = new Function('tracer', instrumentedCode);
fn(tracer);

// trace.trevs now contains a log of your code's execution
```

[blunt-instrument-eval]: ../blunt-instrument-eval/README.md
[blunt-instrument-runtime]: ../blunt-instrument-runtime/README.md
