import * as babel from '@babel/core';
import { bluntInstrumentPlugin } from '.';

const SOURCE_FAC = `function fac(n) {
  return n == 1 ? 1 : n * fac(n - 1);
}`;

function transform(source, pluginOpts = {}, babelOpts = {}) {
  return babel.transformSync(source, { plugins: [[bluntInstrumentPlugin, pluginOpts]] , ...babelOpts });
}

function run(code) {
  return (0, eval(code));
}

describe('instrumentation object output', () => {
  describe('assignTo', () => {
    it('assigns to a specified variable', () => {
      const { code } = transform('const x = 1', { outputs: { assignTo: 'result' }});
      const wrapped = '(function(){let result;(function(){' + code + '})();return result;})()';
      const result = run(wrapped);
      expect(result).toHaveProperty('ast');
      expect(result).toHaveProperty('events');
    });

    it('assigns to an object member', () => {
      const { code } = transform('const x = 1', { outputs: { assignTo: 'this.result' }});
      const wrapped = '(function(){let obj = {};obj.f = function(){' + code + '};obj.f();return obj.result;})()';
      const result = run(wrapped);
      expect(result).toHaveProperty('ast');
      expect(result).toHaveProperty('events');
    });
  });
});

test('testing', () => {
  const { code, ...rest } = babel.transform(SOURCE_FAC, { plugins: [bluntInstrumentPlugin] });
  run(code);
});

test('tmp', () => {
  const { code } = babel.transform(`x && y`, { plugins: [bluntInstrumentPlugin ]});
});

describe('special case syntax handling', () => {
  test('assign to MemberExpression', () => {
    const { code } = transform('const a = [null]; a[0] = 1;');
    run(code);
  });

  describe('UpdateExpression handling', () => {
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
  });
});