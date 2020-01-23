import { Encoder } from 'object-graph-as-json';
import * as runtime from '.';

test('defaultEncoder is created', () => {
  expect(runtime.defaultEncoder).toBeInstanceOf(Encoder);
});

test('defaultTrace is created', () => {
  expect(runtime.defaultTrace).toBeInstanceOf(runtime.Trace);
  expect(runtime.defaultTrace.encoder).toBe(runtime.defaultEncoder);
});

describe('Trace', () => {
  let encoder;
  let trace;

  beforeEach(() => {
    encoder = new Encoder();
    trace = new runtime.Trace({ encoder });
  });

  test('tracers initialized to empty object', () => {
    expect(trace.tracers).toEqual({});
  });

  describe('tracerFor', () => {
    test('reuses existing tracer', () => {
      const tracer = trace.tracerFor('foo');
      expect(trace.tracerFor('foo')).toBe(tracer);
    });

    test('generates keys', () => {
      const t1 = trace.tracerFor();
      const t2 = trace.tracerFor();
      expect(t1).not.toBe(t2);
      expect(t1.astKey).not.toEqual(t2.astKey);
    });
  });

  describe('tracers', () => {
    const astKey = 'test';
    let tracer;

    beforeEach(() => {
      tracer = trace.tracerFor(astKey);
    });

    describe('record', () => {
      test('simple events', () => {
        tracer.record('expr', 1, 'foo');
        tracer.record('expr', 2, 'bar');
        tracer.record('expr', 3, 'baz');
        expect(trace.trevs).toEqual([
          {
            id: 1,
            type: 'expr',
            astKey,
            nodeId: 1,
            data: 'foo',
          },
          {
            id: 2,
            type: 'expr',
            astKey,
            nodeId: 2,
            data: 'bar',
          },
          {
            id: 3,
            type: 'expr',
            astKey,
            nodeId: 3,
            data: 'baz',
          },
        ]);
      });

      test('encoding', () => {
        tracer.record('expr', 1, { foo: 'bar' });
        expect(trace.trevs).toEqual([{
          id: 1,
          type: 'expr',
          astKey,
          nodeId: 1,
          data: {
            type: 'object',
            id: '1',
            '.foo': 'bar',
          },
        }]);
      });

      test('stack', () => {
        tracer.record('enter-fn', 1, 'a', 1);
        tracer.record('expr', 2, 'b');
        tracer.record('enter-fn', 3, 'c', 1);
        tracer.record('expr', 4, 'd', 0);
        tracer.record('fn-ret', 5, 'e', -1);
        tracer.record('fn-ret', 6, 'f', -1);
        tracer.record('expr', 7, 'g');
        expect(trace.trevs).toEqual([
          {
            id: 1,
            type: 'enter-fn',
            astKey,
            nodeId: 1,
            data: 'a',
          },
          {
            parentId: 1,
            id: 2,
            type: 'expr',
            astKey,
            nodeId: 2,
            data: 'b',
          },
          {
            parentId: 1,
            id: 3,
            type: 'enter-fn',
            astKey,
            nodeId: 3,
            data: 'c',
          },
          {
            parentId: 3,
            id: 4,
            type: 'expr',
            astKey,
            nodeId: 4,
            data: 'd',
          },
          {
            parentId: 3,
            id: 5,
            type: 'fn-ret',
            astKey,
            nodeId: 5,
            data: 'e',
          },
          {
            parentId: 1,
            id: 6,
            type: 'fn-ret',
            astKey,
            nodeId: 6,
            data: 'f',
          },
          {
            id: 7,
            type: 'expr',
            astKey,
            nodeId: 7,
            data: 'g',
          },
        ]);
      });
    });
  });
});
