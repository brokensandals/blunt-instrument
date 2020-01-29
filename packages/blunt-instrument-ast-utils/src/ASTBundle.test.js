import { parseSync } from '@babel/core'; // eslint-disable-line import/no-extraneous-dependencies
import { toNodeKey, fromNodeKey, ASTBundle } from './ASTBundle';
import { addNodeIdsToAST, attachCodeSlicesToAST } from '.';

describe('toNodeKey', () => {
  it('escapes colons', () => {
    expect(toNodeKey('foo:bar', 10)).toEqual('foo%3Abar:10');
  });
});

describe('fromNodeKey', () => {
  it('decodes colons', () => {
    expect(fromNodeKey('foo%3Abar:10')).toEqual({ astId: 'foo:bar', nodeId: 10 });
  });
});

describe('ASTBundle', () => {
  describe('constructor', () => {
    it('throws an error if any nodes are missing node IDs', () => {
      const ast = parseSync('x = 1');
      expect(() => new ASTBundle({ test: ast })).toThrowError('Node is missing node ID');
    });

    it('adds biKey and biASTId fields', () => {
      const ast = parseSync('x = 1');
      addNodeIdsToAST(ast);
      new ASTBundle({ 'foo:bar': ast }); // eslint-disable-line no-new
      expect(ast.biASTId).toEqual('foo:bar');
      expect(ast.biKey).toEqual(toNodeKey('foo:bar', 1));
    });
  });

  describe('getNode', () => {
    it('finds the requested node', () => {
      const ast = parseSync('x = 1');
      addNodeIdsToAST(ast);
      const astb = new ASTBundle({ test: ast });
      expect(astb.getNode('test', 5).name).toEqual('x');
    });

    it('returns undefined for unknown node ID', () => {
      const ast = parseSync('x = 1');
      addNodeIdsToAST(ast);
      const astb = new ASTBundle({ test: ast });
      expect(astb.getNode('test', 100)).toBeUndefined();
    });

    it('distinguishes between ASTs', () => {
      const ast1 = parseSync('x = 1');
      const ast2 = parseSync('y = 2');
      [ast1, ast2].forEach(addNodeIdsToAST);
      const astb = new ASTBundle({ one: ast1, two: ast2 });
      expect(astb.getNode('one', 5).name).toEqual('x');
      expect(astb.getNode('two', 5).name).toEqual('y');
    });
  });

  describe('filterNodes', () => {
    it('returns matching nodes', () => {
      const code = 'x = y() + 123; z = 4;';
      const ast = parseSync(code);
      addNodeIdsToAST(ast);
      attachCodeSlicesToAST(ast, code);
      const astb = new ASTBundle({ test: ast });
      const expected = [ast.program.body[0].expression.right.right, ast.program.body[1]];
      const actual = astb.filterNodes((node) => ['123', 'z = 4;'].includes(node.codeSlice));
      expect(actual).toEqual(expected);
    });
  });
});
