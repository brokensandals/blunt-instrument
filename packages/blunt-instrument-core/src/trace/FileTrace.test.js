import * as fs from 'fs';
import { parseSync } from '@babel/core';
import FileTraceReader from './FileTraceReader';
import FileTraceWriter from './FileTraceWriter';
import addNodeIdsToAST from '../ast/addNodeIdsToAST';
import ASTBundle from '../ast/ASTBundle';

describe('FileTraceReader and FileTraceWriter', () => {
  const dir = 'tmp-FileTrace-test';

  beforeEach(() => {
    fs.mkdirSync(dir);
  });

  afterEach(() => {
    fs.rmdirSync(dir, { recursive: true });
  });

  test('round trip', (done) => {
    const code = 'x = { y: 1 }';
    const ast = parseSync(code);
    addNodeIdsToAST(ast);
    const astb = new ASTBundle();
    astb.add('test', ast, code);
    const trev = {
      id: 1,
      nodeId: astb.filterNodes((node) => node.codeSlice === '{ y: 1 }')[0].biId,
      astId: 'test',
      data: { y: 1 },
      type: 'expr',
    };

    const writer = new FileTraceWriter({ prefix: `${dir}/trace` });
    writer.handleRegisterAST('test', ast, code);
    writer.handleTrev(trev);
    writer.end().then(() => {
      new FileTraceReader({ path: writer.filename }).readAsTC().then((tc) => {
        expect(tc.astb).toEqual(astb);
        expect(tc.trevs).toEqual([{
          ...trev,
          data: {
            type: 'object',
            id: '1',
            '.y': 1,
          },
        }]);
        done();
      });
    });
  });
});
