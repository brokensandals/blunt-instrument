import React from 'react';
import AppView from './AppView';
import { examples } from './AppView';
import { instrumentedEval } from 'blunt-instrument-eval';

function doRun(source) {
  let querier;
  try {
    querier = instrumentedEval(source);
  } catch (error) {
    console.log(error)
    return { runError: error };
  }

  const events = querier.query();
  return {
    events,
    querier,
    runError: null,
    source,
    sourceDraft: source,
  };
}

class AppContainer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {};
    this.state = {
      highlightedEventId: null,
      highlightedNodeId: null,
      ...doRun(examples.factorial)
    };

    this.handleHoveredEventChange = this.handleHoveredEventChange.bind(this);
    this.handleHoveredNodeChange = this.handleHoveredNodeChange.bind(this);
    this.handleRun = this.handleRun.bind(this);
    this.handleSourceDraftChange = this.handleSourceDraftChange.bind(this);
  }

  handleHoveredEventChange(eventId) {
    // TODO use an abstraction for looking up events by id?
    this.handleHoveredNodeChange(eventId == null ? null : this.state.events[eventId].nodeId);
    this.setState({ highlightedEventId: eventId });
  }

  handleHoveredNodeChange(nodeId) {
    this.setState({ highlightedNodeId: nodeId });
  }

  handleRun(source) {
    this.setState(doRun(source));
  }

  handleSourceDraftChange(sourceDraft) {
    this.setState({ sourceDraft });
  }

  render() {
    return (
      <AppView ast={this.state.querier.astq.ast}
               events={this.state.events}
               source={this.state.source}
               sourceDraft={this.state.sourceDraft}
               highlightedEventId={this.state.highlightedEventId}
               highlightedNodeId={this.state.highlightedNodeId}
               onHoveredEventChange={this.handleHoveredEventChange}
               onHoveredNodeChange={this.handleHoveredNodeChange}
               onRun={this.handleRun}
               onSourceDraftChange={this.handleSourceDraftChange}
               runError={this.state.runError} />
    )
  }
}

export default AppContainer;
