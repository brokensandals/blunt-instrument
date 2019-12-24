import * as babel from '@babel/core';
import { bluntInstrumentPlugin } from 'blunt-instrument-babel-plugin';

const babelOpts = { plugins: [bluntInstrumentPlugin] };

export function instrumentedEval(source) {
  const result = babel.transformSync(source, babelOpts);
  
}
