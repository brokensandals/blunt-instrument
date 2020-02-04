import Encoder from 'object-graph-as-json/target/cjs/Encoder';
import ArrayTrace from './ArrayTrace';

describe('ArrayTrace', () => {
  let trace;
  let callbacks;

  beforeEach(() => {
    trace = new ArrayTrace();
    callbacks = {};
    trace.attach(callbacks);
  });

  describe('onRegisterAST', () => {
    it('saves the AST', () => {
      const node = { foo: 'bar' };
      callbacks.onRegisterAST('test', node);
      expect(trace.asts.test).toBe(node);
    });

    it('invokes onChange callback', (done) => {
      const node = { foo: 'bar' };
      trace.onChange = function () { // eslint-disable-line func-names
        expect(this).toBe(trace);
        expect(trace.asts.test).toBe(node);
        done();
      };
      callbacks.onRegisterAST('test', node);
    });
  });

  describe('onTrev', () => {
    it('encodes and saves given trevs', () => {
      callbacks.onTrev({ id: 1, type: 'expr', data: 'whatevs' });
      callbacks.onTrev({ id: 2, type: 'fn-start', data: { foo: 'bar' } });
      expect(trace.trevs).toEqual([
        {
          id: 1,
          type: 'expr',
          data: 'whatevs',
        },
        {
          id: 2,
          type: 'fn-start',
          data: {
            type: 'object',
            id: '1',
            '.foo': 'bar',
          },
        },
      ]);
    });

    it('uses a custom encoder if given', () => {
      const encoder = new Encoder();
      encoder.encode({ am: 1 });
      encoder.encode({ am: 2 });
      const data = { am: 3 };
      encoder.encode(data);
      trace.encoder = encoder;
      callbacks.onTrev({ id: 1, type: 'expr', data });
      expect(trace.trevs).toEqual([{
        id: 1,
        type: 'expr',
        data: {
          type: 'object',
          id: '3',
          '.am': 3,
        },
      }]);
    });

    it('invokes onChange callback', (done) => {
      trace.onChange = function () { // eslint-disable-line func-names
        expect(this).toBe(trace);
        expect(trace.trevs).toEqual([{
          id: 1,
          type: 'expr',
          data: {
            type: 'object',
            id: '1',
            '.foo': 'bar',
          },
        }]);
        done();
      };
      callbacks.onTrev({ id: 1, type: 'expr', data: { foo: 'bar' } });
    });
  });
});
