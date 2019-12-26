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

const DEFAULT_FIELDS = {
  id: true,
  nodeId: true,
  source: true,
  type: true,
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
  query({ filters, fields } = { fields: DEFAULT_FIELDS }) {
    const results = [];

    eachEvent:
    for (const event of this.events) {
      const node = this.astq.nodesById.get(event.nodeId);
      if (!node) {
        throw new Error('Cannot find node for ID: ' + event.nodeId);
      }

      if (filters) {
        if (filters.excludeTypes) {
          for (const type of filters.excludeTypes) {
            if (types.is(type, node)) {
              continue eachEvent;
            }
          }
        }
        if (filters.includeNodeIds) {
          if (!filters.includeNodeIds.includes(event.nodeId)) {
            continue eachEvent;
          }
        }
      }

      const result = {};
      if (fields.id) {
        result.id = event.id;
      }
      if (fields.nodeId) {
        result.nodeId = event.nodeId;
      }
      if (fields.source && this.source) {
        result.source = this.source.slice(node.start, node.end);
      }
      if (fields.type) {
        result.type = event.type;
      }
      if (fields.value) {
        result.value = event.value;
      }

      results.push(result);
    }

    return results;
  }
}
