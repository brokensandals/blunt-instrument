/**
 * Instrumented code uses an instance of Tracer to report everything that happens.
 * This supports registering two callbacks:
 * - onRegisterAST(astId, ast): if the babel plugin is configured to, the instrumented code will
 *     call this with its AST so that you can look up the babel nodes referenced in each trev.
 * - onTrev(trev): called when a trace event occurs. Note that the 'data' field will be the raw
 *     data, not cloned or encoded in any way.
 *
 * You may override the generateId() method if desired. Other methods are for internal use.
 */
export default class Tracer {
  constructor({
    onRegisterAST = () => {},
    onTrev = () => {},
  } = {}) {
    this.nextId = 1;
    this.onRegisterAST = onRegisterAST;
    this.onTrev = onTrev;
    this.stack = [];
  }

  /**
   * @returns {number} an ID for a new trev
   */
  generateId() {
    return this.nextId++; // eslint-disable-line no-plusplus
  }

  pushContext(id) {
    this.stack.push(id);
  }

  popContext() {
    this.stack.pop();
  }

  trace(type, astId, nodeId, data, more = {}) {
    const id = this.generateId();
    const parentId = this.stack[this.stack.length - 1];
    this.onTrev({
      parentId,
      id,
      type,
      astId,
      nodeId,
      data,
      ...more,
    });
    return id;
  }

  traceExpr(astId, nodeId, value) {
    this.trace('expr', astId, nodeId, value);
    return value;
  }

  traceFnStart(astId, nodeId, callData) {
    const id = this.trace('fn-start', astId, nodeId, callData);
    this.pushContext(id);
    return id;
  }

  traceFnRet(astId, nodeId, value) {
    this.trace('fn-ret', astId, nodeId, value);
    this.popContext();
    return value;
  }

  traceFnThrow(astId, nodeId, error) {
    this.trace('fn-throw', astId, nodeId, error);
    this.popContext();
    return error;
  }

  traceFnPause(astId, nodeId, argument) {
    this.trace('fn-pause', astId, nodeId, argument);
    this.popContext();
    return argument;
  }

  traceFnResume(astId, nodeId, value, fnStartId) {
    const id = this.trace('fn-resume', astId, nodeId, value, { fnStartId });
    this.pushContext(id);
    return value;
  }
}
