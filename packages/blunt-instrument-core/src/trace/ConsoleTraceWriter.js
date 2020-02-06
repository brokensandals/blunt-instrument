import ASTBundle from '../ast/ASTBundle';

/**
 * If you attach an instance of this class to a Tracer, all the trace evnts will be logged
 * to the console.
 */
export default class ConsoleTraceWriter {
  constructor() {
    this.astb = new ASTBundle();
  }

  /**
   * Configures the given Tracer to send events to this ConsoleTraceWriter instance.
   * @param {Tracer} tracer
   */
  attach(tracer) {
    // eslint-disable-next-line no-param-reassign
    tracer.onRegisterAST = this.handleRegisterAST.bind(this);
    // eslint-disable-next-line no-param-reassign
    tracer.onTrev = this.handleTrev.bind(this);
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
