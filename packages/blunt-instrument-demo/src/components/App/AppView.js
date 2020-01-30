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
import { fromNodeKey } from 'blunt-instrument-ast-utils';
import update from 'immutability-helper';

function AppView({
  evalResult,
  tc,
  traceQuery,
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
    Object.keys(traceQuery.nodes).filter(
      key => traceQuery.nodes[key]).map((nodeKey) => fromNodeKey(nodeKey).nodeId);

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
    status = <p className="status error">{runError.toString()}</p>;
  } else if (evalResult.error) {
    status = <p className="status warning">Completed with error: {evalResult.error.toString()}</p>;
  } else {
    status = <p className="status">Completed successfully.</p>;
  }

  const handleTrevTypeSelectedToggle = (type) => {
    onTraceQueryChange(update(traceQuery, { types: { $toggle: [type] } }));
  };

  return (
    <div className="App">
      <div className="control-tabs">
        <Tabs>
          <TabList>
            <Tab>Run</Tab>
            <Tab>Save</Tab>
            <Tab>Load</Tab>
          </TabList>

          <TabPanel>
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
              <div className="below-source">
                <button className="run" onClick={runHandler(sourceDraft)}>Run</button>
                {status}
              </div>
            </form>
          </TabPanel>

          <TabPanel></TabPanel>
          <TabPanel></TabPanel>
        </Tabs>
      </div>

      <div className="code-tabs">
        <Tabs>
          <TabList>
            <Tab>Code</Tab>
            <Tab>AST</Tab>
            <Tab>AST JSON</Tab>
            <Tab>Instrumented Code</Tab>
          </TabList>

          <TabPanel>
            <AnnotatedCode ast={evalResult.tc.astb.asts.eval}
                           highlightedNodeId={highlightedNodeId}
                           onHoveredNodeChange={onHoveredNodeChange}
                           onNodeSelectedToggle={onNodeSelectedToggle}
                           selectedNodeIds={selectedNodeIds} />
          </TabPanel>

          <TabPanel>
            <ASTNav ast={evalResult.tc.astb.asts.eval}
                    highlightedNodeId={highlightedNodeId}
                    onHoveredNodeChange={onHoveredNodeChange}
                    onNodeSelectedToggle={onNodeSelectedToggle}
                    selectedNodeIds={selectedNodeIds} />
          </TabPanel>

          <TabPanel>
            <ReactJson src={evalResult.tc.astb.asts.eval} name={false} />
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
                      tc={evalResult.tc}
                      query={traceQuery} />

      <div className="trev-tabs">
        <Tabs>
          <TabList>
            <Tab>Trace Events</Tab>
            <Tab>Trevs JSON</Tab>
          </TabList>
          
          <TabPanel>
            <TrevTable trevs={tc.trevs}
                      highlightedTrevId={highlightedTrevId}
                      highlightedNodeId={highlightedNodeId}
                      onHoveredTrevChange={onHoveredTrevChange}
                      onNodeSelectedToggle={onNodeSelectedToggle}
                      onOpenModalData={onOpenModalData}
                      onTrevTypeSelectedToggle={handleTrevTypeSelectedToggle} />
          </TabPanel>

          <TabPanel>
            <ReactJson src={tc.withoutDenormalizedInfo()}
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
