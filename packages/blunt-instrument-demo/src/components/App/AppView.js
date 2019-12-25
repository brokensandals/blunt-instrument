import React from 'react';
import './App.css';
import AnnotatedSource from '../AnnotatedSource';
import ASTNav from '../ASTNav';

export const examples = {
  factorial: `function fac(n) {
  return n == 1 ? 1 : n * fac(n - 1);
}
fac(3);`,
  insertionSort: `function insertionSort(array) {
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
}
insertionSort([3, 1, 2, 5, 4])`,
};

function AppView({
  ast,
  highlightedNodeId,
  onHoveredNodeChange,
  onRun,
  onSourceDraftChange,
  runError,
  source,
  sourceDraft,
}) {
  function runHandler(source) {
    return (event) => {
      event.preventDefault();
      onRun(source);
    }
  }

  const handleSourceDraftChange =
    (event) => onSourceDraftChange(event.target.value);
  
  const exampleLinks = Object.keys(examples).map(key => 
    <button onClick={runHandler(examples[key])}>{key}</button>);

  return (
    <div className="App">
      <form className="source-form">
        <p className="instructions">
          Enter javascript code here, then click "Run" to see the trace.
          Or, choose an example:
          {exampleLinks}
        </p>
        <textarea value={sourceDraft} onChange={handleSourceDraftChange} />
        {runError ? <p className="error">{runError.toString()}</p> : null}
        <button className="run" onClick={runHandler(sourceDraft)}>Run</button>
      </form>
      <AnnotatedSource ast={ast}
                       highlightedNodeId={highlightedNodeId}
                       onHoveredNodeChange={onHoveredNodeChange}
                       source={source} />
      <ASTNav ast={ast}
              highlightedNodeId={highlightedNodeId}
              onHoveredNodeChange={onHoveredNodeChange} />
      <div className="blurb">
        created by <a href="https://brokensandals.net">brokensandals</a> | source code on <a href="https://github.com/brokensandals/blunt-instrument">github</a>
      </div>
    </div>
  );
}

export default AppView;
