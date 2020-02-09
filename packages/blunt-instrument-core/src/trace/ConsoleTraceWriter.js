import { Encoder } from 'object-graph-as-json';
import ASTBundle from '../ast/ASTBundle';

/**
 * If you attach this using Tracer's addListener() method, all the trace evnts will be logged
 * to the console.
 */
export default class ConsoleTraceWriter {
  constructor({ encode = false } = {}) {
    this.astb = new ASTBundle();
    if (encode) {
      this.encoder = new Encoder();
    }
  }

  handleRegisterAST(astId, ast, code) {
    this.astb.add(astId, ast, code);
    // eslint-disable-next-line no-console
    console.log(`onRegisterAST id [${astId}] AST:`);
    if (this.encoder) {
      console.log(JSON.stringify(ast, null, 2)); // eslint-disable-line no-console
    } else {
      console.dir(ast); // eslint-disable-line no-console
    }
  }

  handleTrev(trev) {
    let summary = 'onTrev';
    const node = this.astb.getNode(trev.astId, trev.nodeId);
    if (node && node.loc && node.loc.start) {
      summary += ` loc [${node.loc.start.line}:${node.loc.start.column}]`;
    }
    if (node && node.codeSlice) {
      summary += ` code [${node.codeSlice}]`;
    }
    summary += ' trev:';
    // eslint-disable-next-line no-console
    console.log(summary);
    if (this.encoder) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(
        { ...trev, data: this.encoder.encode(trev.data) },
        null,
        2,
      ));
    } else {
      console.dir(trev); // eslint-disable-line no-console
    }
  }
}
