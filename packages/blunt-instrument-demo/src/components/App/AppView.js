import React from 'react';
import './App.css';
import AnnotatedCode from '../AnnotatedCode';
import ASTNav from '../ASTNav';
import TrevTable from '../TrevTable';
import TraceQueryForm from '../TraceQueryForm';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import examples from 'blunt-instrument-test-resources';
import ReactJson from 'react-json-view';
import Modal from 'react-modal';

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
  onOpenModalData,
  onCloseModalData,
  modalData,
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
      key => traceQuery.filters.onlyNodeIds[key]).map(Number);

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

  let status;
  if (runError) {
    status = <p className="error">{runError.toString()}</p>;
  } else if (evalResult.error) {
    status = <p>Completed with error: {evalResult.error.toString()}</p>;
  } else {
    status = <p>Completed successfully.</p>;
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
        <textarea value={sourceDraft} onChange={handleSourceDraftChange}
                  autoComplete="false"
                  autoCorrect="false"
                  spellCheck="false" />
        {status}
        <button className="run" onClick={runHandler(sourceDraft)}>Run</button>
      </form>

      <div className="code-tabs">
        <Tabs>
          <TabList>
            <Tab>Code</Tab>
            <Tab>AST</Tab>
            <Tab>AST JSON</Tab>
            <Tab>Instrumented Code</Tab>
          </TabList>

          <TabPanel>
            <AnnotatedCode ast={evalResult.traceQuerier.astQuerier.ast}
                           highlightedNodeId={highlightedNodeId}
                           onHoveredNodeChange={onHoveredNodeChange}
                           onNodeSelectedToggle={onNodeSelectedToggle}
                           selectedNodeIds={selectedNodeIds} />
          </TabPanel>

          <TabPanel>
            <ASTNav ast={evalResult.traceQuerier.astQuerier.ast}
                    highlightedNodeId={highlightedNodeId}
                    onHoveredNodeChange={onHoveredNodeChange}
                    onNodeSelectedToggle={onNodeSelectedToggle}
                    selectedNodeIds={selectedNodeIds} />
          </TabPanel>

          <TabPanel>
            <ReactJson src={evalResult.traceQuerier.astQuerier.ast} name={false} />
          </TabPanel>
          
          <TabPanel>
            <AnnotatedCode ast={evalResult.instrumentedAST}
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

      <div className="trev-tabs">
        <Tabs>
          <TabList>
            <Tab>Trace Events</Tab>
            <Tab>Trevs JSON</Tab>
          </TabList>
          
          <TabPanel>
            <TrevTable trevs={trevs}
                      highlightedTrevId={highlightedTrevId}
                      highlightedNodeId={highlightedNodeId}
                      onHoveredTrevChange={onHoveredTrevChange}
                      onNodeSelectedToggle={onNodeSelectedToggle}
                      onOpenModalData={onOpenModalData} />
          </TabPanel>

          <TabPanel>
            <ReactJson src={trevs.map(({ extra, ...rest }) => rest)}
                       name={false}
                       displayDataTypes={false} />
          </TabPanel>
        </Tabs>
      </div>

      <div className="blurb">
        created by <a href="https://brokensandals.net">brokensandals</a> | source code on <a href="https://github.com/brokensandals/blunt-instrument">github</a>
      </div>

      <Modal isOpen={modalData !== undefined}
             onRequestClose={onCloseModalData}
             contentLabel="Data Inspector"
             shouldCloseOnOverlayClick={true}>
        <ReactJson src={modalData}
                   name={false}
                   displayDataTypes={false} />
      </Modal>
    </div>
  );
}

export default AppView;
