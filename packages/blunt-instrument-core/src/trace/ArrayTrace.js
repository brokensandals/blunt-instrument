import { Encoder } from 'object-graph-as-json';
import ASTBundle from '../ast/ASTBundle';
import TrevCollection from './TrevCollection';

/**
 * Holds an in-memory trace of some instrumented code's execution.
 * This should be attached to a Tracer using the attach() method. Subsequently, any trevs
 * or AST registrations reported by the Tracer will be stored.
 *
 * Trevs are stored in an array in a property named `trevs`. The `data` field of each trev
 * is encoded using object-graph-as-json so that later mutations to the object will not
 * alter the trev.
 *
 * ASTs are stored in an ASTBundle held in the property named `astb`.
 *
 * You can set the property `onChange` to a function, and it will be called after any additions
 * to the `astb` object or the `trevs` array.
 */
export default class ArrayTrace {
  constructor({ encoder = new Encoder() } = {}) {
    this.astb = new ASTBundle();
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

  /**
   * @returns {TrevCollection}
   */
  toTC() {
    return new TrevCollection(this.trevs, this.astb);
  }

  handleRegisterAST(astId, ast) {
    this.astb.add(astId, ast);
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
