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
import FileSaver from 'file-saver';
import LargeDataPreview from '../LargeDataPreview';

function AppView({
  tc,
  filteredTC,
  traceQuery,
  highlightedTrevId,
  highlightedNodeId,
  onTraceQueryChange,
  onHoveredTrevChange,
  onHoveredNodeChange,
  onLoadByFile,
  onLoadByPaste,
  onNodeSelectedToggle,
  onRun,
  onSourceDraftChange,
  onOpenModalData,
  onCloseModalData,
  onPlay,
  onStop,
  isPlaying,
  modalData,
  status,
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

  let runStatus = <p className="status">&nbsp;</p>; // TODO terrible hack, keeps button style consistent in Safari
  let loadStatus = <p className="status" />;
  switch (status.action) {
    case 'run':
      if (status.error) {
        runStatus = <p className="status error">{status.error.toString()}</p>;
      } else if (status.tracedError) {
        runStatus = <p className="status warning">Ran and received error: {status.tracedError.toString()}</p>;
      } else {
        runStatus = <p className="status">Ran successfully.</p>;
      }
      break;
    case 'load':
      if (status.error) {
        loadStatus = <p className="status error">{status.error.toString()}</p>;
      } else {
        loadStatus = <p className="status">Loaded trace successfully.</p>;
      }
      break;
    default:
  }

  const handleTrevTypeSelectedToggle = (type) => {
    onTraceQueryChange(update(traceQuery, { types: { $toggle: [type] } }));
  };

  const handleLoadByPaste = (event) => {
    const text = (event.clipboardData || window.clipboardData).getData('text');
    if (text) {
      onLoadByPaste(text);
    }
    event.preventDefault();
  }

  const handleSaveFile = (event) => {
    const text = JSON.stringify(tc.asJSON(), null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    FileSaver.saveAs(blob, 'trace.json');
  };

  const handleLoadFile = (event) => {
    const files = event.target.files;
    if (files.length < 1) {
      return;
    }
    onLoadByFile(files[0]);
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
                Enter javascript code &amp; click Run, or choose an example:
                <select value={selectedExample} onChange={onChangeSelectedExample}>
                  {exampleOptions}
                </select>
              </p>
              <textarea value={sourceDraft} onChange={handleSourceDraftChange}
                        autoComplete="false"
                        autoCorrect="false"
                        spellCheck="false" />
              <div className="status-area">
                <button className="run" onClick={runHandler(sourceDraft)}>Run</button>
                {runStatus}
              </div>
            </form>
          </TabPanel>

          <TabPanel>
            <div className="save-form">
              <p>You can export the trace &amp; AST to load later.</p>
              <ul>
                <li><button className="view-save" onClick={() => onOpenModalData(tc.asJSON())}>View JSON in browser</button></li>
                <li>Or <button className="file-save" onClick={handleSaveFile}>save to file</button></li>
              </ul>
            </div>
          </TabPanel>
          
          <TabPanel>
            <div className="load-form">
              <ul>
                <li>Paste the JSON here: <input className="load-paste" value="" type="text" onPaste={handleLoadByPaste} /></li>
                <li>Or load from a file: <input className="load-file" value="" type="file" accept=".json" onChange={handleLoadFile} /></li>
              </ul>
              <div className="status-area">
                {loadStatus}
              </div>
            </div>
          </TabPanel>
        </Tabs>
      </div>

      <div className="code-tabs">
        <Tabs>
          <TabList>
            <Tab>Code</Tab>
            <Tab>AST</Tab>
            <Tab>AST JSON</Tab>
            {tc.astb.instrumentedAST ? <Tab>Instrumented Code</Tab> : null}
          </TabList>

          <TabPanel>
            <AnnotatedCode ast={tc.astb.asts.eval}
                           highlightedNodeId={highlightedNodeId}
                           onHoveredNodeChange={onHoveredNodeChange}
                           onNodeSelectedToggle={onNodeSelectedToggle}
                           selectedNodeIds={selectedNodeIds} />
          </TabPanel>

          <TabPanel>
            <ASTNav ast={tc.astb.asts.eval}
                    highlightedNodeId={highlightedNodeId}
                    onHoveredNodeChange={onHoveredNodeChange}
                    onNodeSelectedToggle={onNodeSelectedToggle}
                    selectedNodeIds={selectedNodeIds} />
          </TabPanel>

          <TabPanel>
            <ReactJson src={tc.astb.asts.eval} name={false} />
          </TabPanel>
          
          {tc.astb.instrumentedAST ?
            <TabPanel>
              <AnnotatedCode ast={tc.astb.instrumentedAST}
                            highlightedNodeId={highlightedNodeId}
                            onHoveredNodeChange={onHoveredNodeChange}
                            onNodeSelectedToggle={onNodeSelectedToggle}
                            selectedNodeIds={selectedNodeIds} />
            </TabPanel> : null}
        </Tabs>
      </div>

      <TraceQueryForm highlightedNodeId={highlightedNodeId}
                      onTraceQueryChange={onTraceQueryChange}
                      onHoveredNodeChange={onHoveredNodeChange}
                      onNodeSelectedToggle={onNodeSelectedToggle}
                      tc={tc}
                      query={traceQuery}
                      onPlay={onPlay}
                      onStop={onStop}
                      isPlaying={isPlaying} />

      <div className="trev-tabs">
        <Tabs>
          <TabList>
            <Tab>Trace Events</Tab>
            <Tab>Trevs JSON</Tab>
          </TabList>
          
          <TabPanel>
            <TrevTable trevs={filteredTC.trevs}
                      highlightedTrevId={highlightedTrevId}
                      highlightedNodeId={highlightedNodeId}
                      onHoveredTrevChange={onHoveredTrevChange}
                      onNodeSelectedToggle={onNodeSelectedToggle}
                      onOpenModalData={onOpenModalData}
                      onTrevTypeSelectedToggle={handleTrevTypeSelectedToggle} />
          </TabPanel>

          <TabPanel>
            <ReactJson src={filteredTC.withoutDenormalizedInfo().trevs}
                       name={false}
                       displayDataTypes={false} />
          </TabPanel>
        </Tabs>
      </div>

      <div className="large-data-preview">
        {highlightedTrevId ? <LargeDataPreview data={tc.getTrev(highlightedTrevId).data} /> : <p></p>}
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
