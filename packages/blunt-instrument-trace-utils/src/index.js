import * as types from '@babel/types';

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
    this.trace = trace;
  }

  /**
   * Returns all trevs (trace events) matching the given criteria.
   * 
   * The returned trevs have the following structure:
   * id: number - unique identifier for the trev
   * node: Node - babel AST node corresponding to the code being executed/evaluated
   * type: string - the type of trev, currently only "expr"
   * value: * - for expr trevs, the result of the expression evaluation, as recorded by the configured transcriber
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

    const onlySpecificNodes = onlyNodeIds &&
      Object.values(onlyNodeIds).some(Boolean);

    eachTrev:
    for (const trev of this.trace) {
      const node = this.astQuerier.getNodeById(trev.nodeId);
      if (!node) {
        throw new Error('Cannot find node for ID: ' + trev.nodeId);
      }

      for (const type of Object.keys(excludeNodeTypes)) {
        if (excludeNodeTypes[type] && types.is(type, node)) {
          continue eachTrev;
        }
      }

      if (onlySpecificNodes) {
        if (!onlyNodeIds[trev.nodeId]) {
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
