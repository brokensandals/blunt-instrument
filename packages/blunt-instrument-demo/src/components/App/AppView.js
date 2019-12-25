import React from 'react';
import './App.css';
import { instrumentedEval } from 'blunt-instrument-eval';
import ASTNav from '../ASTNav';

const sampleCode = `function fac(n) {
  return n == 1 ? 1 : n * fac(n - 1);
}
fac(3);`;

function AppView() {
  const querier = instrumentedEval(sampleCode);
  return (
    <div className="App">
      <ASTNav ast={querier.astq.ast} />
      <div className="blurb">
        created by <a href="https://brokensandals.net">brokensandals</a> | source code on <a href="https://github.com/brokensandals/blunt-instrument">github</a>
      </div>
    </div>
  );
}

export default AppView;
