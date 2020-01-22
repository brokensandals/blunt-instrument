import * as babel from '@babel/core';
import bluntInstrumentPlugin from 'blunt-instrument-babel-plugin';
import {
  attachCodeSlicesToAST,
  ASTQuerier,
  copyNodeIdsBetweenASTs,
  addNodeIdsToAST,
} from 'blunt-instrument-ast-utils';
import { Tracer } from 'blunt-instrument-runtime';
import { TraceQuerier } from 'blunt-instrument-trace-utils';

/**
 * This method ties together various pieces of blunt-instrument to provide a
 * convenient way of instrumenting a piece of javascript code, evaluating it,
 * and returning the trace in a consumable format.
 *
 * The input is javascript source code as a string, and the output is an object
 * containing by at least one field, `traceQuerier`. This is an instance of TraceQuerier
 * with the results of the trace.
 *
 * If the code throws an error, it will be caught and stored in the `error` field of the
 * return value.
 *
 * Invalid input code or an error in initializing the tracer may cause this function
 * to throw errors.
 *
 * @param {string} source - javascript code to be instrumented & evaluated
 * @param {object} opts
 * @param {boolean} opts.saveInstrumented - if true, the AST of the instrumented
 *   code (in addition to the AST of the orginal code) will be saved and returned
 *   in the `instrumentedASTQuerier` field of the return value
 * @returns {object}
 */
export default function (source, { saveInstrumented = false } = {}) {
  const tracerVar = '_bie_tracer';

  if (source.includes(tracerVar)) {
    // eslint-disable-next-line no-console
    console.warn(`Code includes "${tracerVar}", which is defined by instrumentedEval. This
may interfere with instrumentedEval, the code, or both.`);
  }

  const babelOpts = {
    plugins: [
      [bluntInstrumentPlugin, { runtime: { mechanism: 'var', tracerVar } }],
    ],
  };

  if (saveInstrumented) {
    babelOpts.ast = true;
  }

  const babelResult = babel.transformSync(source, { ast: true, sourceType: 'module', ...babelOpts });
  const { code } = babelResult;

  let error;
  const fn = new Function(tracerVar, `"use strict";${code}`); // eslint-disable-line no-new-func
  const tracer = new Tracer();
  try {
    fn(tracer);
  } catch (e) {
    error = e;
  }

  const ast = tracer.asts.src;
  const trace = tracer.trevs;
  if (!ast || !trace) {
    if (error) {
      throw error;
    } else {
      throw new Error('Unknown error prior to instrumentation init.');
    }
  }

  const result = { error };

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
