import findChildNodes from './findChildNodes';
import * as types from '@babel/types';

describe('findChildNodes', () => {
  test('no children', () => {
    expect(findChildNodes(types.booleanLiteral(false))).toEqual([]);
  });

  test('only direct children', () => {
    const id = types.identifier('foo');
    const n1 = types.numericLiteral(1);
    const n2 = types.numericLiteral(2);
    const plus = types.binaryExpression('+', n1, n2);
    const node = types.assignmentExpression('=', id, plus);
    expect(findChildNodes(node)).toEqual([id, plus]);
  });

  test('children in array', () => {
    const statement = types.emptyStatement();
    const node = types.blockStatement([statement]);
    expect(findChildNodes(node)).toEqual([statement]);
  });

  test('children in nested objects', () => {
    const child = types.identifier('bar');
    const node = types.identifier('foo');
    // I'm going to be real honest with you, I'm testing this with a fake case because I wrote
    // the code a while ago and neither remember what the real case for it was nor care enough
    // to figure it out.
    node.blah = { foo: child };
    expect(findChildNodes(node)).toEqual([child]);
  });
});
