/**
 * A trace event.
 * @typedef {Object} Trev
 * @property {number} parentId - the id of the enclosing trev on the call stack
 * @property {number} id - an id for this trev, unique within the program's execution
 * @property {("expr"|"fn-start"|"fn-ret"|"fn-throw"|"fn-pause"|"fn-resume")} type
 * @property {string} astId - identifies the AST to which nodeId belongs
 * @property {number} nodeId - indicates which node of the AST caused this event
 * @property {*} data - varies by type:
 *    - for "expr", the result of the expression
 *    - for "fn-start", and object containing "this", "arguments", and a property
 *      for each named parameter
 *    - for "fn-ret", the return value
 *    - for "fn-throw", the error
 *    - for "fn-pause", the value passed to yield or await
 *    - for "fn-resume", the value returned from yield or await
 *    Note that listeners such as ArrayTrace may replace this field with a cloned or
 *    encoded version of it.
 * @property {(number|undefined)} fnStartId - for fn-resume trevs, the id of the
 *    original fn-start trev
 */

/**
 * @callback Tracer~handleRegisterAST
 * @param {string} astId - identifier to distinguish the AST from other files' ASTs
 * @param {Node} ast - root babel node of the AST
 */

/**
* @callback Tracer~handleTrev
* @param {Trev} trev
*/

/**
 * Instrumented code uses an instance of Tracer to report everything that happens.
 * This class does not save any of the trace information itself; you should use the
 * addListener() method to attach something like an ArrayTrace or ConsoleTraceWriter.
 *
 * You may override the generateId() method if desired. Other methods are for internal use.
 */
export default class Tracer {
  constructor() {
    this.listeners = [];
    this.onRegisterAST = () => {};
    this.onTrev = () => {};
    this.nextId = 1;
    this.stack = [];
  }

  /**
   * @returns {number} an ID for a new trev
   */
  generateId() {
    return this.nextId++; // eslint-disable-line no-plusplus
  }

  /**
   * Registers a listener for tracer events.
   * @param {object} listener
   * @param {handleRegisterAST} listener.handleRegisterAST
   * @param {handleTrev} listener.handleTrev
   */
  addListener(listener) {
    if (this.listeners.length === 0) {
      this.onRegisterAST = listener.handleRegisterAST ? listener.handleRegisterAST.bind(listener)
        : () => {};
      this.onTrev = listener.handleTrev ? listener.handleTrev.bind(listener) : () => {};
    } else {
      this.onRegisterAST = (astId, ast) => {
        this.listeners.forEach((lis) => {
          if (lis.handleRegisterAST) {
            lis.handleRegisterAST(astId, ast);
          }
        });
      };
      this.onTrev = (trev) => {
        this.listeners.forEach((lis) => {
          if (lis.handleTrev) {
            lis.handleTrev(trev);
          }
        });
      };
    }
    this.listeners.push(listener);
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
