import React from 'react';
import update from 'immutability-helper';
import AppView from './AppView';
import examples from 'blunt-instrument-test-resources';
import instrumentedEval from 'blunt-instrument-eval';

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
    this.handleNodeSelectedToggle = this.handleNodeSelectedToggle.bind(this);
    this.handleRun = this.handleRun.bind(this);
    this.handleSourceDraftChange = this.handleSourceDraftChange.bind(this);
    this.handleOpenModalData = this.handleOpenModalData.bind(this);
    this.handleCloseModalData = this.handleCloseModalData.bind(this);
  }

  handleTraceQueryChange(traceQuery) {
    this.setState(this.doQuery(this.state.evalResult.tc, traceQuery));
  }

  handleHoveredTrevChange(id) {
    this.handleHoveredNodeChange(id == null ? null : this.state.evalResult.tc.getTrev(id).nodeId);
    this.setState({ highlightedTrevId: id });
  }

  handleHoveredNodeChange(nodeId) {
    this.setState({ highlightedNodeId: nodeId });
  }

  handleNodeSelectedToggle(nodeId) {
    const node = this.state.evalResult.tc.astb.getNode('eval', nodeId);
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

  doRun(source) {
    let evalResult;
    try {
      evalResult = instrumentedEval(source, { saveInstrumented: true });
    } catch (error) {
      console.log(error)
      return { runError: error };
    }
  

    return {
      evalResult,
      runError: null,
      sourceDraft: source,
      ...defaultQueryState,
      ...this.doQuery(evalResult.tc, defaultQueryState.traceQuery),
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
      <AppView evalResult={this.state.evalResult}
               tc={this.state.filteredTC}
               traceQuery={this.state.traceQuery}
               sourceDraft={this.state.sourceDraft}
               highlightedTrevId={this.state.highlightedTrevId}
               highlightedNodeId={this.state.highlightedNodeId}
               onTraceQueryChange={this.handleTraceQueryChange}
               onHoveredTrevChange={this.handleHoveredTrevChange}
               onHoveredNodeChange={this.handleHoveredNodeChange}
               onNodeSelectedToggle={this.handleNodeSelectedToggle}
               onRun={this.handleRun}
               onSourceDraftChange={this.handleSourceDraftChange}
               onOpenModalData={this.handleOpenModalData}
               onCloseModalData={this.handleCloseModalData}
               modalData={this.state.modalData}
               runError={this.state.runError} />
    )
  }
}

export default AppContainer;
