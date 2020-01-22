# blunt-instrument-runtime



```javascript
[
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
]
```

### Data Encoding

One difficulty in producing a full trace of a program is that every value (every number and string, every state of every array and object) needs to be copied or serialized in some way.
Currently, the `data` field in every trev is produced using [object-graph-as-json][object-graph-as-json], which attempts to preserve as much information about the objects being copied as it can.

[object-graph-as-json]: https://github.com/brokensandals/object-graph-as-json
