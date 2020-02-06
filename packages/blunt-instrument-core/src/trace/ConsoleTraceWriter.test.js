import addNodeIdsToAST from '../ast/addNodeIdsToAST';
import attachCodeSlicesToAST from '../ast/attachCodeSlicesToAST';
import ConsoleTraceWriter from './ConsoleTraceWriter';
import traverseAST from '../ast/traverseAST';
import { parseSync } from '@babel/core'; // eslint-next-line import/no-extraneous-dependencies

describe('ConsoleTraceWriter', () => {
  let spyLog;
  let spyDir;
  let writer;
  let callbacks;

  beforeEach(() => {
    spyLog = jest.spyOn(console, 'log').mockImplementation();
    spyDir = jest.spyOn(console, 'dir').mockImplementation();
    writer = new ConsoleTraceWriter();
    callbacks = {};
    writer.attach(callbacks);
  });

  afterEach(() => {
    spyLog.mockRestore();
    spyDir.mockRestore();
  });

  it('handles trevs for unknown nodes gracefully', () => {
    const trev = { id: 1, astId: 'bogus', nodeId: 1 };
    callbacks.onTrev(trev);
    expect(spyLog.mock.calls).toEqual([['onTrev trev:']]);
    expect(spyDir.mock.calls).toEqual([[trev]]);
  });

  it('logs ASTs', () => {
    const ast = { type: 'Identifier', biId: 1 };
    callbacks.onRegisterAST('test', ast);
    expect(spyLog.mock.calls).toEqual([['onRegisterAST id [test] AST:']]);
    expect(spyDir.mock.calls).toEqual([[ast]]);
  });

  it('logs trev line/column', () => {
    const code = `const x = 1;
const y = x + 1;
const z = y - 2`;
    const ast = parseSync(code);
    addNodeIdsToAST(ast);
    let target;
    traverseAST(ast, (node) => {
      if (node.start === code.indexOf('x + 1')
          && node.end === code.indexOf('x + 1') + 'x + 1'.length) {
        target = node;
      }
    });

    callbacks.onRegisterAST('test', ast);
    const trev = { id: 1, astId: 'test', nodeId: target.biId };
    callbacks.onTrev(trev);

    expect(spyLog).toHaveBeenCalledTimes(2);
    expect(spyLog).toHaveBeenLastCalledWith('onTrev loc [2:10] trev:');
    expect(spyDir).toHaveBeenCalledTimes(2);
    expect(spyDir).toHaveBeenLastCalledWith(trev);
  });

  it('logs trev code', () => {
    const code = `const x = 1;
const y = x + 1;
const z = y - 2`;
    const ast = parseSync(code);
    addNodeIdsToAST(ast);
    let target;
    traverseAST(ast, (node) => {
      if (node.start === code.indexOf('x + 1')
          && node.end === code.indexOf('x + 1') + 'x + 1'.length) {
        target = node;
      }
    });
    attachCodeSlicesToAST(ast, code);

    callbacks.onRegisterAST('test', ast);
    const trev = { id: 1, astId: 'test', nodeId: target.biId };
    callbacks.onTrev(trev);

    expect(spyLog).toHaveBeenCalledTimes(2);
    expect(spyLog).toHaveBeenLastCalledWith('onTrev loc [2:10] code [x + 1] trev:');
    expect(spyDir).toHaveBeenCalledTimes(2);
    expect(spyDir).toHaveBeenLastCalledWith(trev);
  });
});
