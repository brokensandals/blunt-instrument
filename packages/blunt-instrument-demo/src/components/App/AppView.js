import React from 'react';
import './App.css';
import AnnotatedSource from '../AnnotatedSource';
import ASTNav from '../ASTNav';
import EventTable from '../EventTable';
import EventQueryForm from '../EventQueryForm';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

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
  eventQuery,
  events,
  highlightedEventId,
  highlightedNodeId,
  onHoveredEventChange,
  onHoveredNodeChange,
  onNodeSelectedToggle,
  onRun,
  onSourceDraftChange,
  querier,
  runError,
  sourceDraft,
}) {
  function runHandler(source) {
    return (event) => {
      event.preventDefault();
      onRun(source);
    }
  }

  const selectedNodeIds = eventQuery.filters.includeNodeIds || [];

  const handleSourceDraftChange =
    (event) => onSourceDraftChange(event.target.value);
  
  const exampleLinks = Object.keys(examples).map(key => 
    <button key={key} onClick={runHandler(examples[key])}>{key}</button>);

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

      <div className="source-tabs">
        <Tabs>
          <TabList>
            <Tab>Original Source</Tab>
            <Tab>Instrumented Source</Tab>
          </TabList>

          <TabPanel>
            <AnnotatedSource astQuerier={querier.astq}
                             highlightedNodeId={highlightedNodeId}
                             onHoveredNodeChange={onHoveredNodeChange}
                             onNodeSelectedToggle={onNodeSelectedToggle}
                             selectedNodeIds={selectedNodeIds} />
          </TabPanel>
          
          <TabPanel>
            <AnnotatedSource astQuerier={querier.astQueriers.instrumented}
                             highlightedNodeId={highlightedNodeId}
                             onHoveredNodeChange={onHoveredNodeChange}
                             onNodeSelectedToggle={onNodeSelectedToggle}
                             selectedNodeIds={selectedNodeIds} />
          </TabPanel>
        </Tabs>
      </div>

      <div className="ast-tabs">
        <Tabs>
          <TabList>
            <Tab>Original AST</Tab>
            <Tab>Instrumented AST</Tab>
          </TabList>

          <TabPanel>
            <ASTNav astQuerier={querier.astq}
                    highlightedNodeId={highlightedNodeId}
                    onHoveredNodeChange={onHoveredNodeChange}
                    onNodeSelectedToggle={onNodeSelectedToggle}
                    selectedNodeIds={selectedNodeIds} />
          </TabPanel>
            
          <TabPanel>
            <ASTNav astQuerier={querier.astQueriers.instrumented}
                      highlightedNodeId={highlightedNodeId}
                      onHoveredNodeChange={onHoveredNodeChange}
                      onNodeSelectedToggle={onNodeSelectedToggle}
                      selectedNodeIds={selectedNodeIds} />
          </TabPanel>
        </Tabs>
      </div>
      <EventQueryForm highlightedNodeId={highlightedNodeId}
                      onHoveredNodeChange={onHoveredNodeChange}
                      onNodeSelectedToggle={onNodeSelectedToggle}
                      querier={querier}
                      query={eventQuery} />
      <EventTable events={events}
                  highlightedEventId={highlightedEventId}
                  highlightedNodeId={highlightedNodeId}
                  onHoveredEventChange={onHoveredEventChange} />
      <div className="blurb">
        created by <a href="https://brokensandals.net">brokensandals</a> | source code on <a href="https://github.com/brokensandals/blunt-instrument">github</a>
      </div>
    </div>
  );
}

export default AppView;
