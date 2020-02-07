import { Encoder } from 'object-graph-as-json';
import ASTBundle from '../ast/ASTBundle';
import TrevCollection from './TrevCollection';

/**
 * Holds an in-memory trace of some instrumented code's execution.
 * This should be attached using a Tracer's addListener() method. Subsequently, any trevs
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
   * @returns {TrevCollection}
   */
  toTC() {
    return new TrevCollection(this.trevs, this.astb);
  }

  handleRegisterAST(astId, ast, code) {
    this.astb.add(astId, ast, code);
    if (this.onChange) {
      this.onChange();
    }
  }

  handleTrev(trev) {
    const encoded = { ...trev, data: this.encoder.encode(trev.data) };
    this.trevs.push(encoded);
    if (this.onChange) {
      this.onChange();
    }
  }
}
