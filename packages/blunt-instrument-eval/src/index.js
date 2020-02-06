import { parseSync, transformSync } from '@babel/core';
import bluntInstrumentPlugin from 'blunt-instrument-babel-plugin';
import {
  ArrayTrace,
  attachCodeSlicesToAST,
  copyNodeIdsBetweenASTs,
  Tracer,
} from 'blunt-instrument-core';

/**
 * This method ties together various pieces of blunt-instrument to provide a
 * convenient way of instrumenting a piece of javascript code, evaluating it,
 * and returning the trace in a consumable format.
 *
 * The input is javascript source code as a string, and the output is an ArrayTrace instance.
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
 *   code will also be saved. It will be added as a field named `instrumentedAST`
 *   on the `astb` field of the trace.
 * @returns {ArrayTrace}
 */
export default function (source, { saveInstrumented = false } = {}) {
  const tracerVar = '_bie_tracer';

  if (source.includes(tracerVar)) {
    // eslint-disable-next-line no-console
    console.warn(`Code includes "${tracerVar}", which is defined by instrumentedEval. This
may interfere with instrumentedEval, the code, or both.`);
  }

  let ast;
  const trace = new ArrayTrace();
  const tracer = new Tracer();
  trace.attach(tracer);

  const babelOpts = {
    configFile: false,
    plugins: [
      [bluntInstrumentPlugin,
        {
          runtime: {
            mechanism: 'var',
            tracerVar,
          },
          ast: {
            callback: (id, a) => { ast = JSON.parse(JSON.stringify(a)); },
            id: 'eval',
            selfRegister: false,
          },
        }],
    ],
  };

  if (saveInstrumented) {
    babelOpts.ast = true;
  }

  const babelResult = transformSync(source, { ast: true, sourceType: 'module', ...babelOpts });

  if (!ast) {
    throw new Error('blunt-instrument-babel-plugin did not invoke callback with AST');
  }
  attachCodeSlicesToAST(ast, source);
  tracer.onRegisterAST('eval', ast);

  const { code } = babelResult;
  const fn = new Function(tracerVar, `"use strict";${code}`); // eslint-disable-line no-new-func
  try {
    fn(tracer);
  } catch (e) {
    trace.error = e;
  }

  if (saveInstrumented) {
    const parsed = parseSync(code);
    copyNodeIdsBetweenASTs(babelResult.ast, parsed);
    attachCodeSlicesToAST(parsed, code);
    trace.astb.instrumentedAST = parsed;
  }

  return trace;
}
