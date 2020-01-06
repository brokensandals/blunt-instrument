import template from '@babel/template';
import * as types from '@babel/types';

// TODO move serializer functions into separate files
// and unit test them
const serializerTemplates = {};
serializerTemplates.identity = template(`
  %%instrumentationId%%.serializeValue = (value) => {
    return value;
  };
`);

serializerTemplates.simple = template(`
  %%instrumentationId%%.serializeValue = (value) => {
    switch (typeof value) {
      case 'object':
        return JSON.parse(JSON.stringify(value));
      default:
        return value;
    }
  };
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

function setNodeId(node, id) {
  if (!node.extra) {
    node.extra = {};
  }

  node.extra.biNodeId = id;
}

const buildInstrumentationInit = template(`
  const %%instrumentationId%% = {
    ast: JSON.parse(%%astString%%),
    events: []
  };
`);

const buildTraceExprFnInit = template(`
  %%instrumentationId%%.traceExpr = (nodeId, value) => {
    %%instrumentationId%%.events.push({
      id: %%instrumentationId%%.events.length,
      nodeId,
      type: 'expr',
      value: %%instrumentationId%%.serializeValue(value),
    });
    return value;
  };
`);

const buildAssignOutput = template(`
  %%assignTo%% = %%instrumentationId%%;
`);

const buildExportOutput = template(`
  export const %%exportAs%% = %%instrumentationId%%;
`);

const buildReturnOutput = template(`
  return %%instrumentationId%%;
`);

function addInstrumenterInit(path,
    {
      outputs: {
        assignTo = null,
        exportAs = null,
      } = {},
      valueSerializer = 'simple'
    }) {
  
  const ids = {
    instrumentationId: path.scope.generateUidIdentifier('instrumentation'),
  };

  const instrumentationInit = buildInstrumentationInit({
    astString: types.stringLiteral(JSON.stringify(path.node)), // TODO insert object directly instead of via json
    ...ids })
  const traceExprFnInit = buildTraceExprFnInit(ids);
  const serializeValueFnInit = serializerTemplates[valueSerializer](ids);

  const outputDecls = [];
  if (assignTo) {
    outputDecls.push(buildAssignOutput({ assignTo, ...ids }));
  }
  if (exportAs) {
    outputDecls.push(buildExportOutput({ exportAs, ...ids }));
  }

  path.node.body.unshift(
    instrumentationInit,
    traceExprFnInit,
    serializeValueFnInit,
    ...outputDecls,
  );

  return ids;
}

// FIXME presumably this sort of replacement leads to incorrect
// bindings of 'this' when calling functions on objects.
const buildExpressionTrace = template(`
  %%instrumentationId%%.traceExpr(%%nodeId%%, %%expression%%)
`);

function addExpressionTrace(path, { instrumentationId }) {
  const node = path.node;
  const trace = buildExpressionTrace({
    instrumentationId,
    nodeId: types.stringLiteral(node.extra.biNodeId),
    expression: node,
  });
  node.extra.biTraced = true;
  path.replaceWith(trace);
}

const buildPostfixRewrite = template(`
  (() => {
    const %%tempId%% = %%lval%%;
    %%lval%% += 1;
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
      // Change x++ to (() => { const _postfix = x; x += 1; return _postfix})()
      const lval = path.node.argument;
      const tempId = path.scope.generateUidIdentifier('postfix');
      const replacement = buildPostfixRewrite({ tempId, lval });
      const nodeId = path.node.extra.biNodeId;
      path.replaceWith(replacement);
      // replaceWith appears to drop the 'extra' property, so we must set biNodeId
      // afterward, not before
      setNodeId(path.node, nodeId);
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
