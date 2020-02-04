import { Encoder } from 'object-graph-as-json';

/**
 * Holds an in-memory trace of some instrumented code's execution.
 * This should be attached to a Tracer using the attach() method. Subsequently, any trevs
 * or AST registrations reported by the Tracer will be stored.
 *
 * Trevs are stored in an array in a property named `trevs`. The `data` field of each trev
 * is encoded using object-graph-as-json so that later mutations to the object will not
 * alter the trev.
 *
 * ASTs are stored in an object in a property named `asts`. The key is the AST id, and the
 * value is the root babel node of the AST.
 *
 * You can set the property `onChange` to a function, and it will be called after any additions
 * to the `asts` object or the `trevs` array.
 */
export default class ArrayTrace {
  constructor({ encoder = new Encoder() } = {}) {
    this.asts = {};
    this.encoder = encoder;
    this.trevs = [];
  }

  /**
   * Configures the given Tracer to send events to this ArrayTrace instance.
   * @param {Tracer} tracer
   */
  attach(tracer) {
    // eslint-disable-next-line no-param-reassign
    tracer.onRegisterAST = this.handleRegisterAST.bind(this);
    // eslint-disable-next-line no-param-reassign
    tracer.onTrev = this.handleTrev.bind(this);
  }

  handleRegisterAST(astId, ast) {
    this.asts[astId] = ast;
    if (this.onChange) {
      this.onChange();
    }
  }

  handleTrev(trev) {
    // eslint-disable-next-line no-param-reassign
    trev.data = this.encoder.encode(trev.data);
    this.trevs.push(trev);
    if (this.onChange) {
      this.onChange();
    }
  }
}
