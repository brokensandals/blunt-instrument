import * as babel from '@babel/core';
import { bluntInstrumentPlugin } from 'blunt-instrument-babel-plugin';
import { TraceQuerier } from 'blunt-instrument-querier';

const babelOpts = { plugins: [bluntInstrumentPlugin] };

export function instrumentedEval(source) {
  const babelResult = babel.transformSync(source, { sourceType: 'script', ...babelOpts });
  const { code } = babelResult;
  const wrapped = code + '; [biAST, biEvents]'; // TODO: be less hacky
  const [ast, events] = (0, eval)(wrapped);
  const querier = new TraceQuerier(ast, events, source);
  return {
    babelResult,
    querier
  };
}
