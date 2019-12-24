import React from 'react';
import './App.css';
import { instrumentedEval } from 'blunt-instrument-eval';

const sampleCode = `function fac(n) {
  return n == 1 ? 1 : n * fac(n - 1);
}`;

function AppView() {
  instrumentedEval(sampleCode);
  return (
    <div className="App">
      <div className="blurb">
        created by <a href="https://brokensandals.net">brokensandals</a> | source code on <a href="https://github.com/brokensandals/blunt-instrument">github</a>
      </div>
    </div>
  );
}

export default AppView;
