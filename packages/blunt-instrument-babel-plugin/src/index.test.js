import * as babel from 'babel-core';
import bluntInstrumentPlugin from './';

const SOURCE_FAC = `function fac(n) {
  return n == 1 ? 1 : n * fac(n - 1);
}`;

test('testing', () => {
  const { code } = babel.transform(SOURCE_FAC, { plugins: [bluntInstrumentPlugin] });
  console.log(code);
});
