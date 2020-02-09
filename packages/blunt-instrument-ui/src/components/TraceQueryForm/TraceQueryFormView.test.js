import React from 'react';
import renderer from 'react-test-renderer';
import { render, fireEvent } from '@testing-library/react'
import { parseSync } from '@babel/core';
import instrumentedEval from 'blunt-instrument-eval';
import TraceQueryFormView from './TraceQueryFormView';
import buildASTNames from '../../util/buildASTNames';

describe('TraceQueryFormView', () => {
  const code = `function fac(n) {
    return n === 1 ? 1 : n * fac(n - 1);
  }
  fac(5);`
  let tc;
  let query;
  let astNames;

  beforeEach(() => {
    tc = instrumentedEval(code).toTC().withDenormalizedInfo();
    query = {
      nodes: {},
      nodeTypes: {},
      types: {},
    };
    astNames = buildASTNames(Object.keys(tc.astb.asts));
  });
  
  test('isPlaying=true', () => {
    const result = renderer.create(
      <TraceQueryFormView isPlaying={true}
                          query={query}
                          tc={tc}
                          astNames={astNames} />).toJSON();
    expect(result).toMatchSnapshot();
  });

  test('isPlaying=false', () => {
    const result = renderer.create(
      <TraceQueryFormView isPlaying={false}
                          query={query}
                          tc={tc}
                          astNames={astNames} />).toJSON();
    expect(result).toMatchSnapshot();
  });

  test('with nodes selected', () => {
    query.nodes[tc.trevs[0].denormalized.node.biKey] = true;
    query.nodes[tc.trevs[1].denormalized.node.biKey] = true;
    const result = renderer.create(
      <TraceQueryFormView isPlaying={false}
                          query={query}
                          tc={tc}
                          astNames={astNames} />).toJSON();
    expect(result).toMatchSnapshot();
  });

  test('with node types selected', () => {
    query.nodeTypes[tc.trevs[0].denormalized.node.type] = true;
    query.nodeTypes[tc.trevs[1].denormalized.node.type] = true;
    const result = renderer.create(
      <TraceQueryFormView isPlaying={false}
                          query={query}
                          tc={tc}
                          astNames={astNames} />).toJSON();
    expect(result).toMatchSnapshot();
  });

  test('with trev types selected', () => {
    query.types['expr'] = true;
    query.types['fn-start'] = true;
    const result = renderer.create(
      <TraceQueryFormView isPlaying={false}
                          query={query}
                          tc={tc}
                          astNames={astNames} />).toJSON();
    expect(result).toMatchSnapshot();
  });

  test('multiple ASTs', () => {
    query.nodes[tc.trevs[0].denormalized.node.biKey] = true;
    astNames['bogus'] = 'bogus';
    const result = renderer.create(
      <TraceQueryFormView isPlaying={false}
                          query={query}
                          tc={tc}
                          astNames={astNames} />).toJSON();
    expect(result).toMatchSnapshot();
  });

  test('play', () => {
    const fn = jest.fn();
    const { getByText } = render(
      <TraceQueryFormView isPlaying={false}
                          query={query}
                          tc={tc}
                          astNames={astNames}
                          onPlay={fn} />
    );
    fireEvent.click(getByText('▶'));
    expect(fn).toHaveBeenCalled();
  });

  test('stop', () => {
    const fn = jest.fn();
    const { getByText } = render(
      <TraceQueryFormView isPlaying={true}
                          query={query}
                          tc={tc}
                          astNames={astNames}
                          onStop={fn} />
    );
    fireEvent.click(getByText('⏹'));
    expect(fn).toHaveBeenCalled();
  });

  // TODO test interaction with react-select
});
