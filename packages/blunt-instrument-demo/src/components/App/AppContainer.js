import React from 'react';
import update from 'immutability-helper';
import AppView from './AppView';
import { examples } from './AppView';
import { instrumentedEval } from 'blunt-instrument-eval';

class AppContainer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      eventQuery: {
        filters: {
          excludeNodeTypes: ['Identifier', 'Literal'],
          onlyNodeIds: {},
        }
      },
      highlightedEventId: null,
      highlightedNodeId: null,
    };
    Object.assign(this.state, this.doRun(examples.factorial, this.state.eventQuery));

    this.handleEventQueryChange = this.handleEventQueryChange.bind(this);
    this.handleHoveredEventChange = this.handleHoveredEventChange.bind(this);
    this.handleHoveredNodeChange = this.handleHoveredNodeChange.bind(this);
    this.handleNodeSelectedToggle = this.handleNodeSelectedToggle.bind(this);
    this.handleRun = this.handleRun.bind(this);
    this.handleSourceDraftChange = this.handleSourceDraftChange.bind(this);
  }

  handleEventQueryChange(eventQuery) {
    this.setState(this.doQuery(this.state.querier, eventQuery));
  }

  handleHoveredEventChange(id) {
    // TODO use an abstraction for looking up events by id?
    this.handleHoveredNodeChange(id == null ? null : this.state.querier.events[id].nodeId);
    this.setState({ highlightedEventId: id });
  }

  handleHoveredNodeChange(nodeId) {
    this.setState({ highlightedNodeId: nodeId });
  }

  handleNodeSelectedToggle(nodeId) {
    this.handleEventQueryChange(
      update(this.state.eventQuery, {
        filters: { onlyNodeIds:
          { $toggle: [nodeId] }}
      }));
  }

  doRun(source, eventQuery) {
    let querier;
    try {
      querier = instrumentedEval(source, { saveInstrumented: true });
    } catch (error) {
      console.log(error)
      return { runError: error };
    }
  

    return {
      runError: null,
      querier,
      sourceDraft: source,
      ...this.doQuery(querier, eventQuery),
    };
  }

  doQuery(querier, eventQuery) {
    const events = querier.query(eventQuery);
    return {
      events,
      eventQuery,
    };
  }

  handleRun(source) {
    this.setState(this.doRun(source, this.state.eventQuery));
  }

  handleSourceDraftChange(sourceDraft) {
    this.setState({ sourceDraft });
  }

  render() {
    return (
      <AppView events={this.state.events}
               eventQuery={this.state.eventQuery}
               sourceDraft={this.state.sourceDraft}
               highlightedEventId={this.state.highlightedEventId}
               highlightedNodeId={this.state.highlightedNodeId}
               onEventQueryChange={this.handleEventQueryChange}
               onHoveredEventChange={this.handleHoveredEventChange}
               onHoveredNodeChange={this.handleHoveredNodeChange}
               onNodeSelectedToggle={this.handleNodeSelectedToggle}
               onRun={this.handleRun}
               onSourceDraftChange={this.handleSourceDraftChange}
               querier={this.state.querier}
               runError={this.state.runError} />
    )
  }
}

export default AppContainer;
