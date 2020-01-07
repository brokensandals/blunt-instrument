import * as types from '@babel/types';

/**
 * Assists in querying a trace produced by blunt-instrument.
 */
export class TraceQuerier {
  /**
   * 
   * @param {ASTQuerier} astq - an ASTQuerier for the AST of the original code that blunt-instrument instrumented
   * @param {[object]} trace - the trace produced by blunt-instrument
   */
  constructor(astq, trace) {
    this.astq = astq;
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
