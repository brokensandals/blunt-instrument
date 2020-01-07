import * as babel from '@babel/core';
import { bluntInstrumentPlugin } from 'blunt-instrument-babel-plugin';
import { attachCodeSlicesToAST, ASTQuerier, copyNodeIdsBetweenASTs, addNodeIdsToAST } from 'blunt-instrument-ast-utils';
import { TraceQuerier } from 'blunt-instrument-trace-utils';

export function instrumentedEval(source, { saveInstrumented = false } = {}) {
  const assignTo = '_bluntInstrumentEvalRet';
  const babelOpts = { plugins: [[bluntInstrumentPlugin, { outputs: { assignTo }}]] };
  if (saveInstrumented) {
    babelOpts.ast = true;
  }

  const babelResult = babel.transformSync(source, { ast: true, sourceType: 'module', ...babelOpts });
  const { code } = babelResult;
  const wrapped = '(function(){var ' + assignTo + ';' + code + '; return ' + assignTo + ';})()';
  const evalResult = (0, eval)(wrapped);
  const { ast, trace } = evalResult;

  const result = {};

  attachCodeSlicesToAST(ast, source);
  const astQuerier = new ASTQuerier(ast);
  result.traceQuerier = new TraceQuerier(astQuerier, trace);

  if (saveInstrumented) {
    const parsed = babel.parseSync(code);
    copyNodeIdsBetweenASTs(babelResult.ast, parsed);
    addNodeIdsToAST(parsed, 'instr-');
    attachCodeSlicesToAST(parsed, code);
    result.instrumentedASTQuerier = new ASTQuerier(parsed);
  }

  return result;
}
