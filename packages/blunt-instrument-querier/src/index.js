import * as types from '@babel/types';

export class TraceQuerier {
  constructor(astQueriers, trace) {
    if (!(astQueriers && astQueriers.input)) {
      throw new Error('missing ASTQuerier for "input" to represent original code');
    }
    this.astq = astQueriers.input;
    this.astQueriers = astQueriers;
    this.trace = trace;
  }

  query({ filters = {} } = {}) {
    const results = [];

    const onlySpecificNodes = filters.onlyNodeIds &&
      Object.values(filters.onlyNodeIds).some(Boolean);

    eachTrev:
    for (const trev of this.trace) {
      const node = this.astq.getNodeById(trev.nodeId);
      if (!node) {
        throw new Error('Cannot find node for ID: ' + trev.nodeId);
      }

      if (filters.excludeNodeTypes) {
        for (const type of Object.keys(filters.excludeNodeTypes)) {
          if (filters.excludeNodeTypes[type] && types.is(type, node)) {
            continue eachTrev;
          }
        }
      }
      if (onlySpecificNodes) {
        if (!filters.onlyNodeIds[trev.nodeId]) {
          continue eachTrev;
        }
      }

      results.push({
        id: trev.id,
        node: node,
        type: trev.type,
        value: trev.value,
      });
    }

    return results;
  }
}
