import { parseSync } from '@babel/core'; // eslint-disable-line import/no-extraneous-dependencies
import addNodeIdsToAST from './addNodeIdsToAST';

describe('addNodeIdsToAST', () => {
  it('assigns an identifier to each node', () => {
    const ast = parseSync('let x = 4');
    addNodeIdsToAST(ast);
    expect(ast.biId).toEqual(1);
    expect(ast.program.biId).toEqual(2);
    expect(ast.program.body[0].biId).toEqual(3);
    expect(ast.program.body[0].declarations[0].biId).toEqual(4);
    expect(ast.program.body[0].declarations[0].id.biId).toEqual(5);
    expect(ast.program.body[0].declarations[0].init.biId).toEqual(6);
  });
});
