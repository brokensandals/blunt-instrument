import * as babel from '@babel/core';
import bluntInstrumentPlugin from 'blunt-instrument-babel-plugin';
import {
  attachCodeSlicesToAST,
  ASTBundle,
  copyNodeIdsBetweenASTs,
} from 'blunt-instrument-ast-utils';
import { InMemoryTrace } from 'blunt-instrument-runtime';
import { TrevCollection } from 'blunt-instrument-trace-utils';

/**
 * This method ties together various pieces of blunt-instrument to provide a
 * convenient way of instrumenting a piece of javascript code, evaluating it,
 * and returning the trace in a consumable format.
 *
 * The input is javascript source code as a string, and the output is an object
 * containing at least one field, `tc`. This is an instance of TrevCollection
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
 *   in the `instrumentedAST` field of the return value
 * @param {object} opts.traceOpts - if you need to customize the InMemoryTrace that
 *   this function creates, pass options for its constructor here
 * @returns {object}
 */
export default function (source, { saveInstrumented = false, traceOpts = {} } = {}) {
  const tracerVar = '_bie_tracer';

  if (source.includes(tracerVar)) {
    // eslint-disable-next-line no-console
    console.warn(`Code includes "${tracerVar}", which is defined by instrumentedEval. This
may interfere with instrumentedEval, the code, or both.`);
  }

  const trace = new InMemoryTrace(traceOpts);
  const tracer = trace.tracerFor('eval');

  const babelOpts = {
    plugins: [
      [bluntInstrumentPlugin,
        {
          runtime: {
            mechanism: 'var',
            tracerVar,
          },
          ast: {
            callback: (a) => { tracer.ast = JSON.parse(JSON.stringify(a)); },
            selfRegister: false,
          },
        }],
    ],
  };

  if (saveInstrumented) {
    babelOpts.ast = true;
  }

  const babelResult = babel.transformSync(source, { ast: true, sourceType: 'module', ...babelOpts });
  const { code } = babelResult;

  let error;
  const fn = new Function(tracerVar, `"use strict";${code}`); // eslint-disable-line no-new-func
  try {
    fn(tracer);
  } catch (e) {
    error = e;
  }

  const { ast } = tracer;
  const { trevs } = trace;
  if (!ast || !trevs) {
    if (error) {
      throw error;
    } else {
      throw new Error('Unknown error prior to instrumentation init.');
    }
  }

  const result = { error };

  attachCodeSlicesToAST(ast, source);
  const astb = new ASTBundle({ eval: ast });
  result.tc = new TrevCollection(trevs, astb).withDenormalizedInfo();

  if (saveInstrumented) {
    const parsed = babel.parseSync(code);
    copyNodeIdsBetweenASTs(babelResult.ast, parsed);
    attachCodeSlicesToAST(parsed, code);
    result.instrumentedAST = parsed;
  }

  return result;
}
