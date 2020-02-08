import React from 'react';
import renderer from 'react-test-renderer';
import { parseSync } from '@babel/core';
import { addNodeIdsToAST, ASTBundle } from 'blunt-instrument-core';
import AnnotatedCodeView from './AnnotatedCodeView';

describe('AnnotatedCodeView', () => {
  const code = `function fac(n) {
    return n === 1 ? 1 : n * fac(n - 1);
  }`;
  let ast;
  let astb;

  beforeEach(() => {
    ast = parseSync(code);
    addNodeIdsToAST(ast);
    astb = new ASTBundle();
    astb.add('test', ast, code);
    ast = astb.asts.test;
  })

  test('nothing highlighted or selected', () => {
    const result = renderer.create(<AnnotatedCodeView ast={ast} />).toJSON();
    expect(result).toMatchSnapshot();
  });

  test('with a node highlighted', () => {
    const result = renderer.create(
      <AnnotatedCodeView ast={ast} highlightedNodeKey="test:5" />).toJSON();
    expect(result).toMatchSnapshot();
  });

  test('with nodes selected', () => {
    const result = renderer.create(
      <AnnotatedCodeView ast={ast} selectedNodeKeys={['test:5', 'test:8']} />).toJSON();
    expect(result).toMatchSnapshot();
  });
});
