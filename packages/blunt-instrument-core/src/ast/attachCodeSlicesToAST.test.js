import { parseSync } from '@babel/core'; // eslint-disable-line import/no-extraneous-dependencies
import attachCodeSlicesToAST from './attachCodeSlicesToAST';

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
