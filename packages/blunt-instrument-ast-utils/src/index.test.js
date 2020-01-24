import { parseSync } from '@babel/core'; // eslint-disable-line import/no-extraneous-dependencies
import {
  addNodeIdsToAST,
  attachCodeSlicesToAST,
  copyNodeIdsBetweenASTs,
  ASTQuerier,
} from './index';

describe('copyNodeIdsBetweenASTs', () => {
  it('throws an error if the trees are different sizes', () => {
    const ast1 = parseSync('x = y');
    const ast2 = parseSync('x = y()');
    expect(() => copyNodeIdsBetweenASTs(ast1, ast2)).toThrowError('Source tree has 6 nodes but destination tree has 7');
  });

  it('throws an error if the trees have different node types', () => {
    const ast1 = parseSync('x = y');
    const ast2 = parseSync('x = 4');
    expect(() => copyNodeIdsBetweenASTs(ast1, ast2)).toThrowError('Source node type Identifier does not match destination node type NumericLiteral');
  });

  it('copies node IDs', () => {
    const ast1 = parseSync('x = y');
    addNodeIdsToAST(ast1, 'test-');
    const ast2 = parseSync('x = y');
    copyNodeIdsBetweenASTs(ast1, ast2);
    expect(ast2.biId).toEqual('test-1');
    expect(ast1).toEqual(ast2);
  });
});

describe('addNodeIdsToAST', () => {
  it('assigns an identifier to each node', () => {
    const ast = parseSync('let x = 4');
    addNodeIdsToAST(ast, 'src-');
    expect(ast.biId).toEqual('src-1');
    expect(ast.program.biId).toEqual('src-2');
    expect(ast.program.body[0].biId).toEqual('src-3');
    expect(ast.program.body[0].declarations[0].biId).toEqual('src-4');
    expect(ast.program.body[0].declarations[0].id.biId).toEqual('src-5');
    expect(ast.program.body[0].declarations[0].init.biId).toEqual('src-6');
  });

  it('does not overwrite existing identifiers', () => {
    const ast = parseSync('let x = 4');
    ast.program.body[0].biId = 'src-1';
    addNodeIdsToAST(ast, 'instr-');
    expect(ast.biId).toEqual('instr-1');
    expect(ast.program.biId).toEqual('instr-2');
    expect(ast.program.body[0].biId).toEqual('src-1');
    expect(ast.program.body[0].declarations[0].biId).toEqual('instr-3');
    expect(ast.program.body[0].declarations[0].id.biId).toEqual('instr-4');
    expect(ast.program.body[0].declarations[0].init.biId).toEqual('instr-5');
  });
});

describe('attachCodeSlicesToAST', () => {
  it('assigns the code snippet to each node', () => {
    const code = 'let x = 4';
    const ast = parseSync(code);
    attachCodeSlicesToAST(ast, code);
    expect(ast.codeSlice).toEqual(code);
    expect(ast.program.codeSlice).toEqual(code);
    expect(ast.program.body[0].codeSlice).toEqual(code);
    expect(ast.program.body[0].declarations[0].codeSlice).toEqual('x = 4');
    expect(ast.program.body[0].declarations[0].id.codeSlice).toEqual('x');
    expect(ast.program.body[0].declarations[0].init.codeSlice).toEqual('4');
  });

  it('skips nodes missing start or end', () => {
    const code = 'let x = 4';
    const ast = parseSync(code);
    delete ast.program.start;
    delete ast.program.body[0].declarations[0].id.end;
    attachCodeSlicesToAST(ast, code);
    expect(ast.codeSlice).toEqual(code);
    expect(ast.program.codeSlice).toBeUndefined();
    expect(ast.program.body[0].codeSlice).toEqual(code);
    expect(ast.program.body[0].declarations[0].codeSlice).toEqual('x = 4');
    expect(ast.program.body[0].declarations[0].id.codeSlice).toBeUndefined();
    expect(ast.program.body[0].declarations[0].init.codeSlice).toEqual('4');
  });

  it('throws an error when start is negative', () => {
    const code = 'let x = 4';
    const ast = parseSync(code);
    ast.program.start = -1;
    expect(() => attachCodeSlicesToAST(ast, code)).toThrowError('Node start [-1] or end [9] is out of range');
  });

  it('throws an error when end is beyond end of code', () => {
    const code = 'let x = 4';
    const ast = parseSync(code);
    ast.program.end = 10;
    expect(() => attachCodeSlicesToAST(ast, code)).toThrowError('Node start [0] or end [10] is out of range');
  });
});

describe('ASTQuerier', () => {
  describe('constructor', () => {
    it('throws an error if any nodes are missing node IDs', () => {
      const ast = parseSync('x = 1');
      expect(() => new ASTQuerier(ast)).toThrowError('Node is missing node ID');
    });
  });

  describe('getNodeById', () => {
    it('finds the requested node', () => {
      const ast = parseSync('x = 1');
      addNodeIdsToAST(ast, 'test-');
      const astq = new ASTQuerier(ast);
      expect(astq.getNodeById('test-5').name).toEqual('x');
    });

    it('returns undefined for unknown node ID', () => {
      const ast = parseSync('x = 1');
      addNodeIdsToAST(ast, 'test-');
      const astq = new ASTQuerier(ast);
      expect(astq.getNodeById('test-100')).toBeUndefined();
    });
  });

  describe('getNodesByCodeSlice', () => {
    it('finds all matching nodes', () => {
      const code = 'x = y() + 1; z = y() + 3';
      const ast = parseSync(code);
      addNodeIdsToAST(ast, 'test-');
      attachCodeSlicesToAST(ast, code);
      const astq = new ASTQuerier(ast);
      const expected = [
        ast.program.body[0].expression.right.left,
        ast.program.body[1].expression.right.left,
      ];
      expect(astq.getNodesByCodeSlice('y()')).toEqual(expected);
    });

    it('returns empty array if no matching nodes', () => {
      const code = 'x = y() + 1; z = y() + 3';
      const ast = parseSync(code);
      addNodeIdsToAST(ast, 'test-');
      attachCodeSlicesToAST(ast, code);
      const astq = new ASTQuerier(ast);
      expect(astq.getNodesByCodeSlice('z()')).toEqual([]);
    });
  });

  describe('filterNodes', () => {
    it('returns matching nodes', () => {
      const code = 'x = y() + 123; z = 4;';
      const ast = parseSync(code);
      addNodeIdsToAST(ast, 'test-');
      attachCodeSlicesToAST(ast, code);
      const astq = new ASTQuerier(ast);
      const expected = [ast.program.body[0].expression.right.right, ast.program.body[1]];
      const actual = astq.filterNodes((node) => ['123', 'z = 4;'].includes(node.codeSlice));
      expect(actual).toEqual(expected);
    });
  });
});
