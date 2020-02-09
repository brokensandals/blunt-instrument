import Tracer from './Tracer';

describe('Tracer', () => {
  let tracer;
  beforeEach(() => {
    tracer = new Tracer();
  });

  test('generateId', () => {
    expect(tracer.generateId()).toEqual(1);
    expect(tracer.generateId()).toEqual(2);
    expect(tracer.generateId()).toEqual(3);
  });

  test('traceExpr', (done) => {
    tracer.onTrev = (trev) => {
      expect(trev).toEqual({
        astId: 'fake',
        data: 'whatevs',
        id: 1,
        nodeId: 10,
        type: 'expr',
      });
      done();
    };
    expect(tracer.traceExpr('fake', 10, 'whatevs')).toEqual('whatevs');
  });

  test('traceFnStart', (done) => {
    tracer.onTrev = (trev) => {
      expect(trev).toEqual({
        astId: 'fake',
        data: { foo: 'bar' },
        id: 1,
        nodeId: 10,
        type: 'fn-start',
      });
      done();
    };
    expect(tracer.traceFnStart('fake', 10, { foo: 'bar' })).toEqual(1);
    expect(tracer.stack).toEqual([1]);
  });

  test('traceFnRet', (done) => {
    tracer.stack = [1000];
    tracer.onTrev = (trev) => {
      expect(trev).toEqual({
        astId: 'fake',
        data: 'whatevs',
        id: 1,
        nodeId: 10,
        parentId: 1000,
        type: 'fn-ret',
      });
      done();
    };
    expect(tracer.traceFnRet('fake', 10, 'whatevs')).toEqual('whatevs');
    expect(tracer.stack).toEqual([]);
  });

  test('traceFnThrow', (done) => {
    const err = new Error('sleepy');
    tracer.stack = [1000];
    tracer.onTrev = (trev) => {
      expect(trev).toEqual({
        astId: 'fake',
        data: err,
        id: 1,
        nodeId: 10,
        parentId: 1000,
        type: 'fn-throw',
      });
      done();
    };
    expect(tracer.traceFnThrow('fake', 10, err)).toEqual(err);
    expect(tracer.stack).toEqual([]);
  });

  test('traceFnPause', (done) => {
    tracer.stack = [1000];
    tracer.onTrev = (trev) => {
      expect(trev).toEqual({
        astId: 'fake',
        data: 'whatevs',
        id: 1,
        nodeId: 10,
        parentId: 1000,
        type: 'fn-pause',
      });
      done();
    };
    expect(tracer.traceFnPause('fake', 10, 'whatevs')).toEqual('whatevs');
    expect(tracer.stack).toEqual([]);
  });

  test('traceFnResume', (done) => {
    tracer.onTrev = (trev) => {
      expect(trev).toEqual({
        astId: 'fake',
        data: 'whatevs',
        fnStartId: 1000,
        id: 1,
        nodeId: 10,
        type: 'fn-resume',
      });
      done();
    };
    expect(tracer.traceFnResume('fake', 10, 'whatevs', 1000)).toEqual('whatevs');
    expect(tracer.stack).toEqual([1]);
  });
});
