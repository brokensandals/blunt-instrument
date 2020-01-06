import * as babel from '@babel/core';
import { bluntInstrumentPlugin } from '.';

const SOURCE_FAC = `function fac(n) {
  return n == 1 ? 1 : n * fac(n - 1);
}`;

function transform(source, pluginOpts = {}, babelOpts = {}) {
  return babel.transformSync(source, { plugins: [[bluntInstrumentPlugin, pluginOpts]] , ...babelOpts });
}

function codeEval(code) {
  return (0, eval(code));
}

function biEval(code) {
  const { code: instrumented } = transform(code, { outputs: { assignTo: 'output.instrumentation' }});
  console.log(instrumented)
  const wrapped = `
    (function() {
      let output = {};
      (function() {${instrumented}})()
      return output;
    })()
  `;
  return codeEval(wrapped);
}

describe('instrumentation object output', () => {
  describe('assignTo', () => {
    it('assigns to a specified variable', () => {
      const { code } = transform('const x = 1', { outputs: { assignTo: 'result' }});
      const wrapped = `
        (function() {
          let result;
          (function() {${code}})()
          return result;
        })()
      `;
      const result = codeEval(wrapped);
      expect(result).toHaveProperty('ast');
      expect(result).toHaveProperty('events');
    });

    it('assigns to an object member', () => {
      const { code } = transform('const x = 1', { outputs: { assignTo: 'this.result' }});
      const wrapped = `
        (function() {
          let obj = {};
          obj.fn = function(){${code}};
          obj.fn();
          return obj.result;
        })()
      `;
      const result = codeEval(wrapped);
      expect(result).toHaveProperty('ast');
      expect(result).toHaveProperty('events');
    });
  });

  describe('exportAs', () => {
    it('exports the specified name', () => {
      const { code } = transform('const x = 1', { outputs: { exportAs: 'result' }});
      const wrapped = `
        (function() {
          let exports = {};
          (function(){${code}})();
          return exports;
        })()
      `;
      const exported = codeEval(wrapped);
      expect(exported.__esModule).toBe(true);
      expect(exported.result).toHaveProperty('ast');
      expect(exported.result).toHaveProperty('events');
    });
  });
});

test('testing', () => {
  const { code, ...rest } = babel.transform(SOURCE_FAC, { plugins: [bluntInstrumentPlugin] });
  codeEval(code);
});

test('tmp', () => {
  const { code } = babel.transform(`x && y`, { plugins: [bluntInstrumentPlugin ]});
});

describe('special case syntax handling', () => {
  test('assign to MemberExpression', () => {
    const output = biEval('const a = [null]; a[0] = 1; output.a0 = a[0];');
    expect(output.a0).toEqual(1);
    // TODO test instrumentation
  });

  describe('UpdateExpression handling', () => {
    test('postfix ++ operator', () => {
      const output = biEval('let x = 1; const a = x++; output.a = a; output.x = x;');
      expect(output.a).toEqual(1);
      expect(output.x).toEqual(2);
      // TODO test instrumentation
    });
    
    test('prefix ++ operator', () => {
      const output = biEval('let x = 1; const a = ++x; output.a = a; output.x = x;');
      expect(output.a).toEqual(2);
      expect(output.x).toEqual(2);
      // TODO test instrumentation
    });
    
    test('+= operator', () => {
      const output = biEval('let x = 1; const a = x += 1; output.a = a; output.x = x;');
      expect(output.a).toEqual(2);
      expect(output.x).toEqual(2);
      // TODO test instrumentation
    });
  });
});