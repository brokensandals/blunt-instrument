import React from 'react';
import './App.css';
import AnnotatedSource from '../AnnotatedSource';
import ASTNav from '../ASTNav';

function AppView({
  ast,
  highlightedNodeId,
  onHoveredNodeChange,
  onRun,
  onSourceDraftChange,
  source,
  sourceDraft,
}) {
  const handleRun = (event) => {
    event.preventDefault();
    onRun();
  };
  const handleSourceDraftChange =
    (event) => onSourceDraftChange(event.target.value);

  return (
    <div className="App">
      <form className="source-form">
        <p className="instructions">Enter javascript code here, then click "Run" to see the trace.</p>
        <textarea value={sourceDraft} onChange={handleSourceDraftChange} />
        <button className="run" onClick={handleRun}>Run</button>
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
