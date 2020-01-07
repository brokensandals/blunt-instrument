import * as types from '@babel/types';

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

    const onlySpecificNodes = filters.onlyNodeIds &&
      Object.values(filters.onlyNodeIds).some(Boolean);

    eachEvent:
    for (const event of this.events) {
      const node = this.astq.nodesById.get(event.nodeId);
      if (!node) {
        throw new Error('Cannot find node for ID: ' + event.nodeId);
      }

      if (filters.excludeNodeTypes) {
        for (const type of Object.keys(filters.excludeNodeTypes)) {
          if (filters.excludeNodeTypes[type] && types.is(type, node)) {
            continue eachEvent;
          }
        }
      }
      if (onlySpecificNodes) {
        if (!filters.onlyNodeIds[event.nodeId]) {
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
