import {
  addNodeIdsToAST,
  ASTQuerier,
  attachCodeSlicesToAST,
} from 'blunt-instrument-ast-utils';
import { parseSync } from '@babel/core'; // eslint-disable-line import/no-extraneous-dependencies
import { TraceQuerier } from '.';

describe('TraceQuerier', () => {
  let astQuerier;

  beforeEach(() => {
    const code = `
      let num = 1;
      function increaseNum(by) {
        num = num + by;
        return num;
      }
      increaseNum(3);
      increaseNum(3);
    `;
    const ast = parseSync(code);
    addNodeIdsToAST(ast, 'test-');
    attachCodeSlicesToAST(ast, code);
    astQuerier = new ASTQuerier(ast);
  });

  it('makes the astQuerier available', () => {
    expect(new TraceQuerier(astQuerier, []).astQuerier).toBe(astQuerier);
  });

  describe('constructor', () => {
    it('requires sequential trev IDs', () => {
      expect(() => new TraceQuerier(astQuerier,
        [{ id: 1, nodeId: 'test-1' }, { id: 3, nodeId: 'test-1' }])).toThrowError('Non-sequential trev ID 3');
    });

    it('requires valid node IDs', () => {
      expect(() => new TraceQuerier(astQuerier, [{ id: 1, nodeId: 'foo' }])).toThrowError('Trev ID 1 has unknown node ID foo');
    });
  });

  describe('trev retrieval', () => {
    let trevs;
    let traceQuerier;

    beforeEach(() => {
      trevs = [];
      trevs.push({
        id: 1,
        nodeId: astQuerier.getNodesByCodeSlice('1')[0].biId,
        type: 'expr',
        data: 1,
      });
      trevs.push({
        id: 2,
        nodeId: astQuerier.getNodesByCodeSlice('num + by')[0].biId,
        type: 'expr',
        data: 4,
      });
      trevs.push({
        id: 3,
        nodeId: astQuerier.getNodesByCodeSlice('num + by')[0].biId,
        type: 'expr',
        data: 7,
      });
      trevs.push({
        id: 4,
        nodeId: astQuerier.getNodesByCodeSlice('increaseNum(3)')[0].biId,
        type: 'expr',
        data: 4,
      });
      trevs.push({
        id: 5,
        nodeId: astQuerier.getNodesByCodeSlice('increaseNum(3)')[1].biId,
        type: 'expr',
        data: 7,
      });
      traceQuerier = new TraceQuerier(astQuerier, trevs);
    });

    describe('getTrevById', () => {
      it('returns undefined for 0', () => {
        expect(traceQuerier.getTrevById(0)).toBeUndefined();
      });

      it('returns undefined for id higher than range', () => {
        expect(traceQuerier.getTrevById(6)).toBeUndefined();
      });

      it('returns correct trev by id', () => {
        expect(traceQuerier.getTrevById(3)).toEqual({
          id: 3,
          nodeId: trevs[2].nodeId,
          type: 'expr',
          data: 7,
          extra: {
            ancestorIds: [],
            node: astQuerier.getNodesByCodeSlice('num + by')[0],
          },
        });
      });
    });

    describe('query', () => {
      it('returns all trevs', () => {
        const result = traceQuerier.query();
        expect(result.map((trev) => trev.id)).toEqual([1, 2, 3, 4, 5]);
      });

      it('returns correct details', () => {
        const result = traceQuerier.query();
        expect(result[2]).toEqual({
          id: 3,
          nodeId: trevs[2].nodeId,
          type: 'expr',
          data: 7,
          extra: {
            ancestorIds: [],
            node: astQuerier.getNodesByCodeSlice('num + by')[0],
          },
        });
      });

      describe('onlyNodeIds', () => {
        it('does not filter nodes if none are truthy', () => {
          const result = traceQuerier.query({
            filters: { onlyNodeIds: { [trevs[1].nodeId]: false } },
          });
          expect(result.map((trev) => trev.id)).toEqual([1, 2, 3, 4, 5]);
        });

        it('filters to truthy nodes', () => {
          const result = traceQuerier.query({
            filters: {
              onlyNodeIds: {
                [trevs[1].nodeId]: true,
                [trevs[3].nodeId]: false,
                [trevs[4].nodeId]: true,
              },
            },
          });
          expect(result.map((trev) => trev.id)).toEqual([2, 3, 5]);
        });

        it('supports array syntax', () => {
          const result = traceQuerier.query({
            filters: { onlyNodeIds: [trevs[1].nodeId, trevs[4].nodeId] },
          });
          expect(result.map((trev) => trev.id)).toEqual([2, 3, 5]);
        });

        it('supports string syntax', () => {
          const result = traceQuerier.query({ filters: { onlyNodeIds: trevs[1].nodeId } });
          expect(result.map((trev) => trev.id)).toEqual([2, 3]);
        });
      });

      describe('excludeNodeTypes', () => {
        it('excludes truthy node types', () => {
          const result1 = traceQuerier.query({
            filters: {
              excludeNodeTypes: {
                BinaryExpression: true,
                CallExpression: false,
              },
            },
          });
          expect(result1.map((trev) => trev.id)).toEqual([1, 4, 5]);

          const result2 = traceQuerier.query({
            filters: {
              excludeNodeTypes: {
                BinaryExpression: false,
                CallExpression: true,
              },
            },
          });
          expect(result2.map((trev) => trev.id)).toEqual([1, 2, 3]);
        });

        it('supports array syntax', () => {
          const result = traceQuerier.query({
            filters: { excludeNodeTypes: ['BinaryExpression'] },
          });
          expect(result.map((trev) => trev.id)).toEqual([1, 4, 5]);
        });

        it('supports string syntax', () => {
          const result = traceQuerier.query({ filters: { excludeNodeTypes: 'BinaryExpression' } });
          expect(result.map((trev) => trev.id)).toEqual([1, 4, 5]);
        });
      });
    });
  });
});
