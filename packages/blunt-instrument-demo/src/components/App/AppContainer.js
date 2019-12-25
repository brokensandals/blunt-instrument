import React from 'react';
import AppView from './AppView';
import { instrumentedEval } from 'blunt-instrument-eval';

const sampleCode = `function fac(n) {
  return n == 1 ? 1 : n * fac(n - 1);
}
fac(3);`;

class AppContainer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      highlightedNodeId: null,
      querier: instrumentedEval(sampleCode),
      source: sampleCode,
      sourceDraft: sampleCode,
    };

    this.handleHoveredNodeChange = this.handleHoveredNodeChange.bind(this);
    this.handleRun = this.handleRun.bind(this);
    this.handleSourceDraftChange = this.handleSourceDraftChange.bind(this);
  }

  handleHoveredNodeChange(nodeId) {
    this.setState({ highlightedNodeId: nodeId });
  }

  handleRun() {
    this.setState({
      querier: instrumentedEval(this.state.sourceDraft),
      source: this.state.sourceDraft,
    });
  }

  handleSourceDraftChange(sourceDraft) {
    this.setState({ sourceDraft });
  }

  render() {
    return (
      <AppView ast={this.state.querier.astq.ast}
               source={this.state.source}
               sourceDraft={this.state.sourceDraft}
               highlightedNodeId={this.state.highlightedNodeId}
               onHoveredNodeChange={this.handleHoveredNodeChange}
               onRun={this.handleRun}
               onSourceDraftChange={this.handleSourceDraftChange} />
    )
  }
}

export default AppContainer;
