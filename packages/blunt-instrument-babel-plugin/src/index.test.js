import * as babel from '@babel/core';
import { bluntInstrumentPlugin } from '.';

const SOURCE_FAC = `function fac(n) {
  return n == 1 ? 1 : n * fac(n - 1);
}`;

function transform(source) {
  return babel.transformSync(source, { plugins: [bluntInstrumentPlugin] });
}

function run(code) {
  (0, eval(code));
}

test('testing', () => {
  const { code, ...rest } = babel.transform(SOURCE_FAC, { plugins: [bluntInstrumentPlugin] });
  run(code);
});

test('tmp', () => {
  const { code } = babel.transform(`x && y`, { plugins: [bluntInstrumentPlugin ]});
});

test('postfix ++ operator', () => {
  const { code } = transform('let x = 1; x++');
  run(code);
});

test('prefix ++ operator', () => {
  const { code } = transform('let x = 1; ++x');
  run(code);
});

test('+= operator', () => {
  const { code } = transform('let x = 1; x += 1');
  run(code);
});

test('assign to MemberExpression', () => {
  const { code } = transform('const a = [null]; a[0] = 1;');
  run(code);
});
