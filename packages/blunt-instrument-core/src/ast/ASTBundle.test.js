import { parseSync } from '@babel/core'; // eslint-disable-line import/no-extraneous-dependencies
import addNodeIdsToAST from './addNodeIdsToAST';
import ASTBundle from './ASTBundle';
import toNodeKey from './toNodeKey';
import traverseAST from './traverseAST';

describe('ASTBundle', () => {
  describe('add', () => {
    it('throws an error if any nodes are missing node IDs', () => {
      const ast = parseSync('x = 1');
      expect(() => new ASTBundle().add(test, ast, 'x = 1')).toThrowError('Node is missing node ID');
    });

    it('adds biKey and biASTId fields', () => {
      const ast = parseSync('x = 1');
      addNodeIdsToAST(ast);
      const astb = new ASTBundle();
      astb.add('foo:bar', ast, 'x = 1');
      expect(astb.asts['foo:bar'].biASTId).toEqual('foo:bar');
      expect(astb.asts['foo:bar'].biKey).toEqual(toNodeKey('foo:bar', 1));
    });
  });

  describe('getNode', () => {
    it('finds the requested node', () => {
      const ast = parseSync('x = 1');
      addNodeIdsToAST(ast);
      const astb = new ASTBundle();
      astb.add('test', ast, 'x = 1');
      expect(astb.getNode('test', 5).name).toEqual('x');
    });

    it('returns undefined for unknown node ID', () => {
      const ast = parseSync('x = 1');
      addNodeIdsToAST(ast);
      const astb = new ASTBundle();
      astb.add('test', ast, 'x = 1');
      expect(astb.getNode('test', 100)).toBeUndefined();
    });

    it('distinguishes between ASTs', () => {
      const ast1 = parseSync('x = 1');
      const ast2 = parseSync('y = 2');
      [ast1, ast2].forEach(addNodeIdsToAST);
      const astb = new ASTBundle();
      astb.add('one', ast1, 'x = 1');
      astb.add('two', ast2, 'y = 2');
      expect(astb.getNode('one', 5).name).toEqual('x');
      expect(astb.getNode('two', 5).name).toEqual('y');
    });
  });

  describe('filterNodes', () => {
    it('returns matching nodes', () => {
      const code = 'x = y() + 123; z = 4;';
      const ast = parseSync(code);
      addNodeIdsToAST(ast);
      const astb = new ASTBundle();
      astb.add('test', ast, 'x = y() + 123; z = 4;');
      const expected = [ast.program.body[0].expression.right.right, ast.program.body[1]];
      const actual = astb.filterNodes((node) => ['123', 'z = 4;'].includes(node.codeSlice));
      traverseAST(actual, (node) => {
        delete node.biASTId; // eslint-disable-line no-param-reassign
        delete node.biKey; // eslint-disable-line no-param-reassign
        delete node.codeSlice; // eslint-disable-line no-param-reassign
      });
      expect(actual).toEqual(expected);
    });
  });
});
