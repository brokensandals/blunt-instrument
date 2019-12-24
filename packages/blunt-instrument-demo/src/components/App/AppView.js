import React from 'react';
import './App.css';
import { bluntInstrumentPlugin } from 'blunt-instrument-babel-plugin'

function AppView() {
  return (
    <div className="App">
      <div className="blurb">
        created by <a href="https://brokensandals.net">brokensandals</a> | source code on <a href="https://github.com/brokensandals/js-syntaxtree-explorer">github</a>
      </div>
    </div>
  );
}

export default AppView;
