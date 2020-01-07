
import { getNodeId, setNodeId, copyNodeId, annotateWithNodeIds, annotateWithCode, copyNodeIds, ASTQuerier } from './index';
import { parseSync } from '@babel/core';

describe('getNodeId', () => {
  it('returns null when "extra" field is missing', () => {
    const node = {};
    expect(getNodeId(node)).toBeNull();
  });

  it('returns null when "biNodeId" field is missing', () => {
    const node = { extra: { foo: 'bar' }};
    expect(getNodeId(node)).toBeNull();
  });

  it('returns extra.biNodeId field', () => {
    const node = { extra: { biNodeId: 'test-1' }};
    expect(getNodeId(node)).toEqual('test-1');
  });
});

describe('setNodeId', () => {
  it('creates the "extra" field when missing', () => {
    const node = {};
    setNodeId(node, 'test-1');
    expect(node.extra.biNodeId).toEqual('test-1');
  });

  it('uses an existing "extra" field', () => {
    const node = { extra: { foo: 'bar'} };
    setNodeId(node, 'test-1');
    expect(node.extra.biNodeId).toEqual('test-1');
    expect(node.extra.foo).toEqual('bar');
  });
});

describe('copyNodeId', () => {
  it('overwrites with null when source node has no node ID', () => {
    const from = {};
    const to = {};
    setNodeId(to, 'test-1');
    copyNodeId(from, to);
    expect(getNodeId(to)).toBeNull();
  });

  it('copies the source node ID', () => {
    const from = {};
    const to = {};
    setNodeId(from, 'test-1');
    copyNodeId(from, to);
    expect(getNodeId(to)).toEqual('test-1');
  });
});

describe('copyNodeIds', () => {
  it('throws an error if the trees are different sizes', () => {
    const ast1 = parseSync('x = y');
    const ast2 = parseSync('x = y()');
    expect(() => copyNodeIds(ast1, ast2)).toThrowError('Source tree has 6 nodes but destination tree has 7');
  });

  it('throws an error if the trees have different node types', () => {
    const ast1 = parseSync('x = y');
    const ast2 = parseSync('x = 4');
    expect(() => copyNodeIds(ast1, ast2)).toThrowError('Source and destination tree nodes do not match');
  });

  it('copies node IDs', () => {
    const ast1 = parseSync('x = y');
    annotateWithNodeIds(ast1, 'test-');
    const ast2 = parseSync('x = y');
    copyNodeIds(ast1, ast2);
    expect(getNodeId(ast2)).toEqual('test-1');
    expect(ast1).toEqual(ast2);
  });
});

describe('annotateWithNodeIds', () => {
  it('assigns an identifier to each node', () => {
    const ast = parseSync('let x = 4');
    annotateWithNodeIds(ast, 'src-');
    expect(getNodeId(ast)).toEqual('src-1');
    expect(getNodeId(ast.program)).toEqual('src-2');
    expect(getNodeId(ast.program.body[0])).toEqual('src-3');
    expect(getNodeId(ast.program.body[0].declarations[0])).toEqual('src-4');
    expect(getNodeId(ast.program.body[0].declarations[0].id)).toEqual('src-5');
    expect(getNodeId(ast.program.body[0].declarations[0].init)).toEqual('src-6');
  });

  it('does not overwrite existing identifiers', () => {
    const ast = parseSync('let x = 4');
    setNodeId(ast.program.body[0], 'src-1');
    annotateWithNodeIds(ast, 'instr-');
    expect(getNodeId(ast)).toEqual('instr-1');
    expect(getNodeId(ast.program)).toEqual('instr-2');
    expect(getNodeId(ast.program.body[0])).toEqual('src-1');
    expect(getNodeId(ast.program.body[0].declarations[0])).toEqual('instr-3');
    expect(getNodeId(ast.program.body[0].declarations[0].id)).toEqual('instr-4');
    expect(getNodeId(ast.program.body[0].declarations[0].init)).toEqual('instr-5');
  });
});

describe('annotateWithCode', () => {
  it('assigns the code snippet to each node', () => {
    const code = 'let x = 4';
    const ast = parseSync(code);
    annotateWithCode(ast, code);
    expect(ast.extra.code).toEqual(code);
    expect(ast.program.extra.code).toEqual(code);
    expect(ast.program.body[0].extra.code).toEqual(code);
    expect(ast.program.body[0].declarations[0].extra.code).toEqual('x = 4');
    expect(ast.program.body[0].declarations[0].id.extra.code).toEqual('x');
    expect(ast.program.body[0].declarations[0].init.extra.code).toEqual('4');
  });

  it('skips nodes missing start or end', () => {
    const code = 'let x = 4';
    const ast = parseSync(code);
    delete ast.program.start;
    delete ast.program.body[0].declarations[0].id.end;
    annotateWithCode(ast, code);
    expect(ast.extra.code).toEqual(code);
    expect(ast.program.extra).toBeUndefined();
    expect(ast.program.body[0].extra.code).toEqual(code);
    expect(ast.program.body[0].declarations[0].extra.code).toEqual('x = 4');
    expect(ast.program.body[0].declarations[0].id.extra).toBeUndefined();
    expect(ast.program.body[0].declarations[0].init.extra.code).toEqual('4');
  });

  it('throws an error when start is negative', () => {
    const code = 'let x = 4';
    const ast = parseSync(code);
    ast.program.start = -1;
    expect(() => annotateWithCode(ast, code)).toThrowError('Node start [-1] or end [9] is out of range');
  });

  it('throws an error when end is beyond end of code', () => {
    const code = 'let x = 4';
    const ast = parseSync(code);
    ast.program.end = 10;
    expect(() => annotateWithCode(ast, code)).toThrowError('Node start [0] or end [10] is out of range');
  });
});

describe('ASTQuerier', () => {
  describe('constructor', () => {
    it('throws an error if any nodes are missing node IDs', () => {
      const ast = parseSync('x = 1');
      expect(() => new ASTQuerier(ast)).toThrowError('Node is missing node ID');
    });
  });

  describe('nodesById', () => {
    it('contains map of nodes by ID', () => {
      const ast = parseSync('x = 1');
      annotateWithNodeIds(ast, 'test-');
      const astq = new ASTQuerier(ast);
      expect(astq.nodesById.size).toEqual(6);
      expect(astq.nodesById.get('test-5').name).toEqual('x');
    });
  });
});
