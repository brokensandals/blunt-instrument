# blunt-instrument-runtime

Code instrumented by [blunt-instrument-babel-plugin][blunt-instrument-babel-plugin] uses this library to report tracing data.

## Tracer class

The main export of this package is the `Tracer` class.
Instrumented code must be given an instance of that class; you can either create an instance via `new Tracer()` or rely on the `defaultTracer` instance exported by the package.
If you're using [blunt-instrument-eval][blunt-instrument-eval], it will create an instance for you; if you're using the [babel plugin][blunt-instrument-babel-plugin] directly, you can configure it as documented there.

The `Tracer` supports two callbacks, described below.
These can be used for recording the data of a trace - see `ArrayTrace` in [blunt-instrument-trace-utils][blunt-instrument-trace-utils] for a basic implementation.

### onTrev

This will be called every time the instrumented code reports that a tracing event ("trev") occurred.
These events include the evaluation of an expression, that start of a function call, returning from a function call, etc.

```js
tracer.onTrev = (trev) => console.log(trev);
```

See [blunt-instrument-babel-plugin's README][blunt-instrument-babel-plugin] for an example of what trevs look like.
Unlike what's shown there, though, the `data` field on this trev object has not been cloned or encoded in any way, so it might be modified as soon as control returns to the instrumented code.
(The `ArrayTracer` class replaces the `data` field with an encoded copy.)

### onRegisterAST

This will be called when the instrumented code is initializing, unless that functionality has been disabled in the babel plugin opts.
The arguments are the AST ID (important if you have instrumented multiple files that are all reporting to the same Tracer) and the root babel Node of the AST.

```js
tracer.onRegisterAST = (astId, ast) => console.log(ast);
```

[blunt-instrument-babel-plugin]: ../blunt-instrument-babel-plugin/README.md
[blunt-instrument-eval]: ../blunt-instrument-eval/README.md
[blunt-instrument-trace-utils]: ../blunt-instrument-trace-utils/README.md
