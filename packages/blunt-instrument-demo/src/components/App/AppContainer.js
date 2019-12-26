import React from 'react';
import AppView from './AppView';
import { examples } from './AppView';
import { instrumentedEval } from 'blunt-instrument-eval';

class AppContainer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      eventQuery: {
        fields: {
          eventId: true,
          nodeId: true,
          source: true,
          value: true,
        },
        filters: {
          excludeTypes: ['Identifier', 'Literal']
        }
      },
      highlightedEventId: null,
      highlightedNodeId: null,
    };
    Object.assign(this.state, this.doRun(examples.factorial));

    this.handleHoveredEventChange = this.handleHoveredEventChange.bind(this);
    this.handleHoveredNodeChange = this.handleHoveredNodeChange.bind(this);
    this.handleRun = this.handleRun.bind(this);
    this.handleSourceDraftChange = this.handleSourceDraftChange.bind(this);
  }

  handleHoveredEventChange(eventId) {
    // TODO use an abstraction for looking up events by id?
    this.handleHoveredNodeChange(eventId == null ? null : this.state.querier.events[eventId].nodeId);
    this.setState({ highlightedEventId: eventId });
  }

  handleHoveredNodeChange(nodeId) {
    this.setState({ highlightedNodeId: nodeId });
  }

  doRun(source) {
    let querier;
    try {
      querier = instrumentedEval(source);
    } catch (error) {
      console.log(error)
      return { runError: error };
    }
  
    const events = querier.query(this.state.eventQuery);
    return {
      events,
      querier,
      runError: null,
      source,
      sourceDraft: source,
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
