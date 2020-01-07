import * as babel from '@babel/core';
import * as types from '@babel/types';
import { bluntInstrumentPlugin } from 'blunt-instrument-babel-plugin';
import { attachCodeSlicesToAST, ASTQuerier, copyNodeIdsBetweenASTs, addNodeIdsToAST } from 'blunt-instrument-ast-utils';
import { TraceQuerier } from 'blunt-instrument-querier';

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
  const { ast, events } = evalResult;

  attachCodeSlicesToAST(ast, source);
  const astQueriers = {
    input: new ASTQuerier(ast),
  };

  if (saveInstrumented) {
    const parsed = babel.parseSync(code);
    copyNodeIdsBetweenASTs(babelResult.ast, parsed);
    addNodeIdsToAST(parsed, 'instr-');
    attachCodeSlicesToAST(parsed, code);
    astQueriers.instrumented = new ASTQuerier(parsed);
  }

  return new TraceQuerier(astQueriers, events);
}
