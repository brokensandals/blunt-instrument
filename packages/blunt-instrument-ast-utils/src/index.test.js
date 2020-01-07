
import { getNodeId, setNodeId, copyNodeId, annotateWithNodeIds } from './index';
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
