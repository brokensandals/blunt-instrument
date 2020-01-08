# blunt-instrument-trace-utils

When code instrumented by blunt-instrument is executed, it produces a trace.
The trace is a sequence of trace events, which blunt-instrument refers to as "trevs".
This package assists in working with traces and trevs.

See the JSDoc in [src/index.js](src/index.js) for detailed usage info.

## TraceQuerier

The TraceQuerier lets you query for trevs by various criteria.

You must already have an ASTQuerier instance before creating a TraceQuerier; see [blunt-instrument-ast-utils][ast-utils].

A trace can be acquired by using [blunt-instrument-eval][eval], which will also create a TraceQuerier for you.
Alternatively, you can use [blunt-instrument-babel-plugin][babel-plugin] directly, and retrieve the trace from the instrumentation object using one of the mechanisms documented in its README.

```javascript
const traceQuerier = new TraceQuerier(astQuerier, trace);

// Retrieve all trevs - i.e., all the values recorded by the tracer.
traceQuerier.query();

// Retrieve all trevs except literals; i.e., for a trace of the code 'x = y + 3',
// omit all the entries reporting that 3 evaluated to 3.
traceQuerier.query({ filters: { excludeNodeTypes: { Literal: true } } });

// Retrieve all trevs for the AST nodes with IDs "src-1" and "src-2".
traceQuerier.query({ filters: { onlyNodeIds: { 'src-1': true, 'src-2': true } } });
```

[ast-utils]: ../blunt-instrument-ast-utils/README.md
[eval]: ../blunt-instrument-eval/README.md
[babel-plugin]: ../blunt-instrument-babel-plugin/README.md
