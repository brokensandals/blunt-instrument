import { Encoder } from 'object-graph-as-json';

export default class ArrayTrace {
  constructor({ encoder = new Encoder() } = {}) {
    this.asts = {};
    this.encoder = encoder;
    this.trevs = [];
  }

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
