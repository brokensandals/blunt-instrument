import { Encoder } from 'object-graph-as-json';
import ArrayTrace from './ArrayTrace';

describe('ArrayTrace', () => {
  let trace;

  beforeEach(() => {
    trace = new ArrayTrace();
  });

  describe('handleRegisterAST', () => {
    it('saves the AST', () => {
      const node = { foo: 'bar' };
      trace.handleRegisterAST('test', node);
      expect(trace.astb.asts.test).toEqual(node);
    });

    it('invokes onChange callback', (done) => {
      const node = { foo: 'bar' };
      trace.onChange = function () { // eslint-disable-line func-names
        expect(this).toBe(trace);
        expect(trace.astb.asts.test).toEqual(node);
        done();
      };
      trace.handleRegisterAST('test', node);
    });
  });

  describe('handleTrev', () => {
    it('encodes and saves given trevs', () => {
      trace.handleTrev({ id: 1, type: 'expr', data: 'whatevs' });
      trace.handleTrev({ id: 2, type: 'fn-start', data: { foo: 'bar' } });
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
      trace.handleTrev({ id: 1, type: 'expr', data });
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
      trace.handleTrev({ id: 1, type: 'expr', data: { foo: 'bar' } });
    });
  });
});
