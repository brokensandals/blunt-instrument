import template from '@babel/template';
import * as types from '@babel/types';

function annotateWithNodeIds(path) {
  let nextId = 1;
  types.traverseFast(path.node, (node) => {
    const nodeId = nextId;
    nextId += 1;
    node.nodeId = nodeId;
  });
}

const buildDeclarations = template(`
  const %%eventsId%% = [];
  const %%astId%% = JSON.parse(%%astString%%);
`);

const buildExports = template(`
  export const %%eventsId%% = [];
  export const %%astId%% = JSON.parse(%%astString%%);
`);

// TODO: clone mutable objects
const buildTraceExprFn = template(`
  function %%traceExprFnId%%(nodeId, value) {
    %%eventsId%%.push({
      id: %%eventsId%%.length,
      nodeId,
      type: 'expr',
      value, });
    return value;
  }
`);

function addInstrumenterInit(path) {
  // TODO: make IDs configurable
  const state = {
    astId: types.identifier('biAST'),
    eventsId: types.identifier('biEvents'),
    traceExprFnId: path.scope.generateUidIdentifier('biTraceExpr')
  };

  const constsArgs = {
    astId: state.astId,
    eventsId: state.eventsId,
    astString: types.stringLiteral(JSON.stringify(path.node)) // TODO insert object directly instead of via json
  };
  const consts = path.node.sourceType === 'module' ?
    buildExports(constsArgs) : buildDeclarations(constsArgs);

  const traceExprFn = buildTraceExprFn({ eventsId: state.eventsId, traceExprFnId: state.traceExprFnId });

  path.node.body.unshift(...consts, traceExprFn);

  return state;
}

const buildExpressionTrace = template(`
  %%traceExprFnId%%(%%nodeId%%, %%expression%%)
`);

function addExpressionTrace(path, { traceExprFnId }) {
  const node = path.node;
  const trace = buildExpressionTrace({
    traceExprFnId,
    nodeId: types.numericLiteral(node.nodeId),
    expression: node,
  });
  node.traced = true;
  path.replaceWith(trace);
}

const buildPostfixRewrite = template(`
  (() => {
    const %%tempId%% = %%lval%%;
    %%assignment%%;
    return %%tempId%%;
  })()
`);

const instrumentVisitor = {
  UpdateExpression(path) {
    // TODO this is super hacky
    // Without this code, we'd be rewriting things like x++ into
    // biTraceExpr(...)++, which is an error.
    const op = path.node.operator[0] + '=';
    if (path.node.prefix) {
      // Change ++x to x += 1
      const replacement = types.assignmentExpression(
        op, path.node.argument, types.numericLiteral(1));
      replacement.nodeId = path.node.nodeId;
      path.replaceWith(replacement);
    } else {
      // Change x++ to (() => { const _postfix = x; x += 1; return _postfix})
      // TODO I feel like this code should lead to double-tracing of the lval.
      // I don't know if I'm too tired to understand why it doesn't, or too tired
      // to see that it really does
      const lval = path.node.argument;
      const tempId = path.scope.generateUidIdentifier('postfix');
      const assignment = types.assignmentExpression(
        op, lval, types.numericLiteral(1));
      assignment.nodeId = path.node.nodeId;
      const replacement = buildPostfixRewrite({ tempId, assignment, lval })
      path.replaceWith(replacement);
    }
  },

  Expression: {
    exit(path) {
      if (!(path.node.nodeId && !path.node.traced && path.isReferenced())) return;
      addExpressionTrace(path, this.state);
    }
  }
};

const rootVisitor = {
  Program(path) {
    annotateWithNodeIds(path);
    const state = addInstrumenterInit(path);
    path.traverse(instrumentVisitor, { state });
  }
};

export function bluntInstrumentPlugin(babel) {
  return {
    visitor: rootVisitor
  }
}
