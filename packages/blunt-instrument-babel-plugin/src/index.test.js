import * as babel from '@babel/core';
import examples from 'blunt-instrument-test-resources';
import {
  attachCodeSlicesToAST,
  ASTQuerier,
} from 'blunt-instrument-ast-utils';
import cloneDeep from 'lodash/cloneDeep'; // eslint-disable-line import/no-extraneous-dependencies
import { Encoder, UnsafeDecoder } from 'object-graph-as-json';
import { Trace, defaultTrace } from 'blunt-instrument-runtime';
import bluntInstrumentPlugin from '.';

/**
 * Runs blunt-instrument-babel-plugin on the given code and returns the instrumented code.
 * @param {string} code
 * @param {object} pluginOpts - options for the blunt-instrument babel plugin
 * @param {object} babelOpts - options for babel
 * @returns {string}
 */
function transform(code, pluginOpts = {}, babelOpts = { configFile: false }, modules = false) {
  const plugins = [[bluntInstrumentPlugin, pluginOpts]];
  if (modules) {
    plugins.push('@babel/plugin-transform-modules-commonjs');
  }
  return babel.transformSync(code, { plugins, ...babelOpts });
}

/**
 * Runs blunt-instrument-babel-plugin on the given code, then runs the instrumented code.
 * An object named "output" will be in scope for the code; the code can set properties on
 * it to communicate with the caller. The return value of this method is the "output" object,
 * with added properties "astq", "code", "instrumented" (code), and "tracer".
 *
 * @param {string} code
 * @returns {object}
 */
function biEval(code, pluginOpts = {}) {
  const { code: instrumented } = transform(code, {
    runtime: {
      mechanism: 'var',
      tracerVar: 'tracer',
    },
    ...pluginOpts,
  });

  const trace = new Trace({ encoder: new Encoder() });
  const tracer = trace.tracerFor('test');
  const fn = new Function('tracer', 'output', `"use strict";${instrumented}`); // eslint-disable-line no-new-func
  const output = {};
  fn(tracer, output);
  const astClone = cloneDeep(tracer.ast);
  attachCodeSlicesToAST(astClone, code);
  const astq = new ASTQuerier(astClone);

  return {
    astq,
    code,
    instrumented,
    trace,
    tracer,
    ...output,
  };
}

const decoder = new UnsafeDecoder();
decoder.onFailure = () => undefined;
function decode(data) {
  return decoder.decode(data);
}

function trevsForNode({ trace }, node) {
  return trace.trevs.filter((trev) => trev.nodeId === node.biId);
}

function codeTrevs(output, target, trevType = 'expr') {
  const nodes = output.astq.getNodesByCodeSlice(target);
  const trevs = nodes.flatMap((node) => trevsForNode(output, node));
  return trevs.filter((trev) => trev.type === trevType);
}

function codeValues(output, target, trevType = 'expr') {
  return codeTrevs(output, target, trevType).map((trev) => decode(trev.data));
}

function codeTrev(output, target, trevType = 'expr') {
  const trevs = codeTrevs(output, target, trevType);
  expect(trevs).toHaveLength(1);
  return trevs[0];
}

function codeValue(output, target, trevType = 'expr') {
  return decode(codeTrev(output, target, trevType).data);
}

function namedCalls(output, target, trevType = 'fn-start') {
  const nodes = output.astq.filterNodes(
    (node) => babel.types.isFunctionDeclaration(node) && node.id.name === target,
  );
  expect(nodes).toHaveLength(1);
  return trevsForNode(output, nodes[0])
    .filter((trev) => trev.type === trevType);
}

function namedCallsData(output, target, trevType = 'fn-start') {
  return namedCalls(output, target, trevType).map((trev) => decode(trev.data));
}

function namedCall(output, target, trevType = 'fn-start') {
  const trevs = namedCalls(output, target, trevType);
  expect(trevs).toHaveLength(1);
  return trevs[0];
}

describe('general examples', () => {
  test('factorial', () => {
    const output = biEval(`
      function fac(n) {
        return n == 1 ? 1 : n * fac(n - 1);
      }

      output.fac5 = fac(5);
    `);
    expect(output.fac5).toEqual(120);

    const calls = namedCalls(output, 'fac');
    expect(calls.map((trev) => decode(trev.data))).toEqual(
      [5, 4, 3, 2, 1].map((n) => ({ arguments: { 0: n }, n })),
    );
    const contextIds = calls.map((trev) => trev.id);
    for (let i = 1; i < 5; i += 1) {
      expect(contextIds[i]).not.toEqual(contextIds[i - 1]);
    }
    expect(calls.map((trev) => trev.parentId)).toEqual(
      [undefined].concat(contextIds.slice(0, 4)),
    );

    const rets = codeTrevs(output, 'return n == 1 ? 1 : n * fac(n - 1);', 'fn-ret');
    expect(rets.map((trev) => decode(trev.data))).toEqual([1, 2, 6, 24, 120]);
    expect(rets.map((trev) => trev.parentId).reverse()).toEqual(contextIds);

    const facNMinus1 = codeTrevs(output, 'fac(n - 1)');
    expect(facNMinus1.map((trev) => trev.parentId).reverse()).toEqual(contextIds.slice(0, 4));
    expect(facNMinus1.map((trev) => decode(trev.data))).toEqual([1, 2, 6, 24]);

    const nEq1 = codeTrevs(output, 'n == 1');
    expect(nEq1.map((trev) => trev.parentId)).toEqual(contextIds);
    expect(nEq1.map((trev) => decode(trev.data))).toEqual([false, false, false, false, true]);
  });
});

describe('configuration', () => {
  test('using defaultTrace', () => {
    const opts = {
      runtime: {
      },
    };
    const { code } = transform('const foo = "bar"', opts, {}, true);
    // use `eval()` instead of `new Function()` so that `require` is defined
    eval(code); // eslint-disable-line no-eval
    const astKeys = Object.keys(defaultTrace.tracers);
    expect(astKeys).toHaveLength(1);
    expect(defaultTrace.trevs).toEqual([{
      id: 1,
      type: 'expr',
      astKey: astKeys[0],
      nodeId: 'src-5',
      data: 'bar',
    }]);
  });
});

describe('special case syntax handling', () => {
  describe('errors', () => {
    test('parentId is set correctly when recovering from an error', () => {
      const output = biEval(`
        function one() {
          throw new Error('one failed');
        }
        function two() {
          try {
            one();
          } catch (e) {
            123;
          }
        }

        two();
        try {
          one();
        } catch (e) {
          456;
        }
      `);

      const errors = codeTrevs(output, "new Error('one failed')");
      expect(errors).toHaveLength(2);
      const oneStarts = namedCalls(output, 'one');
      expect(oneStarts).toHaveLength(2);
      const twoStart = namedCall(output, 'two');
      const twoCatch = codeTrev(output, '123');
      const rootCatch = codeTrev(output, '456');

      expect(oneStarts.map((trev) => trev.id)).toEqual(errors.map((trev) => trev.parentId));
      expect(oneStarts.map((trev) => trev.parentId)).toEqual([twoStart.id, undefined]);
      expect(twoCatch.parentId).toEqual(twoStart.id);
      expect(rootCatch.parentId).toBeUndefined();
    });

    test('fn-throw is recorded for errors not caught in the function body', () => {
      const output = biEval(`
        function inner() {
          throw new Error('whoopsie');
        }
        function outer() {
          inner();
        }
        try {
          outer();
        } catch (e) {
          output.error = e;
        }
      `);

      expect(output.error.message).toEqual('whoopsie');
      const throw1 = namedCall(output, 'inner', 'fn-throw').data;
      expect(throw1['.message'].value).toEqual('whoopsie');
      expect(namedCall(output, 'outer', 'fn-throw').data).toEqual(throw1);
    });
  });

  describe('method invocations', () => {
    test('this is bound and traced correctly when invoking a method', () => {
      const output = biEval(`
        const obj = { val: 'old' };
        function fn() { this.val = 'new'; }
        obj.fn = fn;
        obj.fn();
        output.val = obj.val;
      `);
      expect(output.val).toEqual('new');
      const thisValue = codeValue(output, 'this');
      expect(thisValue.val).toEqual('old');
      expect(typeof thisValue.fn).toEqual('function');
      expect(codeValues(output, 'obj.fn')).toHaveLength(0);
      const callData = namedCallsData(output, 'fn');
      expect(callData).toHaveLength(1);
      expect(callData[0].this).toBeDefined();
      expect(callData[0].this.val).toEqual('old');
      expect(typeof callData[0].this.fn).toEqual('function');
      expect(callData[0].arguments).toEqual({});
    });

    test('this is bound correctly when invoking the result of a getter, and the getter is only called once', () => {
      // This test exists as a reminder that translating
      // `x.y` to `trace(x.y); x.y()` would not be acceptable.
      const output = biEval(`
        const obj = {
          count: 0,
          get fn() {
            return function() {
              const val = this.count + 1;
              this.count = val;
            }
          },
        };
        obj.fn();
        output.count = obj.count;
      `);
      expect(output.count).toEqual(1);
      expect(codeValue(output, 'this.count')).toEqual(0);
      expect(codeValues(output, 'obj.fn')).toHaveLength(0);
    });
  });

  test('`fn-ret` is still generated when there is no return statement', () => {
    const output = biEval(`
      function foo() {
        output.result = 'hi';
      }
      foo();
    `);
    expect(output.result).toEqual('hi');
    expect(codeTrevs(output, `function foo() {
        output.result = 'hi';
      }`, 'fn-ret')).toHaveLength(1);
  });

  test('`arguments` is bound and traced correctly', () => {
    const output = biEval(`
      function foo() {
        return arguments.length * (arguments[0] + arguments[1]);
      }
      output.result = foo(4, 5, 10, 12);
    `);
    expect(output.result).toEqual(36);
    expect(namedCallsData(output, 'foo')).toEqual([{
      arguments: { 0: 4, 1: 5, 2: 10, 3: 12 }, // eslint-disable-line object-curly-newline
    }]);
  });

  test('assign to MemberExpression', () => {
    const output = biEval('const a = [null]; a[0] = 1; output.a0 = a[0];');
    expect(output.a0).toEqual(1);
    expect(codeValue(output, 'a[0] = 1')).toEqual(1);
  });

  describe('UpdateExpression handling', () => {
    test('postfix ++ operator', () => {
      const output = biEval('let x = 1; const a = x++; output.a = a; output.x = x;');
      expect(output.a).toEqual(1);
      expect(output.x).toEqual(2);
      expect(codeValue(output, 'x++')).toEqual(1);
    });

    test('prefix ++ operator', () => {
      const output = biEval('let x = 1; const a = ++x; output.a = a; output.x = x;');
      expect(output.a).toEqual(2);
      expect(output.x).toEqual(2);
      expect(codeValue(output, '++x')).toEqual(2);
    });

    test('postifx operator rewrite binds `arguments` correctly', () => {
      const output = biEval(`
        function foo() {
          output.original = arguments[0]++;
          return arguments[0];
        }
        output.result = foo(3);
      `);
      expect(output.result).toEqual(4);
      expect(output.original).toEqual(3);
    });

    test('postfix -- operator', () => {
      const output = biEval('let x = 2; const a = x--; output.a = a; output.x = x;');
      expect(output.a).toEqual(2);
      expect(output.x).toEqual(1);
      expect(codeValue(output, 'x--')).toEqual(2);
    });

    test('prefix -- operator', () => {
      const output = biEval('let x = 2; const a = --x; output.a = a; output.x = x;');
      expect(output.a).toEqual(1);
      expect(output.x).toEqual(1);
      expect(codeValue(output, '--x')).toEqual(1);
    });

    test('+= operator', () => {
      const output = biEval('let x = 1; const a = x += 1; output.a = a; output.x = x;');
      expect(output.a).toEqual(2);
      expect(output.x).toEqual(2);
      expect(codeValue(output, 'x += 1')).toEqual(2);
    });
  });
});

describe('demo examples', () => {
  Object.keys(examples).forEach((key) => {
    test(key, () => {
      const output = biEval(examples[key]);
      expect(output.instrumented).toMatchSnapshot();
      expect(output.tracer.trevs).toMatchSnapshot();
    });
  });
});
