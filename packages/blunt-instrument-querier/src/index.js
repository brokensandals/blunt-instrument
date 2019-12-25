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

const DEFAULT_INCLUDE = {
  eventId: true,
  nodeId: true,
  source: true,
  value: true
};

export class TraceQuerier {
  constructor(ast, events, source = null) {
    if (ast instanceof ASTQuerier) {
      this.astq = ast;
    } else {
      this.astq = new ASTQuerier(ast);
    }
    this.events = events;
    this.source = source;
  }
  query({ include } = { include: DEFAULT_INCLUDE }) {
    const results = [];

    for (const event of this.events) {
      const result = {};
      if (include.eventId) {
        result.eventId = event.eventId;
      }
      if (include.nodeId) {
        result.nodeId = event.nodeId;
      }
      if (include.source && this.source) {
        const node = this.astq.nodesById.get(event.nodeId);
        if (node) {
          result.source = this.source.slice(node.start, node.end);
        }
      }
      if (include.value) {
        result.value = event.value;
      }

      results.push(result);
    }

    return results;
  }
}
