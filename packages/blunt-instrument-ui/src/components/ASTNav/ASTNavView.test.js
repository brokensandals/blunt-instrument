import React from 'react';
import renderer from 'react-test-renderer';
import { render, fireEvent } from '@testing-library/react'
import { parseSync } from '@babel/core';
import { addNodeIdsToAST, ASTBundle } from 'blunt-instrument-core';
import ASTNavView from './ASTNavView';

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
    const result = renderer.create(<ASTNavView ast={ast} />).toJSON();
    expect(result).toMatchSnapshot();
  });

  test('with a node highlighted', () => {
    const result = renderer.create(
      <ASTNavView ast={ast} highlightedNodeKey="test:5" />).toJSON();
    expect(result).toMatchSnapshot();
  });

  test('with nodes selected', () => {
    const result = renderer.create(
      <ASTNavView ast={ast} selectedNodeKeys={['test:5', 'test:8']} />).toJSON();
    expect(result).toMatchSnapshot();
  });

  test('hovering', () => {
    const fn = jest.fn();
    const { getByText } = render(<ASTNavView ast={ast} onHoveredNodeChange={fn} />);
    fireEvent.mouseOver(getByText(/ReturnStatement/));
    expect(fn).toHaveBeenCalledWith(astb.filterNodes(
      (node) => node.codeSlice === 'return n === 1 ? 1 : n * fac(n - 1);')[0].biKey);
  });

  test('selecting', () => {
    const fn = jest.fn();
    const { getByText } = render(<ASTNavView ast={ast} onNodeSelectedToggle={fn} />);
    fireEvent.click(getByText(/ReturnStatement/));
    expect(fn).toHaveBeenCalledWith(astb.filterNodes(
      (node) => node.codeSlice === 'return n === 1 ? 1 : n * fac(n - 1);')[0].biKey);
  });
});
