import React from 'react';
import renderer from 'react-test-renderer';
import { render, fireEvent } from '@testing-library/react'
import instrumentedEval from 'blunt-instrument-eval';
import TrevTableView from './TrevTableView';

describe('TrevTableView', () => {
  const code = `function fac(n) {
    return n === 1 ? 1 : n * fac(n - 1);
  }
  fac(2);`
  let tc;

  beforeEach(() => {
    tc = instrumentedEval(code).toTC().withDenormalizedInfo();
  });

  test('nothing highlighted', () => {
    const result = renderer.create(<TrevTableView trevs={tc.trevs} />).toJSON();
    expect(result).toMatchSnapshot();
  });

  test('highlighted trev', () => {
    const result = renderer.create(<TrevTableView trevs={tc.trevs} highlightedTrevId={1} />).toJSON();
    expect(result).toMatchSnapshot();
  });

  test('highlighted node', () => {
    const result = renderer.create(<TrevTableView trevs={tc.trevs} highlightedNodeKey={tc.trevs[0].denormalized.node.biKey} />).toJSON();
    expect(result).toMatchSnapshot();
  });

  test('hover', () => {
    const fn = jest.fn();
    const { getByText } = render(<TrevTableView trevs={tc.trevs} onHoveredTrevChange={fn} />);
    fireEvent.mouseOver(getByText('20'));
    expect(fn).toHaveBeenCalledWith(20);
  });

  test('click node', () => {
    const fn = jest.fn();
    const { getByText } = render(<TrevTableView trevs={tc.trevs} onNodeSelectedToggle={fn} />);
    fireEvent.click(getByText('fac(n - 1)'));
    expect(fn).toHaveBeenCalledWith(tc.astb.filterNodes((node) => node.codeSlice === 'fac(n - 1)')[0].biKey);
  });

  test('click type', () => {
    const fn = jest.fn();
    const { getAllByText } = render(<TrevTableView trevs={tc.trevs} onTrevTypeSelectedToggle={fn} />);
    fireEvent.click(getAllByText('expr')[0]);
    expect(fn).toHaveBeenCalledWith('expr');
  })

  // TODO test for clicking data
});
