import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import AppContainer from './AppContainer';
import instrumentedEval from 'blunt-instrument-eval';

describe('AppContainer', () => {
  it('renders', () => {
    render(<AppContainer />);
  });

  it('runs code entered by user', () => {
    const { getByText, getAllByText, getByTitle } = render(<AppContainer />);
    const input = getByTitle('Enter source code to run');
    fireEvent.change(input, {
      target: {
        value: 'const x = 100 * 9999',
      },
    });
    getAllByText('Run')[1].click();
    expect(getByText('999900')).toBeInTheDocument();
    expect(getByText('Ran successfully.')).toBeInTheDocument();
  });

  it('handles invalid code gracefully', () => {
    const { getByText, getAllByText, getByTitle } = render(<AppContainer />);
    const input = getByTitle('Enter source code to run');
    fireEvent.change(input, {
      target: {
        value: '/fail',
      },
    });
    
    const oldlog = console.log;
    console.log = () => {}; // don't let the error be logged to the console
    try {
      getAllByText('Run')[1].click();
    } finally {
      console.log = oldlog;
    }
    expect(getByText(/SyntaxError/)).toBeInTheDocument();
  });

  it('handles uncaught exception gracefully', () => {
    const { getByText, getAllByText, queryByText, getByTitle } = render(<AppContainer />);
    const input = getByTitle('Enter source code to run');
    fireEvent.change(input, {
      target: {
        value: 'const x = 100 * 9999; throw new Error("stop"); const y = 100 * 8888',
      },
    });
    getAllByText('Run')[1].click();
    expect(getByText('999900')).toBeInTheDocument();
    expect(queryByText('888800')).toBeNull();
    expect(getByText('Ran and received error: Error: stop')).toBeInTheDocument();
  });

  it('runs example selected by user', () => {
    const { getByText, getByTitle, queryAllByText } = render(<AppContainer />);
    const input = getByTitle('Choose an example');
    fireEvent.change(input, {
      target: {
        value: 'fizzBuzzGenerator',
      },
    });
    expect(queryAllByText('"FizzBuzz"').length > 0).toBeTruthy();
    expect(getByText('Ran successfully.')).toBeInTheDocument();
  });

  it('loads TrevCollection json from clipboard', () => {
    const { getByText, getAllByText, getByLabelText } = render(<AppContainer />);
    getByText('Load').click();
    const json = JSON.stringify(instrumentedEval('const x = 25 * 4 * 200').toTC().asJSON());
    window.clipboardData = { getData() { return json } };
    fireEvent.paste(getByLabelText(/Paste the JSON here/));
    expect(getByText('20000')).toBeInTheDocument();
    expect(getByText('Loaded trace successfully.')).toBeInTheDocument();
  });

  it('loads FileTraceWriter output from clipboard', () => {
    // TODO should use real FileTraceWriter output instead
    const code = 'const x = 25 * 4 * 200';
    const tc = instrumentedEval(code).toTC();
    const ast = tc.astb.asJSON().asts.eval;
    const lines = [];
    lines.push(JSON.stringify({ astId: 'one.js', ast, code }));
    tc.trevs.forEach((trev) => lines.push(JSON.stringify({ ...trev, astId: 'one.js' })));
    lines.push(JSON.stringify({ astId: 'bogus.js', ast, code }));
    
    const { getByText, getByLabelText } = render(<AppContainer />);
    getByText('Load').click();
    window.clipboardData = { getData() { return lines.join('\n' )}};
    fireEvent.paste(getByLabelText(/Paste the JSON here/));
    expect(getByText('Loaded trace successfully.')).toBeInTheDocument();
    expect(getByText('20000')).toBeInTheDocument();
  });

  // TODO test save to clipboard

  // TODO test save to / load from files
});
