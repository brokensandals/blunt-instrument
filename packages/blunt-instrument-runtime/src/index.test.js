import { Encoder } from 'object-graph-as-json';
import * as runtime from '.';

test('defaultEncoder is created', () => {
  expect(runtime.defaultEncoder).toBeInstanceOf(Encoder);
});

test('defaultTracer is created', () => {
  expect(runtime.defaultTracer).toBeInstanceOf(runtime.Tracer);
  expect(runtime.defaultTracer.encoder).toBe(runtime.defaultEncoder);
});

describe('Tracer', () => {
  let encoder;
  let tracer;

  beforeEach(() => {
    encoder = new Encoder();
    tracer = new runtime.Tracer({ encoder });
  });

  test('asts initialized to empty object', () => {
    expect(tracer.asts).toEqual({});
  });

  describe('record', () => {
    test('simple events', () => {
      tracer.record('expr', 'n-1', 'foo');
      tracer.record('expr', 'n-2', 'bar');
      tracer.record('expr', 'n-3', 'baz');
      expect(tracer.trevs).toEqual([
        {
          id: 1,
          type: 'expr',
          nodeId: 'n-1',
          data: 'foo',
        },
        {
          id: 2,
          type: 'expr',
          nodeId: 'n-2',
          data: 'bar',
        },
        {
          id: 3,
          type: 'expr',
          nodeId: 'n-3',
          data: 'baz',
        },
      ]);
    });

    test('encoding', () => {
      tracer.record('expr', 'n-1', { foo: 'bar' });
      expect(tracer.trevs).toEqual([{
        id: 1,
        type: 'expr',
        nodeId: 'n-1',
        data: {
          type: 'object',
          id: '1',
          '.foo': 'bar',
        },
      }]);
    });

    test('stack', () => {
      tracer.record('enter-fn', 'n-1', 'a', 1);
      tracer.record('expr', 'n-2', 'b');
      tracer.record('enter-fn', 'n-3', 'c', 1);
      tracer.record('expr', 'n-4', 'd', 0);
      tracer.record('fn-ret', 'n-5', 'e', -1);
      tracer.record('fn-ret', 'n-6', 'f', -1);
      tracer.record('expr', 'n-7', 'g');
      expect(tracer.trevs).toEqual([
        {
          id: 1,
          type: 'enter-fn',
          nodeId: 'n-1',
          data: 'a',
        },
        {
          parentId: 1,
          id: 2,
          type: 'expr',
          nodeId: 'n-2',
          data: 'b',
        },
        {
          parentId: 1,
          id: 3,
          type: 'enter-fn',
          nodeId: 'n-3',
          data: 'c',
        },
        {
          parentId: 3,
          id: 4,
          type: 'expr',
          nodeId: 'n-4',
          data: 'd',
        },
        {
          parentId: 3,
          id: 5,
          type: 'fn-ret',
          nodeId: 'n-5',
          data: 'e',
        },
        {
          parentId: 1,
          id: 6,
          type: 'fn-ret',
          nodeId: 'n-6',
          data: 'f',
        },
        {
          id: 7,
          type: 'expr',
          nodeId: 'n-7',
          data: 'g',
        },
      ]);
    });
  });
});
