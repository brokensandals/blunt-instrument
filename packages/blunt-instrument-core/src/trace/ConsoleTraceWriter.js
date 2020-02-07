import ASTBundle from '../ast/ASTBundle';

/**
 * If you attach this using Tracer's addListener() method, all the trace evnts will be logged
 * to the console.
 */
export default class ConsoleTraceWriter {
  constructor() {
    this.astb = new ASTBundle();
  }

  handleRegisterAST(astId, ast) {
    this.astb.add(astId, ast);
    // eslint-disable-next-line no-console
    console.log(`onRegisterAST id [${astId}] AST:`);
    // eslint-disable-next-line no-console
    console.dir(ast);
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
    // eslint-disable-next-line no-console
    console.dir(trev);
  }
}
