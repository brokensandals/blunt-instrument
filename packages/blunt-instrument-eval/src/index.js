import * as babel from '@babel/core';
import bluntInstrumentPlugin from 'blunt-instrument-babel-plugin';
import { attachCodeSlicesToAST, ASTQuerier, copyNodeIdsBetweenASTs, addNodeIdsToAST } from 'blunt-instrument-ast-utils';
import { TraceQuerier } from 'blunt-instrument-trace-utils';

/**
 * This method ties together various pieces of blunt-instrument to provide a
 * convenient way of instrumenting a piece of javascript code, evaluating it,
 * and returning the trace in a consumable format.
 * 
 * The input is javascript source code as a string, and the output is an object
 * containing by default one field, `traceQuerier`. This is an instance of TraceQuerier
 * with the results of the trace.
 * 
 * @param {string} source - javascript code to be instrumented & evaluated
 * @param {object} opts
 * @param {boolean} opts.saveInstrumented - if true, the AST of the instrumented
 *   code (in addition to the AST of the orginal code) will be saved and returned
 *   in the `instrumentedASTQuerier` field of the return value
 * @returns {object}
 */
export function instrumentedEval(source, { saveInstrumented = false } = {}) {
  const assignTo = '_bluntInstrumentEvalRet';

  if (source.includes(assignTo)) {
    console.warn(`Code includes "${assignTo}", which is defined by instrumentedEval. This
may interfere with instrumentedEval, the code, or both.`);
  }

  const babelOpts = { plugins: [[bluntInstrumentPlugin, { outputs: { assignTo }}]] };
  if (saveInstrumented) {
    babelOpts.ast = true;
  }

  const babelResult = babel.transformSync(source, { ast: true, sourceType: 'module', ...babelOpts });
  const { code } = babelResult;

  const wrapped = '"use strict";(function(){var ' + assignTo + ';' + code + '; return ' + assignTo + ';})()';
  const evalResult = (0, eval)(wrapped);
  const { ast, trace } = evalResult;

  const result = {};

  attachCodeSlicesToAST(ast, source);
  const astQuerier = new ASTQuerier(ast);
  result.traceQuerier = new TraceQuerier(astQuerier, trace);

  if (saveInstrumented) {
    const parsed = babel.parseSync(code);
    copyNodeIdsBetweenASTs(babelResult.ast, parsed);
    addNodeIdsToAST(parsed, 'i');
    attachCodeSlicesToAST(parsed, code);
    result.instrumentedASTQuerier = new ASTQuerier(parsed);
  }

  return result;
}
