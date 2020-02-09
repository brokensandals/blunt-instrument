# blunt-instrument-eval

This package ties together various parts of blunt-instrument to provide an easy way to take javascript code stored in a string, instrument it, evaluate it, and get the trace in a consumable format.

First, install the package (or see [blunt-instrument-standalone][standalone] if you prefer to load the dependency from a `<script>` tag):

```sh
npm install --save blunt-instrument-eval
```

Then you can use the `instrumentedEval` function to trace code:

```javascript
import instrumentedEval from 'blunt-instrument-eval';

const code = `
  function factorial(n) {
    return n == 1 ? 1 : n * factorial(n - 1);
  }
  factorial(5);`;

const trace = instrumentedEval(code);
// Get a collection of the trace events
const tc = trace.toTC().withDenormalizedInfo();
// Look up all the trace events corresponding to the evaluation of "factorial(n - 1)":
const { trevs } = tc.filter((trev) => trev.denormalized.node.codeSlice === 'factorial(n - 1)');

// This will log the four values that factorial(n - 1) evaluates to during the
// course of execution:
// [1, 2, 6, 24]
console.log(trevs.map(trev => trev.data));
```

The return value of `instrumentedEval` is an [ArrayTrace](../blunt-instrument-core/README.md#arraytrace) instance.

Note: code is evaluated in strict mode.

[standalone]: ../blunt-instrument-standalone/README.md
