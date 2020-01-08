import React from 'react';
import update from 'immutability-helper';
import AppView from './AppView';
import { examples } from 'blunt-instrument-test-resources';
import { instrumentedEval } from 'blunt-instrument-eval';

class AppContainer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      traceQuery: {
        filters: {
          excludeNodeTypes: {
            Identifier: true,
            Literal: true,
          },
          onlyNodeIds: {},
        }
      },
      highlightedTrevId: null,
      highlightedNodeId: null,
    };
    Object.assign(this.state, this.doRun(examples.factorial, this.state.traceQuery));

    this.handleTraceQueryChange = this.handleTraceQueryChange.bind(this);
    this.handleHoveredTrevChange = this.handleHoveredTrevChange.bind(this);
    this.handleHoveredNodeChange = this.handleHoveredNodeChange.bind(this);
    this.handleNodeSelectedToggle = this.handleNodeSelectedToggle.bind(this);
    this.handleRun = this.handleRun.bind(this);
    this.handleSourceDraftChange = this.handleSourceDraftChange.bind(this);
  }

  handleTraceQueryChange(traceQuery) {
    this.setState(this.doQuery(this.state.evalResult.traceQuerier, traceQuery));
  }

  handleHoveredTrevChange(id) {
    this.handleHoveredNodeChange(id == null ? null : this.state.evalResult.traceQuerier.getTrevById(id).nodeId);
    this.setState({ highlightedTrevId: id });
  }

  handleHoveredNodeChange(nodeId) {
    this.setState({ highlightedNodeId: nodeId });
  }

  handleNodeSelectedToggle(nodeId) {
    this.handleTraceQueryChange(
      update(this.state.traceQuery, {
        filters: { onlyNodeIds:
          { $toggle: [nodeId] }}
      }));
  }

  doRun(source, traceQuery) {
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
      ...this.doQuery(evalResult.traceQuerier, traceQuery),
    };
  }

  doQuery(traceQuerier, traceQuery) {
    const trevs = traceQuerier.query(traceQuery);
    return {
      trevs,
      traceQuery,
    };
  }

  handleRun(source) {
    this.setState(this.doRun(source, this.state.traceQuery));
  }

  handleSourceDraftChange(sourceDraft) {
    this.setState({ sourceDraft });
  }

  render() {
    return (
      <AppView evalResult={this.state.evalResult}
               trevs={this.state.trevs}
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
               runError={this.state.runError} />
    )
  }
}

export default AppContainer;
