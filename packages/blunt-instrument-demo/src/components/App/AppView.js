import React from 'react';
import './App.css';
import AnnotatedSource from '../AnnotatedSource';
import ASTNav from '../ASTNav';

function AppView({
  ast,
  highlightedNodeId,
  onHoveredNodeChange,
  source
}) {
  return (
    <div className="App">
      <AnnotatedSource ast={ast}
                       highlightedNodeId={highlightedNodeId}
                       onHoveredNodeChange={onHoveredNodeChange}
                       source={source} />}
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
