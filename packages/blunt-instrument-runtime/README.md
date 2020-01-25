# blunt-instrument-runtime

Code instrumented by [blunt-instrument-babel-plugin][blunt-instrument-babel-plugin] uses this library to record tracing data.

## Trace class

The main export of this package is the `Trace` class, which represents an appendable log of a program's execution.

Its main method is `tracerFor(astKey)`, which returns a tracer instance.
A program may consist of multiple files which the babel plugin has processed separately.
In that case, they should all share a `Trace` instance, but use different tracer instances.
`astKey` is a string uniquely identifying the abstract syntax tree whose execution will be traced.

After running an instrumented program, the `trevs` property of the Trace instance will contain all the trace events recorded during execution.
See [blunt-instrument-babel-plugin's README][blunt-instrument-babel-plugin] for an example of what this array looks like.

## Data Encoding

One difficulty in producing a full trace of a program is that every value (every number and string, every state of every array and object) needs to be copied or serialized in some way.
Currently, the `data` field in every trev is produced using [object-graph-as-json][object-graph-as-json], which attempts to preserve as much information about the objects being copied as it can.

`blunt-instrument-runtime` an instance of object-graph-as-json's `Encoder` class as `defaultEncoder`.
That is the instance used by `defaultTrace` and will also be used by any `Trace` you create unless you pass `{ encoder: someEncoderInstance }` to the constructor.

[blunt-instrument-babel-plugin]: ../blunt-instrument-babel-plugin/README.md
[object-graph-as-json]: https://github.com/brokensandals/object-graph-as-json
