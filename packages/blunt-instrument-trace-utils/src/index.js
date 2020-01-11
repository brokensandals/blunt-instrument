import * as types from '@babel/types';

function toFilterObject(filter) {
  if (filter === null || filter === undefined) {
    return {};
  } else if (Array.isArray(filter)) {
    const result = {};
    for (const item of filter) {
      result[item] = true;
    }
    return result;
  } else if (typeof filter === 'object') {
    return filter;
  } else {
    return {[filter]: true};
  }
}

/**
 * Assists in querying for trace events ("trevs") in a trace produced by blunt-instrument.
 */
export class TraceQuerier {
  /**
   * @param {ASTQuerier} astQuerier - an ASTQuerier for the AST of the original code that blunt-instrument instrumented
   * @param {[object]} trace - the trace produced by blunt-instrument
   */
  constructor(astQuerier, trace) {
    this.astQuerier = astQuerier;

    const trevs = [];
    for (let i = 0; i < trace.length; i++) {
      if (trace[i].id !== i + 1) {
        throw new Error(`Non-sequential trev ID ${trace[i].id}`);
      }
      
      const node = astQuerier.getNodeById(trace[i].nodeId);
      if (!node) {
        throw new Error(`Trev ID ${trace[i].id} has unknown node ID ${trace[i].nodeId}`);
      }

      trevs.push({ node, ...trace[i] });
    }
    this.trevs = trevs;
  }

  /**
   * Look up a trev (trace event) by its ID.
   * @param {number} id
   * @return {object} the trev
   */
  getTrevById(id) {
    if (id < 1 || id > this.trevs.length) {
      return undefined;
    }

    return this.trevs[id - 1];
  }

  /**
   * Returns all trevs (trace events) matching the given criteria.
   * 
   * The returned trevs have the following structure:
   * id: number - unique identifier for the trev
   * node: Node - babel AST node corresponding to the code being executed/evaluated
   * type: string - the type of trev, currently only "expr"
   * data: * - for expr trevs, the result of the expression evaluation, as recorded by the configured transcriber
   * 
   * All filters of type `object` support three different syntaxes. The following are equivalent:
   * { filters: { onlyNodeIds: { node1: true, node2: true } } }
   * { filters: { onlyNodeIds: ['node1', 'node2' ] } }
   * If you only need to supply one value for the filter, this works too:
   * { filters: { onlyNodeIds: 'node1' }}
   * 
   * When using the first syntax, any properties where the value is `false` are disregarded.
   * 
   * @param {object} criteria
   * @param {object} criteria.filters
   * @param {object} criteria.filters.onlyNodeIds -
   *   keys are node IDs and values are booleans. If there is at least one
   *   truthy value, only trevs whose node IDs match one of the keys with truthy values
   *   will be included in the results.
   * @param {object} criteria.filters.excludeNodeTypes -
   *   keys are babel node types and values are booleans. Any trevs whose node type matches
   *   one of the keys with truthy values will be excluded from the results.
   * @returns {[object]} matching trace events in the order they were recorded
   */
  query(
    {
      filters: {
        onlyNodeIds = {},
        excludeNodeTypes = {}
      } = {}
    } = {}) {
    const results = [];
    onlyNodeIds = toFilterObject(onlyNodeIds);
    excludeNodeTypes = toFilterObject(excludeNodeTypes);

    const onlySpecificNodes = onlyNodeIds &&
      Object.values(onlyNodeIds).some(Boolean);

    eachTrev:
    for (const trev of this.trevs) {
      for (const type of Object.keys(excludeNodeTypes)) {
        if (excludeNodeTypes[type] && types.is(type, trev.node)) {
          continue eachTrev;
        }
      }

      if (onlySpecificNodes) {
        if (!onlyNodeIds[trev.nodeId]) {
          continue eachTrev;
        }
      }

      results.push(trev);
    }

    return results;
  }
}
