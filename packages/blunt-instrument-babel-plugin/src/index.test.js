import * as babel from '@babel/core';
import { bluntInstrumentPlugin } from '.';

const SOURCE_FAC = `function fac(n) {
  return n == 1 ? 1 : n * fac(n - 1);
}`;

test('testing', () => {
  const { code, ...rest } = babel.transform(SOURCE_FAC, { plugins: [bluntInstrumentPlugin] });
  console.log(code);
  eval(code + '; console.log(fac(7)); console.log(biEvents);');
});

test('tmp', () => {
  const { code } = babel.transform(`x && y`, { plugins: [bluntInstrumentPlugin ]});
  console.log(code);
});
