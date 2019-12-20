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

const buildStoreAst = template(`
  const %%astId%% = JSON.parse(%%astString%%);
`);

// TODO: clone mutable objects
const buildAddTraceFn = template(`
  function %%traceFnId%%(nodeId, value) {
    %%eventsId%%.push({ nodeId: nodeId, value: value });
  }
`);

function addInstrumenterInit(path) {
  const state = {
    astId: path.scope.generateUidIdentifier('bi_ast'),
    eventsId: path.scope.generateUidIdentifier('bi_events'),
    traceFnId: path.scope.generateUidIdentifier('bi_trace')
  };

  const storeAst = buildStoreAst({
    astId: state.astId,
    astString: types.stringLiteral(JSON.stringify(path.node)) // TODO insert object directly instead of via json
  });

  const addTraceFn = buildAddTraceFn({ eventsId: state.eventsId, traceFnId: state.traceFnId });

  path.scope.push({ id: state.eventsId, init: types.arrayExpression() });

  path.node.body.unshift(storeAst, addTraceFn);

  return state;
}

const buildExports = template(`
  export const biAST = %%astId%%;
  export const biEvents = %%eventsId%%;
`);

function addInstrumenterExports(path, { astId, eventsId }) {
  const exports = buildExports({ astId, eventsId });
  path.node.body.push(...exports);
}

const buildExpressionTrace = template(`
  (() => {
    const %%tempId%% = %%expression%%;
    %%traceFnId%%(%%nodeId%%, %%tempId%%);
    return %%tempId%%;
  })()
`);

function addExpressionTrace(path, { traceFnId }) {
  const node = path.node;
  const { nodeId, ...rest } = node;
  const id = path.scope.generateUidIdentifier('node' + nodeId);
  const trace = buildExpressionTrace({
    traceFnId,
    nodeId: types.numericLiteral(nodeId),
    expression: rest,
    tempId: id
  });
  path.replaceWith(trace);
}

const instrumentVisitor = {
  Expression: {
    exit(path) {
      if (!(path.node.nodeId && path.isExpression())) return;
      addExpressionTrace(path, this.state);
    }
  }
};

const rootVisitor = {
  Program(path) {
    annotateWithNodeIds(path);
    const state = addInstrumenterInit(path);
    path.traverse(instrumentVisitor, { state });
    addInstrumenterExports(path, state);
  }
};

export function bluntInstrumentPlugin(babel) {
  return {
    visitor: rootVisitor
  }
}
