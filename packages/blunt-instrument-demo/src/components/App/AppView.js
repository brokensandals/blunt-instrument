import React from 'react';
import './App.css';
import AnnotatedCode from '../AnnotatedCode';
import ASTNav from '../ASTNav';
import TrevTable from '../TrevTable';
import TraceQueryForm from '../TraceQueryForm';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { examples } from 'blunt-instrument-test-resources';

function AppView({
  evalResult,
  traceQuery,
  trevs,
  highlightedTrevId,
  highlightedNodeId,
  onTraceQueryChange,
  onHoveredTrevChange,
  onHoveredNodeChange,
  onNodeSelectedToggle,
  onRun,
  onSourceDraftChange,
  runError,
  sourceDraft,
}) {
  function runHandler(source) {
    return (event) => {
      event.preventDefault();
      onRun(source);
    }
  }

  const onChangeSelectedExample = event => {
    onRun(examples[event.target.value] || '');
  }

  const selectedNodeIds =
    Object.keys(traceQuery.filters.onlyNodeIds).filter(
      key => traceQuery.filters.onlyNodeIds[key]);

  const handleSourceDraftChange =
    (event) => onSourceDraftChange(event.target.value);
  
  let selectedExample = '';
  const exampleOptions = [<option value=""></option>];
  for (const key in examples) {
    exampleOptions.push(<option value={key}>{key}</option>);
    if (sourceDraft === examples[key]) {
      selectedExample = key;
    }
  }

  return (
    <div className="App">
      <form className="source-form">
        <p className="instructions">
          Enter javascript code here, then click "Run" to see the trace.
          Or, choose an example:
          <select value={selectedExample} onChange={onChangeSelectedExample}>
            {exampleOptions}
          </select>
        </p>
        <textarea value={sourceDraft} onChange={handleSourceDraftChange} />
        {runError ? <p className="error">{runError.toString()}</p> : null}
        <button className="run" onClick={runHandler(sourceDraft)}>Run</button>
      </form>

      <div className="code-tabs">
        <Tabs>
          <TabList>
            <Tab>Original Code</Tab>
            <Tab>Instrumented Code</Tab>
          </TabList>

          <TabPanel>
            <AnnotatedCode astQuerier={evalResult.traceQuerier.astQuerier}
                           highlightedNodeId={highlightedNodeId}
                           onHoveredNodeChange={onHoveredNodeChange}
                           onNodeSelectedToggle={onNodeSelectedToggle}
                           selectedNodeIds={selectedNodeIds} />
          </TabPanel>
          
          <TabPanel>
            <AnnotatedCode astQuerier={evalResult.instrumentedASTQuerier}
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
            <ASTNav astQuerier={evalResult.traceQuerier.astQuerier}
                    highlightedNodeId={highlightedNodeId}
                    onHoveredNodeChange={onHoveredNodeChange}
                    onNodeSelectedToggle={onNodeSelectedToggle}
                    selectedNodeIds={selectedNodeIds} />
          </TabPanel>
            
          <TabPanel>
            <ASTNav astQuerier={evalResult.instrumentedASTQuerier}
                      highlightedNodeId={highlightedNodeId}
                      onHoveredNodeChange={onHoveredNodeChange}
                      onNodeSelectedToggle={onNodeSelectedToggle}
                      selectedNodeIds={selectedNodeIds} />
          </TabPanel>
        </Tabs>
      </div>
      <TraceQueryForm highlightedNodeId={highlightedNodeId}
                      onTraceQueryChange={onTraceQueryChange}
                      onHoveredNodeChange={onHoveredNodeChange}
                      onNodeSelectedToggle={onNodeSelectedToggle}
                      querier={evalResult.traceQuerier}
                      query={traceQuery} />
      <TrevTable trevs={trevs}
                 highlightedTrevId={highlightedTrevId}
                 highlightedNodeId={highlightedNodeId}
                 onHoveredTrevChange={onHoveredTrevChange}
                 onNodeSelectedToggle={onNodeSelectedToggle} />
      <div className="blurb">
        created by <a href="https://brokensandals.net">brokensandals</a> | source code on <a href="https://github.com/brokensandals/blunt-instrument">github</a>
      </div>
    </div>
  );
}

export default AppView;
