import * as types from '@babel/types';

/**
 * A trace event. Currently supported types:
 *
 * - expr: the result of evaluating an expression. The data is the result of the expression.
 * - fn-start: recorded at the beginning of a function. The data is an object containing
 *     all the named parameters of the function, plus "this" and "arguments".
 * - fn-ret: recorded when returning from a function. The data is the return value.
 *
 * @typedef {Object} Trev
 * @property {number} [parentId] - id of the trev enclosing this one
 * @property {number} id
 * @property {("expr"|"fn-start"|"fn-ret")} type - what sort of trace event this represents
 * @property {string} nodeId - indicates the AST node the event is associated with
 * @property {*} [data] - data associated; the meaning varies by trev type
 */

/**
  * @typedef {Trev} TrevExtended
  * @property {Object} denormalized
  * @property {Node} denormalized.node - the babel AST node for the part of the original code
  *   that led to this trev
  * @property {number[]} denormalized.ancestorIds - the trev IDs of this trev's
  *   parent and its parent, etc.
  */

/**
 * Converts a query specifying a whitelist or blacklist into a standard format.
 * Output format is an object where the keys represent the values to be whitelisted
 * or blacklisted, and the value is "true" if the key should be included in the whitelist
 * or blacklist. If the value is "false", the key should be ignored.
 *
 * The input can already be in the output format, or can be an array or primitive.
 *
 * Examples:
 * 'a' -> {'a': true}
 * ['a', 'b'] -> {'a': true, 'b': true}
 * {'a': true, 'b': false} -> {'a': true, 'b': false}
 * @param {*} filter
 * @returns {Object} the converted filter
 */
function toFilterObject(filter) {
  if (filter === null || filter === undefined) {
    return {};
  }

  if (Array.isArray(filter)) {
    const result = {};
    filter.forEach((item) => {
      result[item] = true;
    });
    return result;
  }

  if (typeof filter === 'object') {
    return filter;
  }

  return { [filter]: true };
}

/**
 * Assists in querying for trace events ("trevs") in a trace produced by blunt-instrument.
 */
export class TraceQuerier { // eslint-disable-line import/prefer-default-export
  /**
   * @param {ASTBundle} astb - an ASTBundle for the AST(s) of the original uninstrumented code
   * @param {Trev[]} trace - the trace produced by blunt-instrument
   */
  constructor(astb, trace) {
    this.astb = astb;

    const trevs = [];
    for (let i = 0; i < trace.length; i += 1) {
      if (trace[i].id !== i + 1) {
        throw new Error(`Non-sequential trev id [${trace[i].id}]`);
      }

      const { parentId } = trace[i];
      if (parentId && parentId >= trace[i].id) {
        throw new Error(`Trev ${trace[i].id} is descended from a later parent ${parentId}`);
      }
      const ancestorIds = parentId ? [parentId].concat(trevs[parentId - 1].ancestorIds) : [];

      const node = astb.getNode(trace[i].astId, trace[i].nodeId);
      if (!node) {
        throw new Error(`Trev ID [${trace[i].id}] has unknown node id [${trace[i].nodeId}] for AST id [${trace[i].astId}]`);
      }

      const denormalized = { ancestorIds, node };

      trevs.push({ denormalized, ...trace[i] });
    }
    this.trevs = trevs;
  }

  /**
   * Look up a trev (trace event) by its ID.
   * @param {number} id
   * @return {TrevExtended} the trev
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
   * @returns {TrevExtended[]} matching trace events in the order they were recorded
   */
  query({
    filters: {
      onlyNodeIds = {},
      excludeNodeTypes = {},
    } = {},
  } = {}) {
    const results = [];
    onlyNodeIds = toFilterObject(onlyNodeIds); // eslint-disable-line no-param-reassign
    excludeNodeTypes = toFilterObject(excludeNodeTypes); // eslint-disable-line no-param-reassign

    const onlySpecificNodes = onlyNodeIds
      && Object.values(onlyNodeIds).some(Boolean);

    this.trevs.forEach((trev) => {
      let skip = false;
      Object.keys(excludeNodeTypes).forEach((type) => {
        if (excludeNodeTypes[type] && types.is(type, trev.denormalized.node)) {
          skip = true;
        }
      });

      if (!skip && onlySpecificNodes && !onlyNodeIds[trev.nodeId]) {
        skip = true;
      }

      if (!skip) {
        results.push(trev);
      }
    });

    return results;
  }
}
