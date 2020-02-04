import React from 'react';
import update from 'immutability-helper';
import AppView from './AppView';
import examples from 'blunt-instrument-test-resources';
import instrumentedEval from 'blunt-instrument-eval';
import { TrevCollection } from 'blunt-instrument-trace-utils';

/**
 * Determines whether an element is currently visible within a scrollable ancestor.
 * @param {*} target the element you want to be visible
 * @param {*} container the scrollable ancestor element
 * @param {*} min the minimum number of pixels of target that need to be visible
 * @returns {boolean} true if the minimum number of pixels is visible
 */
function isVisibleWithin(target, container, min = 5) {
  const tr = target.getBoundingClientRect();
  const cr = container.getBoundingClientRect();
  return !(
    cr.bottom - min < tr.top
    || cr.top + min > tr.bottom
    || cr.right - min < tr.left
    || cr.left + min > tr.right
  );
}

const defaultQueryState = {
  traceQuery: {
    nodes: {},
    nodeTypes: {},
    types: {},
  },
  highlightedTrevId: null,
  highlightedNodeId: null,
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
    this.handleHoveredNodeChange(id == null ? null : this.state.tc.getTrev(id).nodeId);
    this.setState({ highlightedTrevId: id });
  }

  handleHoveredNodeChange(nodeId) {
    this.setState({ highlightedNodeId: nodeId });
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
    try {
      const json = JSON.parse(text);
      const tc = TrevCollection.fromJSON(json).withDenormalizedInfo();
      this.setState({
        tc,
        status: { action: 'load' },
        sourceDraft: tc.astb.asts.eval.codeSlice,
        ...defaultQueryState,
        ...this.doQuery(tc, defaultQueryState.traceQuery),
      });
    } catch (error) {
      this.setState({
        status: { action: 'load', error },
      });
    }
  }

  handleNodeSelectedToggle(nodeId) {
    const node = this.state.tc.astb.getNode('eval', nodeId);
    if (!node) {
      return;
    }
    this.handleTraceQueryChange(
      update(this.state.traceQuery, {
        nodes: { $toggle: [node.biKey] }
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
    let trace;
    try {
      trace = instrumentedEval(source, { saveInstrumented: true });
    } catch (error) {
      console.log(error)
      return { status: { action: 'run', error } };
    }
  
    const tc = trace.toTC().withDenormalizedInfo();
    return {
      tc,
      status: { action: 'run', tracedError: trace.error },
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
               highlightedNodeId={this.state.highlightedNodeId}
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
