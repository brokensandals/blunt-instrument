import * as types from '@babel/types';

export class ASTQuerier {
  constructor(ast, code) {
    this.ast = ast;
    this.code = code;

    const nodesById = new Map();
    types.traverseFast(ast, (node) => {
      if (!node.type) {
        return;
      }
      if (!node.nodeId) {
        throw new Error('Node is missing nodeId: ' + node);
      }

      // TODO avoid destructive modification
      if (!node.extra) {
        node.extra = {};
      }
      if (node.start && node.end) {
        node.extra.code = code.slice(node.start, node.end);
      }

      nodesById.set(node.nodeId, node);
    });

    this.nodesById = nodesById;
  }
}

export class TraceQuerier {
  constructor(astQueriers, events) {
    if (!(astQueriers && astQueriers.input)) {
      throw new Error('missing ASTQuerier for "input" to represent original code');
    }
    this.astq = astQueriers.input;
    this.astQueriers = astQueriers;
    this.events = events;
  }

  query({ filters = {} } = {}) {
    const results = [];

    eachEvent:
    for (const event of this.events) {
      const node = this.astq.nodesById.get(event.nodeId);
      if (!node) {
        throw new Error('Cannot find node for ID: ' + event.nodeId);
      }

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

      results.push({
        id: event.id,
        node: node,
        type: event.type,
        value: event.value,
      });
    }

    return results;
  }
}
