import template from '@babel/template';
import * as types from '@babel/types';

// TODO move serializer functions into separate files
// and unit test them
const serializerTemplates = {};
serializerTemplates.identity = template(`
  function %%fnId%%(value) {
    return value;
  }
`);

serializerTemplates.simple = template(`
  function %%fnId%%(value) {
    switch (typeof value) {
      case 'object':
        return JSON.parse(JSON.stringify(value));
      default:
        return value;
    }
  }
`);

function annotateWithNodeIds(path) {
  let nextId = 1;
  types.traverseFast(path.node, (node) => {
    // TODO: I really have no idea whether this sort of thing is
    // what 'extra' is for
    if (!node.extra) {
      node.extra = {};
    }

    const nodeId = '' + nextId;
    nextId += 1;
    node.extra.biNodeId = nodeId;
  });
}

function copyNodeId(from, to) {
  if (!from.extra) {
    return;
  }

  if (!to.extra) {
    to.extra = {};
  }

  to.extra.biNodeId = from.extra.biNodeId;
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
      value: %%serializeValueFnId%%(value), });
    return value;
  }
`);

function addInstrumenterInit(path, { valueSerializer = 'simple' }) {
  // TODO: make IDs configurable
  const state = {
    astId: types.identifier('biAST'),
    eventsId: types.identifier('biEvents'),
    traceExprFnId: path.scope.generateUidIdentifier('biTraceExpr'),
    serializeValueFnId: path.scope.generateUidIdentifier('biSerializeValue'),
  };

  const constsArgs = {
    astId: state.astId,
    eventsId: state.eventsId,
    astString: types.stringLiteral(JSON.stringify(path.node)) // TODO insert object directly instead of via json
  };
  const consts = path.node.sourceType === 'module' ?
    buildExports(constsArgs) : buildDeclarations(constsArgs);

  const serializeValueFn = serializerTemplates[valueSerializer]({ fnId: state.serializeValueFnId });
  const traceExprFn = buildTraceExprFn({
    eventsId: state.eventsId,
    traceExprFnId: state.traceExprFnId,
    serializeValueFnId: state.serializeValueFnId
  });

  path.node.body.unshift(...consts, serializeValueFn, traceExprFn);

  return state;
}

const buildExpressionTrace = template(`
  %%traceExprFnId%%(%%nodeId%%, %%expression%%)
`);

function addExpressionTrace(path, { traceExprFnId }) {
  const node = path.node;
  const trace = buildExpressionTrace({
    traceExprFnId,
    nodeId: types.stringLiteral(node.extra.biNodeId),
    expression: node,
  });
  node.extra.biTraced = true;
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
    // TODO this is super hacky, and also written when the tracing worked
    // differently, so probably can be simplified
    const op = path.node.operator[0] + '=';
    if (path.node.prefix) {
      // Change ++x to x += 1
      const replacement = types.assignmentExpression(
        op, path.node.argument, types.numericLiteral(1));
      copyNodeId(path.node, replacement);
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
      copyNodeId(path.node, assignment);
      const replacement = buildPostfixRewrite({ tempId, assignment, lval })
      path.replaceWith(replacement);
    }
  },

  Expression: {
    exit(path) {
      if (!(path.node.extra && path.node.extra.biNodeId && !path.node.extra.biTraced && path.isReferenced())) return;
      addExpressionTrace(path, this.state);
    }
  }
};

const rootVisitor = {
  Program(path, misc) {
    annotateWithNodeIds(path);
    const state = addInstrumenterInit(path, misc.opts);
    path.traverse(instrumentVisitor, { state });
  }
};

export function bluntInstrumentPlugin(babel) {
  return {
    visitor: rootVisitor
  }
}
