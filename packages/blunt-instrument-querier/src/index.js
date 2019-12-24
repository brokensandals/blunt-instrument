import * as types from '@babel/types';

export class ASTQuerier {
  constructor(ast) {
    this.ast = ast;
    const nodesById = new Map();
    types.traverseFast(ast, (node) => {
      if (!node.type) {
        return;
      }
      if (!node.nodeId) {
        throw new Error('Node is missing nodeId: ' + node);
      }
      nodesById.set(node.nodeId, node);
    });
    this.nodesById = nodesById;
  }
}

export class TraceQuerier {
  constructor(ast, events) {
    if (ast instanceof ASTQuerier) {
      this.astq = ast;
    } else {
      this.astq = new ASTQuerier(ast);
    }
    this.events = events;
  }
}
