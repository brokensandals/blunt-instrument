import template from '@babel/template';
import * as types from '@babel/types';

const idVisitor = {
  "Expression|Statement"(path) {
    path.node.nodeId = this.nextId;
    this.nextId += 1;
  }
};

function annotateWithNodeIds(path) {
  path.traverse(idVisitor, { nextId: 1 });
}

const buildStoreAst = template(`
  const %%astId%% = JSON.parse(%%astString%%);
`);

const buildAddTraceFn = template(`
  function %%traceFnId%%(nodeId, value) {
    console.log('[' + nodeId + '] ' + value);
  }
`);

function addInstrumenterInit(path) {
  const state = {
    astId: path.scope.generateUidIdentifier('bi_ast'),
    traceFnId: path.scope.generateUidIdentifier('bi_trace')
  };

  const storeAst = buildStoreAst({
    astId: state.astId,
    astString: types.stringLiteral(JSON.stringify(path.node)) // TODO insert object directly instead of via json
  });

  const addTraceFn = buildAddTraceFn({ traceFnId: state.traceFnId });

  path.node.body.unshift(storeAst, addTraceFn);

  return state;
}

function findOrCreateEnclosingBlock(path) {
  
}

function addExpressionTrace(path, { traceFnId }) {
  
}

const instrumentVisitor = {
  Identifier: {
    exit(path) {
      if (!path.node.nodeId) return;

      const id = path.scope.generateUidIdentifier('node' + path.node.nodeId);
      
      path.replaceWith(id);
    }
  }
};

const rootVisitor = {
  Program(path) {
    annotateWithNodeIds(path);
    const state = addInstrumenterInit(path);
    path.traverse(instrumentVisitor, state);
  }
};

export function bluntInstrumentPlugin(babel) {
  return {
    visitor: rootVisitor
  }
}
