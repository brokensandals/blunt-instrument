import { parseSync } from '@babel/core'; // eslint-disable-line import/no-extraneous-dependencies
import addNodeIdsToAST from '../ast/addNodeIdsToAST';
import ASTBundle from '../ast/ASTBundle';
import TrevCollection from './TrevCollection';

describe('TrevCollection', () => {
  test('getTrev', () => {
    const trevs = [{ id: 5, data: 'a' }, { id: 1, data: 'b' }];
    const tc = new TrevCollection(trevs);
    expect(tc.trevs).toBe(trevs);
    expect(tc.getTrev(1)).toBe(trevs[1]);
    expect(tc.getTrev(5)).toBe(trevs[0]);
  });

  test('filter', () => {
    const trevs = [{ id: 5, data: 'a' }, { id: 1, data: 'b' }];
    const astb = new ASTBundle();
    const tc = new TrevCollection(trevs, astb);
    const tc2 = tc.filter((trev) => trev.data === 'a');
    expect(tc2.trevs).toEqual([trevs[0]]);
    expect(tc2.astb).toBe(astb);
  });

  test('getFacets', () => {
    const ast = parseSync('x = 10; y = 12');
    addNodeIdsToAST(ast);
    const astb = new ASTBundle();
    astb.add('one', ast, 'x = 10; y = 12');
    const node1 = astb.getNode('one', ast.program.body[0].expression.biId);
    const node2 = astb.getNode('one', ast.program.body[0].expression.right.biId);
    const node3 = astb.getNode('one', ast.program.body[1].expression.right.biId);
    const trevs = [
      {
        id: 1,
        astId: 'one',
        nodeId: node1.biId,
        type: 'expr',
      },
      {
        id: 2,
        astId: 'bogus',
        nodeId: node1.biId,
        type: 'expr',
      },
      {
        id: 3,
        astId: 'one',
        nodeId: node2.biId,
        type: 'expr',
      },
      {
        id: 4,
        astId: 'one',
        nodeId: node1.biId,
        type: 'expr',
      },
      {
        id: 5,
        astId: 'one',
        nodeId: node3.biId,
        type: 'fn-start', // not valid for this node type, but fine for testing
      },
    ];
    const facets = new TrevCollection(trevs, astb).getFacets();
    expect(facets.nodes.get(node1)).toEqual(2);
    expect(facets.nodes.get(node2)).toEqual(1);
    expect(facets.nodes.get(node3)).toEqual(1);
    expect(facets.nodeTypes.get('AssignmentExpression')).toEqual(2);
    expect(facets.nodeTypes.get('NumericLiteral')).toEqual(2);
    expect(facets.types.get('expr')).toEqual(3);
    expect(facets.types.get('fn-start')).toEqual(1);
  });

  describe('withDenormalizedInfo', () => {
    let ast;
    let astb;

    beforeEach(() => {
      const code = `function pow(x, n) {
        return n === 1 ? x : x * pow(x, n - 1);
      }
      pow(2, 3);`;
      ast = parseSync(code);
      addNodeIdsToAST(ast);
      astb = new ASTBundle();
      astb.add('test', ast, code);
    });

    it('throws error for invalid parentId', () => {
      const trevs = [{
        id: 2,
        parentId: 1,
        astId: 'test',
        nodeId: 1,
      }];
      const tc = new TrevCollection(trevs, astb);
      expect(() => tc.withDenormalizedInfo()).toThrowError('Trev has invalid parentId [1]');
    });

    it('throws error for invalid astId', () => {
      const trevs = [{
        id: 2,
        astId: 'bogus',
        nodeId: 1,
      }];
      const tc = new TrevCollection(trevs, astb);
      expect(() => tc.withDenormalizedInfo()).toThrowError('Trev id [2] has unknown node id [1] for AST id [bogus]');
    });

    it('throws error for invalid nodeId', () => {
      const trevs = [{
        id: 2,
        astId: 'test',
        nodeId: 1000,
      }];
      const tc = new TrevCollection(trevs, astb);
      expect(() => tc.withDenormalizedInfo()).toThrowError('Trev id [2] has unknown node id [1000] for AST id [test]');
    });

    it('populates `node`', () => {
      const trevs = [{
        id: 2,
        astId: 'test',
        nodeId: 3,
      }];
      const tc = new TrevCollection(trevs, astb).withDenormalizedInfo();
      expect(tc.trevs[0]).not.toBe(trevs[0]);
      expect(tc.trevs[0].denormalized.node).toBe(astb.getNode('test', ast.program.body[0].biId));
    });

    it('populates `ancestorIds`', () => {
      const trevs = [
        {
          id: 2,
          parentId: 1,
          astId: 'test',
          nodeId: 5,
        },
        {
          id: 3,
          astId: 'test',
          nodeId: 3,
        },
        {
          id: 1,
          parentId: 3,
          astId: 'test',
          nodeId: 3,
        },
      ];
      const tc = new TrevCollection(trevs, astb).withDenormalizedInfo();
      expect(tc.trevs[0]).not.toBe(trevs[0]);
      expect(tc.trevs[0].denormalized.ancestorIds).toEqual([3, 1]);
      expect(tc.trevs[1].denormalized.ancestorIds).toEqual([]);
      expect(tc.trevs[2].denormalized.ancestorIds).toEqual([3]);
    });

    it('populates `children`', () => {
      const trevs = [
        {
          id: 1,
          astId: 'test',
          nodeId: 5,
        },
        {
          id: 2,
          parentId: 1,
          astId: 'test',
          nodeId: 3,
        },
        {
          id: 3,
          parentId: 2,
          astId: 'test',
          nodeId: 3,
        },
        {
          id: 4,
          parentId: 1,
          astId: 'test',
          nodeId: 2,
        },
      ];
      const tc = new TrevCollection(trevs, astb).withDenormalizedInfo();
      expect(tc.getTrev(1).denormalized.children).toHaveLength(2);
      expect(tc.getTrev(1).denormalized.children[0]).toBe(tc.getTrev(2));
      expect(tc.getTrev(1).denormalized.children[1]).toBe(tc.getTrev(4));
      expect(tc.getTrev(2).denormalized.children).toHaveLength(1);
      expect(tc.getTrev(2).denormalized.children[0]).toBe(tc.getTrev(3));
      expect(tc.getTrev(3).denormalized.children).toEqual([]);
      expect(tc.getTrev(4).denormalized.children).toEqual([]);
    });
  });

  test('withoutDenormalizedInfo', () => {
    const ast = parseSync('x = 10');
    addNodeIdsToAST(ast);
    const astb = new ASTBundle();
    astb.add('test', ast, 'x = 10');
    const trevs = [{ id: 1, astId: 'test', nodeId: 1 }];
    const tc1 = new TrevCollection(trevs, astb);
    const tc2 = tc1.withDenormalizedInfo();
    const tc3 = tc2.withoutDenormalizedInfo();
    expect(tc2.trevs).not.toEqual(tc1.trevs);
    expect(tc3.trevs).toEqual(tc1.trevs);
  });

  test('saving and loading', () => {
    const ast = parseSync('x = 10');
    addNodeIdsToAST(ast);
    const astb = new ASTBundle();
    astb.add('test', ast, 'x = 10');
    const trevs = [{ id: 1, astId: 'test', nodeId: 1 }];
    const tc = new TrevCollection(trevs, astb).withDenormalizedInfo();
    const stringified = JSON.stringify(tc.asJSON());
    const parsed = JSON.parse(stringified);
    const tc2 = TrevCollection.fromJSON(parsed);
    expect(tc2.astb.asts.test).toEqual(astb.asts.test);
    expect(tc2.trevs).toEqual(trevs);
  });
});
