import React from 'react';
import update from 'immutability-helper';
import AppView from './AppView';
import examples from 'blunt-instrument-test-resources';
import instrumentedEval from 'blunt-instrument-eval';
import { TrevCollection } from 'blunt-instrument-core';
import { FileTraceWriter } from 'blunt-instrument-core';
import isVisibleWithin from '../../util/isVisibleWithin';

const defaultQueryState = {
  traceQuery: {
    nodes: {},
    nodeTypes: {},
    types: {},
  },
  highlightedTrevId: null,
  highlightedNodeKey: null,
}

class AppContainer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {...defaultQueryState};
    Object.assign(this.state, this.doRun(examples.factorial));

    this.handleTraceQueryChange = this.handleTraceQueryChange.bind(this);
    this.handleHoveredTrevChange = this.handleHoveredTrevChange.bind(this);
    this.handleHoveredNodeChange = this.handleHoveredNodeChange.bind(this);
    this.handleLoadByPaste = this.loadFromJSONText.bind(this);
    this.handleLoadByFile = this.handleLoadByFile.bind(this);
    this.handleNodeSelectedToggle = this.handleNodeSelectedToggle.bind(this);
    this.handleRun = this.handleRun.bind(this);
    this.handleSourceDraftChange = this.handleSourceDraftChange.bind(this);
    this.handleOpenModalData = this.handleOpenModalData.bind(this);
    this.handleCloseModalData = this.handleCloseModalData.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    this.handleStop = this.handleStop.bind(this);
  }

  componentDidUpdate() {
    // TODO this is a very lazy, hacky, inefficient implementation of ensuring the highlighted
    // elements are scrolled into view
    document.querySelectorAll('.code-tabs .react-tabs__tab-panel').forEach((codePanel) => {
      const highlightedNodeEl = codePanel.querySelector('.highlighted');
      if (highlightedNodeEl && !isVisibleWithin(highlightedNodeEl, codePanel)) {
        highlightedNodeEl.scrollIntoView({ behavior: 'smooth' });
      }
    });

    document.querySelectorAll('.trev-tabs .react-tabs__tab-panel').forEach((trevPanel) => {
      const highlightedTrevEl = trevPanel.querySelector('.highlighted-trev');
      if (highlightedTrevEl) {
        if (!isVisibleWithin(highlightedTrevEl, trevPanel)) {
          highlightedTrevEl.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }

      const highlightedNodeEls = trevPanel.querySelectorAll('.highlighted-node');
      if (highlightedNodeEls.length > 0 && !Array.from(highlightedNodeEls).some((el) => isVisibleWithin(el, trevPanel))) {
        highlightedNodeEls[0].scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  handleTraceQueryChange(traceQuery) {
    this.setState(this.doQuery(this.state.tc, traceQuery));
  }

  handleHoveredTrevChange(id) {
    this.handleHoveredNodeChange(id == null ? null : this.state.tc.getTrev(id).denormalized.node.biKey);
    this.setState({ highlightedTrevId: id });
  }

  handleHoveredNodeChange(nodeKey) {
    this.setState({ highlightedNodeKey: nodeKey });
  }

  handleLoadByFile(file) {
    try {
      const reader = new FileReader();
      reader.onerror = (event) => {
        reader.abort();
        this.setState({ action: 'load', error: 'Error while reading file' });
      };
      reader.onload = () => {
        this.loadFromJSONText(reader.result);
      };
      reader.readAsText(file);
    } catch (error) {
      this.setState({ action: 'load', error });
    }
  }

  loadFromJSONText(text) {
    let tc;
    const status = { action: 'load' };
    let sourceDraft = '';
    try {
      const json = JSON.parse(text);
      tc = TrevCollection.fromJSON(json);
    } catch (error) {
      try {
        tc = FileTraceWriter.parseToTC(text);
      } catch (error2) {
        status.error = `Failed to parse as TrevCollection json [error=${error}] or as FileTraceWriter output [error=${error2}]`;
        tc = TrevCollection.empty();
      }
    }

    tc = tc.withDenormalizedInfo();
    sourceDraft = (tc.astb.asts.eval && tc.astb.asts.eval.codeSlice) || '';

    this.setState({
      tc,
      status,
      sourceDraft,
      ...defaultQueryState,
      ...this.doQuery(tc, defaultQueryState.traceQuery),
    });
  }

  handleNodeSelectedToggle(nodeKey) {
    this.handleTraceQueryChange(
      update(this.state.traceQuery, {
        nodes: { $toggle: [nodeKey] }
      }));
  }

  handleOpenModalData(modalData) {
    this.setState({ ...this.state, modalData });
  }

  handleCloseModalData() {
    this.setState({ ...this.state, modalData: undefined });
  }

  handlePlay() {
    this.handleStop();
    if (this.state.filteredTC.trevs.length === 0) {
      return;
    }

    let nextIndex = 0;
    const handler = () => {
      if (nextIndex >= this.state.filteredTC.trevs.length) {
        this.handleStop();
        return;
      }
      this.handleHoveredTrevChange(this.state.filteredTC.trevs[nextIndex].id);
      nextIndex += 1;
    };
    handler();
    const id = window.setInterval(handler, 1000);
    this.setState({ walkthroughTimerId: id });
  }

  handleStop() {
    if (this.state.walkthroughTimerId) {
      this.handleHoveredTrevChange(null);
      window.clearInterval(this.state.walkthroughTimerId);
      this.setState({ walkthroughTimerId: undefined });
    }
  }

  doRun(source) {
    let tc;
    let trace;
    const status = { action: 'run' };
    try {
      trace = instrumentedEval(source, { saveInstrumented: true });
      tc = trace.toTC().withDenormalizedInfo();
      status.tracedError = trace.error;

      let refreshScheduled = false;
      trace.onChange = () => {
        if (refreshScheduled) {
          return;
        }
        refreshScheduled = true;

        window.setTimeout(() => {
          refreshScheduled = false;
          if (this.state.trace !== trace) {
            return;
          }

          const tc = trace.toTC().withDenormalizedInfo();
          this.setState({
            tc,
            ...this.doQuery(tc, this.state.traceQuery),
          });
        });
      };
    } catch (error) {
      console.log(error)
      tc = TrevCollection.empty();
      status.error = error;
    }
  
    return {
      tc,
      trace,
      status,
      sourceDraft: source,
      ...defaultQueryState,
      ...this.doQuery(tc, defaultQueryState.traceQuery),
    };
  }

  doQuery(tc, traceQuery) {
    const nodes = Object.keys(traceQuery.nodes).filter((key) => traceQuery.nodes[key]);
    const nodeTypes = Object.keys(traceQuery.nodeTypes).filter((key) => traceQuery.nodeTypes[key]);
    const types = Object.keys(traceQuery.types).filter((key) => traceQuery.types[key]);
    const filteredTC = tc.filter((trev) =>
      (nodes.length === 0 || nodes.includes(trev.denormalized.node.biKey))
      && (nodeTypes.length === 0 || nodeTypes.includes(trev.denormalized.node.type))
      && (types.length === 0 || types.includes(trev.type))
    );
    return {
      filteredTC,
      traceQuery,
    };
  }

  handleRun(source) {
    this.setState(this.doRun(source));
  }

  handleSourceDraftChange(sourceDraft) {
    this.setState({ sourceDraft });
  }

  render() {
    return (
      <AppView tc={this.state.tc}
               filteredTC={this.state.filteredTC}
               traceQuery={this.state.traceQuery}
               sourceDraft={this.state.sourceDraft}
               highlightedTrevId={this.state.highlightedTrevId}
               highlightedNodeKey={this.state.highlightedNodeKey}
               onTraceQueryChange={this.handleTraceQueryChange}
               onHoveredTrevChange={this.handleHoveredTrevChange}
               onHoveredNodeChange={this.handleHoveredNodeChange}
               onLoadByFile={this.handleLoadByFile}
               onLoadByPaste={this.handleLoadByPaste}
               onNodeSelectedToggle={this.handleNodeSelectedToggle}
               onRun={this.handleRun}
               onSourceDraftChange={this.handleSourceDraftChange}
               onOpenModalData={this.handleOpenModalData}
               onCloseModalData={this.handleCloseModalData}
               onPlay={this.handlePlay}
               onStop={this.handleStop}
               isPlaying={!!this.state.walkthroughTimerId}
               modalData={this.state.modalData}
               status={this.state.status} />
    )
  }
}

export default AppContainer;
