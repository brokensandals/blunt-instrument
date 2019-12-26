import React from 'react';
import update from 'immutability-helper';
import AppView from './AppView';
import { examples } from './AppView';
import { instrumentedEval } from 'blunt-instrument-eval';

function toggleInclusionArray(array, item) {
  if (array == null) {
    return [item];
  }

  if (array.includes(item)) {
    const filtered = array.filter(x => x !== item);
    return filtered.length > 0 ? filtered : null;
  }

  return [...array, item];
}

class AppContainer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      eventQuery: {
        fields: {
          id: true,
          nodeId: true,
          source: true,
          value: true,
        },
        filters: {
          excludeTypes: ['Identifier', 'Literal'],
          includeNodeIds: null,
        }
      },
      highlightedEventId: null,
      highlightedNodeId: null,
    };
    Object.assign(this.state, this.doRun(examples.factorial, this.state.eventQuery));

    this.handleHoveredEventChange = this.handleHoveredEventChange.bind(this);
    this.handleHoveredNodeChange = this.handleHoveredNodeChange.bind(this);
    this.handleNodeSelectedToggle = this.handleNodeSelectedToggle.bind(this);
    this.handleRun = this.handleRun.bind(this);
    this.handleSourceDraftChange = this.handleSourceDraftChange.bind(this);
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
    this.setState(update(this.state, { $merge:
      this.doQuery(this.state.querier,
        update(this.state.eventQuery, {
          filters: { includeNodeIds:
            { $apply: (ids) => toggleInclusionArray(ids, nodeId) }}
        }))
    }));
  }

  doRun(source, eventQuery) {
    let querier;
    try {
      querier = instrumentedEval(source);
    } catch (error) {
      console.log(error)
      return { runError: error };
    }
  
    return {
      runError: null,
      source,
      sourceDraft: source,
      ...this.doQuery(querier, eventQuery),
    };
  }

  doQuery(querier, eventQuery) {
    const events = querier.query(eventQuery);
    return {
      events,
      eventQuery,
      querier,
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
      <AppView ast={this.state.querier.astq.ast}
               events={this.state.events}
               eventQuery={this.state.eventQuery}
               source={this.state.source}
               sourceDraft={this.state.sourceDraft}
               highlightedEventId={this.state.highlightedEventId}
               highlightedNodeId={this.state.highlightedNodeId}
               onHoveredEventChange={this.handleHoveredEventChange}
               onHoveredNodeChange={this.handleHoveredNodeChange}
               onNodeSelectedToggle={this.handleNodeSelectedToggle}
               onRun={this.handleRun}
               onSourceDraftChange={this.handleSourceDraftChange}
               runError={this.state.runError} />
    )
  }
}

export default AppContainer;
