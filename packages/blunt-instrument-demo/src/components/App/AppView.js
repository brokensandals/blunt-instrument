import React from 'react';
import './App.css';
import { bluntInstrumentPlugin } from 'blunt-instrument-babel-plugin'
import { TraceQuerier } from 'blunt-instrument-querier'

const sampleCode = `function insertionSort(array) {
  let shifts = 0;

  for (let i = 0; i < array.length; i++) {
    for (let j = i - 1; j >= 0; j--) {
      if (array[j] <= array[j + 1]) {
        break;
      }

      shifts++;
      const tmp = array[j + 1];
      array[j + 1] = array[j];
      array[j] = tmp;
    }
  }

  return shifts;
}`;

function AppView() {
  return (
    <div className="App">
      <div className="blurb">
        created by <a href="https://brokensandals.net">brokensandals</a> | source code on <a href="https://github.com/brokensandals/blunt-instrument">github</a>
      </div>
    </div>
  );
}

export default AppView;
