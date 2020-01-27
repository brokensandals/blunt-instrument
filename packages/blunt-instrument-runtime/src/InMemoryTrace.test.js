import { Encoder } from 'object-graph-as-json';
import InMemoryTrace from './InMemoryTrace';

describe('InMemoryTrace', () => {
  let encoder;
  let trace;

  beforeEach(() => {
    encoder = new Encoder();
    trace = new InMemoryTrace({ encoder });
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

    describe('logTrev', () => {
      test('simple events', () => {
        tracer.logTrev('expr', 1, 'foo');
        tracer.logTrev('expr', 2, 'bar');
        tracer.logTrev('expr', 3, 'baz');
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
        tracer.logTrev('expr', 1, { foo: 'bar' });
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
    });

    test('stack operations', () => {
      tracer.logFnStart(10, 'a');
      tracer.logFnStart(20, 'b');
      tracer.logFnPause(30, 'c');
      tracer.logExpr(40, 'd');
      tracer.logFnResume(50, 'e', 2);
      tracer.logFnRet(60, 'f');
      tracer.logFnThrow(70, 'g');
      tracer.logExpr(80, 'h');
      expect(trace.trevs).toHaveLength(8);
      expect(trace.trevs.map((t) => t.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      expect(trace.trevs.map((t) => t.parentId)).toEqual([undefined, 1, 2, 1, 1, 5, 1, undefined]);
      expect(trace.trevs.map((t) => t.data)).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
      expect(trace.trevs.map((t) => t.fnStartId)).toEqual(
        [undefined, undefined, undefined, undefined, 2, undefined, undefined, undefined],
      );
      expect(trace.trevs.map((t) => t.nodeId)).toEqual([10, 20, 30, 40, 50, 60, 70, 80]);
    });
  });
});
