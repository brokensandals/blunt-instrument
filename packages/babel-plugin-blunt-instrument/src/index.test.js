import * as babel from '@babel/core';
import examples from 'blunt-instrument-test-resources';
import {
  ArrayTrace,
  attachCodeSlicesToAST,
  defaultTracer,
  Tracer,
} from 'blunt-instrument-core';
import cloneDeep from 'lodash/cloneDeep'; // eslint-disable-line import/no-extraneous-dependencies
import { UnsafeDecoder } from 'object-graph-as-json';
import bluntInstrumentPlugin from '.';

/**
 * Runs blunt-instrument-babel-plugin on the given code and returns the instrumented code.
 * @param {string} code
 * @param {object} pluginOpts - options for the blunt-instrument babel plugin
 * @param {object} babelOpts - options for babel
 * @returns {string}
 */
function transform(
  code,
  pluginOpts = { ast: { id: 'test' } },
  babelOpts = { configFile: false },
  modules = false,
) {
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
 * with added properties "astb", "code", "instrumented" (code), and "tracer".
 *
 * @param {string} code
 * @returns {object}
 */
function biEval(code, pluginOpts = {}) {
  if (!pluginOpts.ast) {
    pluginOpts.ast = {}; // eslint-disable-line no-param-reassign
  }
  pluginOpts.ast.id = 'test'; // eslint-disable-line no-param-reassign
  const { code: instrumented } = transform(code, {
    runtime: {
      mechanism: 'var',
      tracerVar: 'tracer',
    },
    ...pluginOpts,
  });

  const tracer = new Tracer();
  const trace = new ArrayTrace();
  trace.attach(tracer);
  const fn = new Function('tracer', 'output', `"use strict";${instrumented}`); // eslint-disable-line no-new-func
  const output = {};
  fn(tracer, output);
  const astClone = cloneDeep(trace.astb.asts.test);
  attachCodeSlicesToAST(astClone, code);
  tracer.onRegisterAST(pluginOpts.ast.id, astClone);
  const { astb } = trace;

  return {
    astb,
    code,
    instrumented,
    trace,
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
  const nodes = output.astb.filterNodes((node) => node.codeSlice === target);
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
  const nodes = output.astb.filterNodes(
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
  let trace;

  beforeEach(() => {
    trace = new ArrayTrace();
    trace.attach(defaultTracer);
  });

  afterEach(() => {
    defaultTracer.onTrev = () => {};
    defaultTracer.onRegisterAST = () => {};
  });

  test('using defaultTrace with specified ast id', () => {
    const opts = {
      runtime: {
      },
      ast: {
        id: 'test',
      },
    };
    const { code } = transform('const foo = "meh"', opts, {}, true);
    expect(code).toContain('onRegisterAST');
    // use `eval()` instead of `new Function()` so that `require` is defined
    eval(code); // eslint-disable-line no-eval
    expect(trace.astb.asts.test).not.toBeNull();
    expect(trace.trevs).toEqual([{
      id: 1,
      type: 'expr',
      astId: 'test',
      nodeId: 5,
      data: 'meh',
    }]);
  });

  test('with selfRegister disabled', () => {
    const opts = {
      runtime: {
        mechanism: 'var',
        tracerVar: 'tracer',
      },
      ast: {
        id: 'test',
        selfRegister: false,
      },
    };
    const { code } = transform('const foo = "meh"', opts, {});
    const tracer = new Tracer();
    trace = new ArrayTrace();
    trace.attach(tracer);
    expect(code).not.toContain('onRegisterAST');
    const fn = new Function('tracer', `"use strict";${code}`); // eslint-disable-line no-new-func
    fn(tracer);
    expect(tracer.ast).toBeUndefined();
    expect(trace.trevs).toHaveLength(1);
  });

  test('with AST callback', () => {
    let astId;
    let ast;
    const opts = {
      runtime: {
        mechanism: 'var',
        tracerVar: 'tracer',
      },
      ast: {
        id: 'test',
        callback: (id, a) => { astId = id; ast = JSON.parse(JSON.stringify(a)); },
        selfRegister: false,
      },
    };
    transform('const foo = "meh"', opts, {});
    expect(astId).toEqual('test');
    expect(ast).not.toBeNull();
    expect(ast.biId).toEqual(1);
  });

  test('defaultEnabled = false', () => {
    const code = `
      const a = 1;
      const b = 2; // bi-enable-line
      const c = 3;
      // bi-enable
      const d = 4;
      const e = 5;
      // bi-disable
      const f = 6;
    `;
    const opts = {
      instrument: {
        defaultEnabled: false,
      },
    };
    const output = biEval(code, opts);
    expect(codeTrevs(output, '1')).toHaveLength(0);
    expect(codeTrevs(output, '2')).toHaveLength(1);
    expect(codeTrevs(output, '3')).toHaveLength(0);
    expect(codeTrevs(output, '4')).toHaveLength(1);
    expect(codeTrevs(output, '5')).toHaveLength(1);
    expect(codeTrevs(output, '6')).toHaveLength(0);
  });

  describe('console writer', () => {
    let spyLog;
    let spyDir;

    beforeEach(() => {
      spyLog = jest.spyOn(console, 'log').mockImplementation();
      spyDir = jest.spyOn(console, 'dir').mockImplementation();
    });

    afterEach(() => {
      spyLog.mockRestore();
      spyDir.mockRestore();
    });

    it('does not override an already-registered listener', () => {
      defaultTracer.attachedWriterByPlugin = true;
      const opts = {
        runtime: {
          writer: {
            type: 'console',
          },
        },
        ast: {
          id: 'test',
        },
      };
      const { code } = transform('const foo = "meh"', opts, {}, true);
      // use `eval()` instead of `new Function()` so that `require` is defined
      eval(code); // eslint-disable-line no-eval
      expect(spyLog).not.toHaveBeenCalled();
    });

    it('attaches a listener', () => {
      delete defaultTracer.attachedWriterByPlugin;
      const opts = {
        runtime: {
          writer: {
            type: 'console',
          },
        },
        ast: {
          id: 'test',
        },
      };
      const { code } = transform('const foo = "meh"', opts, {}, true);
      // use `eval()` instead of `new Function()` so that `require` is defined
      eval(code); // eslint-disable-line no-eval
      expect(spyLog).toHaveBeenCalledWith('onTrev loc [1:12] trev:');
      expect(spyDir).toHaveBeenCalled();
    });
  });
});

describe('special case syntax handling', () => {
  test('imports', () => {
    expect(() => transform('import foo from "bar"')).not.toThrow();
  });

  test('method declarations', () => {
    const output = biEval(`
      const foo = {
        bar(x, y) {
          return x + y;
        }
      };
      output.result = foo.bar(3, 4);
    `);
    expect(output.result).toEqual(7);
  });

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

  test('async/await', () => {
    const output = biEval(`
      function deferredSquare(n) {
        return new Promise((resolve) => setTimeout(() => resolve(n * n)));
      }
      async function foo() {
        const a = await deferredSquare(2);
        const b = await deferredSquare(a);
        return a + b;
      }
      output.promise = foo();
    `);
    return output.promise.then((result) => {
      expect(result).toEqual(20);
      const call1 = namedCall(output, 'foo');
      const pause1 = codeTrev(output, 'await deferredSquare(2)', 'fn-pause');
      expect(pause1.data.prototype).toEqual({ name: 'Promise.prototype', type: 'builtin' });
      expect(pause1.parentId).toEqual(call1.id);
      const resume1 = codeTrev(output, 'await deferredSquare(2)', 'fn-resume');
      expect(resume1.data).toEqual(4);
      expect(resume1.parentId).toBeUndefined();
      expect(resume1.fnStartId).toEqual(call1.id);
      const pause2 = codeTrev(output, 'await deferredSquare(a)', 'fn-pause');
      expect(pause2.data.prototype).toEqual({ name: 'Promise.prototype', type: 'builtin' });
      expect(pause2.parentId).toEqual(resume1.id);
      const resume2 = codeTrev(output, 'await deferredSquare(a)', 'fn-resume');
      expect(resume2.data).toEqual(16);
      expect(resume2.parentId).toBeUndefined();
      expect(resume2.fnStartId).toEqual(call1.id);
      const ret1 = codeTrev(output, 'return a + b;', 'fn-ret');
      expect(ret1.data).toEqual(20);
    });
  });

  describe('generators', () => {
    test('yields values and manages stack correctly', () => {
      const output = biEval(`
        function* threePowers(n) {
          const n2 = n * n;
          yield n2;
          const n3 = n2 * n;
          yield n3;
          const n4 = n3 * n;
          return n4;
        }

        function foo() {
          const iter = threePowers(2);
          output.yielded = [];
          let result = iter.next();
          while (!result.done) {
            output.yielded.push(result.value);
            result = iter.next();
          }
          output.returned = result.value;
        }

        foo();
      `);
      const call1 = namedCall(output, 'foo');
      const call2 = namedCall(output, 'threePowers');
      expect(call2.parentId).toEqual(call1.id);
      const expr1 = codeTrev(output, 'n * n');
      expect(expr1.parentId).toEqual(call2.id);
      const pause1 = codeTrev(output, 'yield n2', 'fn-pause');
      expect(pause1.parentId).toEqual(call2.id);
      expect(pause1.data).toEqual(4);
      const resume1 = codeTrev(output, 'yield n2', 'fn-resume');
      expect(resume1.parentId).toEqual(call1.id);
      expect(resume1.fnStartId).toEqual(call2.id);
      const expr2 = codeTrev(output, 'n2 * n');
      expect(expr2.parentId).toEqual(resume1.id);
      const pause2 = codeTrev(output, 'yield n3', 'fn-pause');
      expect(pause2.parentId).toEqual(resume1.id);
      expect(pause2.data).toEqual(8);
      const resume2 = codeTrev(output, 'yield n3', 'fn-resume');
      expect(resume2.parentId).toEqual(call1.id);
      expect(resume2.fnStartId).toEqual(call2.id);
      const expr3 = codeTrev(output, 'n3 * n');
      expect(expr3.parentId).toEqual(resume2.id);
      const ret1 = codeTrev(output, 'return n4;', 'fn-ret');
      expect(ret1.parentId).toEqual(resume2.id);
      expect(ret1.data).toEqual(16);
      expect(output.yielded).toEqual([4, 8]);
      expect(output.returned).toEqual(16);
      // We don't generate an expr trev in addition to the fn-resume trev,
      // since that would take extra work and would duplicate the same data.
      expect(codeTrevs(output, 'yield n2', 'expr')).toHaveLength(0);
    });

    test('yield*', () => {
      const output = biEval(`
        function* two() {
          yield 1;
          yield 2;
          yield 3;
        }
        
        function* one() {
          yield* two();
          yield 4;
        }

        output.yielded = [];
        for (const value of one()) {
          output.yielded.push(value);
        }
      `);

      const call1 = namedCall(output, 'one');
      const call2 = namedCall(output, 'two');
      expect(call1.parentId).toBeUndefined();
      expect(call2.parentId).toBeUndefined();
      const pause1 = codeTrev(output, 'yield* two()', 'fn-pause');
      expect(pause1.parentId).toEqual(call1.id);
      expect(pause1.data.prototype.prototype['.next']).not.toBeNull();
      const pause2 = codeTrev(output, 'yield 1', 'fn-pause');
      expect(pause2.parentId).toEqual(call2.id);
      expect(pause2.data).toEqual(1);
      const resume1 = codeTrev(output, 'yield 1', 'fn-resume');
      expect(resume1.parentId).toBeUndefined();
      expect(resume1.fnStartId).toEqual(call2.id);
      const pause3 = codeTrev(output, 'yield 2', 'fn-pause');
      expect(pause3.parentId).toEqual(resume1.id);
      expect(pause3.data).toEqual(2);
      const resume2 = codeTrev(output, 'yield 2', 'fn-resume');
      expect(resume2.parentId).toBeUndefined();
      expect(resume2.fnStartId).toEqual(call2.id);
      const pause4 = codeTrev(output, 'yield 3', 'fn-pause');
      expect(pause4.parentId).toEqual(resume2.id);
      expect(pause4.data).toEqual(3);
      const resume3 = codeTrev(output, 'yield 3', 'fn-resume');
      expect(resume3.parentId).toBeUndefined();
      expect(resume3.fnStartId).toEqual(call2.id);
      const ret1 = namedCall(output, 'two', 'fn-ret');
      expect(ret1.parentId).toEqual(resume3.id);
      const resume4 = codeTrev(output, 'yield* two()', 'fn-resume');
      expect(resume4.parentId).toBeUndefined();
      expect(resume4.fnStartId).toEqual(call1.id);
      const pause5 = codeTrev(output, 'yield 4', 'fn-pause');
      expect(pause5.parentId).toEqual(resume4.id);
      expect(pause5.data).toEqual(4);
      expect(output.yielded).toEqual([1, 2, 3, 4]);
    });

    test('next with argument', () => {
      const output = biEval(`
        function* foo() {
          const a = yield 1;
          yield a * 5;
        }

        const iter = foo();
        output.first = iter.next().value;
        output.second = iter.next(output.first * 2).value;
      `);
      const resume1 = codeTrev(output, 'yield 1', 'fn-resume');
      expect(resume1.data).toEqual(2);
      expect(output.first).toEqual(1);
      expect(output.second).toEqual(10);
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

test('comment controls', () => {
  const code = `
  function square(a) {
    return a * a;
  }

  function cube(b) {
    const squared = square(b); // bi-disable-line
    return squared * b;
  }

  // bi-disable
  function fourth(c) {
    const cubed = cube(c); // bi-enable-line
    return cubed * c;
  }

  const one = square(1);
  const eight = cube(2);
  // bi-enable

  const sixteen = square(4);
  const alsoSixteen = fourth(2);
  `;

  const output = biEval(code);

  expect(codeTrevs(output, 'cube(c)')).toHaveLength(1);
  expect(codeTrevs(output, 'squared * b')).toHaveLength(2);
  expect(codeTrevs(output, 'square(4)')).toHaveLength(1);
  expect(codeTrevs(output, 'fourth(2)')).toHaveLength(1);
  expect(namedCalls(output, 'square')).toHaveLength(4);
  expect(namedCalls(output, 'cube')).toHaveLength(2);

  expect(codeTrevs(output, 'square(b)')).toHaveLength(0);
  expect(codeTrevs(output, 'square(1)')).toHaveLength(0);
  expect(codeTrevs(output, 'cube(2)')).toHaveLength(0);
  expect(namedCalls(output, 'fourth')).toHaveLength(0);
});

describe('demo examples', () => {
  Object.keys(examples).forEach((key) => {
    if (key === 'fetch') {
      // This example makes a network call; that introduces more chance for variability than
      // this test is worth.
      return;
    }
    if (key === 'countdown') {
      // This example uses timers, not worth the bother.
      return;
    }

    test(key, () => {
      const output = biEval(examples[key]);
      expect(output.instrumented).toMatchSnapshot();
      expect(output.trace.trevs).toMatchSnapshot();
    });
  });
});
