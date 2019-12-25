import React from 'react';
import AppView from './AppView';
import { examples } from './AppView';
import { instrumentedEval } from 'blunt-instrument-eval';

class AppContainer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      highlightedNodeId: null,
      querier: instrumentedEval(examples.factorial),
      runError: null,
      source: examples.factorial,
      sourceDraft: examples.factorial,
    };

    this.handleHoveredNodeChange = this.handleHoveredNodeChange.bind(this);
    this.handleRun = this.handleRun.bind(this);
    this.handleSourceDraftChange = this.handleSourceDraftChange.bind(this);
  }

  handleHoveredNodeChange(nodeId) {
    this.setState({ highlightedNodeId: nodeId });
  }

  handleRun(source) {
    let querier;
    try {
      querier = instrumentedEval(source);
      this.setState({
        runError: null,
        querier: instrumentedEval(source),
        source: source,
        sourceDraft: source,
      });
    } catch (error) {
      this.setState({ runError: error });
    }
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
               onSourceDraftChange={this.handleSourceDraftChange}
               runError={this.state.runError} />
    )
  }
}

export default AppContainer;
