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
const buildAddTraceFn = template(`
  function %%traceFnId%%(nodeId, value) {
    %%eventsId%%.push({ nodeId: nodeId, value: value });
  }
`);

function addInstrumenterInit(path) {
  // TODO: make IDs configurable
  const state = {
    astId: types.identifier('biAST'),
    eventsId: types.identifier('biEvents'),
    traceFnId: path.scope.generateUidIdentifier('bi_trace')
  };

  const constsArgs = {
    astId: state.astId,
    eventsId: state.eventsId,
    astString: types.stringLiteral(JSON.stringify(path.node)) // TODO insert object directly instead of via json
  };
  const consts = path.node.sourceType === 'module' ?
    buildExports(constsArgs) : buildDeclarations(constsArgs);

  const addTraceFn = buildAddTraceFn({ eventsId: state.eventsId, traceFnId: state.traceFnId });

  path.node.body.unshift(...consts, addTraceFn);

  return state;
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
  }
};

export function bluntInstrumentPlugin(babel) {
  return {
    visitor: rootVisitor
  }
}
