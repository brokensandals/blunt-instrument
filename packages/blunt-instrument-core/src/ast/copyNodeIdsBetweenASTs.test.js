import { parseSync } from '@babel/core'; // eslint-disable-line import/no-extraneous-dependencies
import copyNodeIdsBetweenASTs from './copyNodeIdsBetweenASTs';
import addNodeIdsToAST from './addNodeIdsToAST';

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
    addNodeIdsToAST(ast1);
    const ast2 = parseSync('x = y');
    copyNodeIdsBetweenASTs(ast1, ast2);
    expect(ast2.biId).toEqual(1);
    expect(ast1).toEqual(ast2);
  });
});
