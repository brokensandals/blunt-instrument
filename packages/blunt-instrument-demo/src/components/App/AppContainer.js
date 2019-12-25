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
      querier: instrumentedEval(sampleCode)
    };

    this.handleHoveredNodeChange = this.handleHoveredNodeChange.bind(this);
  }

  handleHoveredNodeChange(nodeId) {
    this.setState({ highlightedNodeId: nodeId });
  }

  render() {
    return (
      <AppView ast={this.state.querier.astq.ast}
               source={sampleCode}
               highlightedNodeId={this.state.highlightedNodeId}
               onHoveredNodeChange={this.handleHoveredNodeChange} />
    )
  }
}

export default AppContainer;
