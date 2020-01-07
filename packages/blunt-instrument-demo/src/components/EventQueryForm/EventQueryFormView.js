import React from 'react';
import './EventQueryForm.css';
import { getCodeSlice } from 'blunt-instrument-ast-utils';
import update from 'immutability-helper';

function findNodeMultiQuerier(nodeId, astQueriers) {
  const { input, ...rest } = astQueriers;
  for (const astq of [input, ...Object.values(rest)]) {
    const node = astq.getNodeById(nodeId);
    if (node) {
      return node;
    }
  }
  return null;
}

function NodeFilter({
  highlighted,
  nodeId,
  onHoveredNodeChange,
  onNodeSelectedToggle,
  querier,
}) {
  const node = findNodeMultiQuerier(nodeId, querier.astQueriers);
  if (!node) {
    console.log('No node for nodeId: ' + nodeId);
  }

  const summary = [<span className="id">{nodeId}</span>]
  if (node) {
    summary.push(<code className="summary">{getCodeSlice(node)}</code>);
  }

  const handleMouseLeave = () => onHoveredNodeChange(null);
  const handleMouseOver = () => onHoveredNodeChange(nodeId);

  const handleClick = (event) => {
    onNodeSelectedToggle(nodeId);
    event.preventDefault();
  };

  const className = [
    'node',
    highlighted ? 'highlighted' : null
  ].join(' ');
  return (
    <span className={className}
          onClick={handleClick}
          onMouseLeave={handleMouseLeave}
          onMouseOver={handleMouseOver}>
      {summary}
    </span>
  );
}

export function EventQueryFormView({
  highlightedNodeId,
  onEventQueryChange = (query) => {},
  onHoveredNodeChange = (nodeId) => {},
  onNodeSelectedToggle = (nodeId) => {},
  querier,
  query,
}) {
  const nodeFilters = [];
  const onlyNodeIds = query.filters.onlyNodeIds ?
    Object.keys(query.filters.onlyNodeIds)
      .filter(k => query.filters.onlyNodeIds[k]) : [];
  if (onlyNodeIds.length > 0) {
    for (const nodeId of onlyNodeIds) {
      nodeFilters.push(
        <li key={nodeId}>
          <NodeFilter highlighted={highlightedNodeId === nodeId}
                      nodeId={nodeId}
                      querier={querier}
                      onHoveredNodeChange={onHoveredNodeChange}
                      onNodeSelectedToggle={onNodeSelectedToggle} />
        </li>);
    }
  }

  const nodeTypeFilters = [];
  for (const type of Object.keys(query.filters.excludeNodeTypes || {})) {
    const handleChange = (event) => onEventQueryChange(
      update(query, { filters: { excludeNodeTypes: { $toggle: [type] }}}));
    
      nodeTypeFilters.push(
      <li key={type}>
        <label>
          <input type="checkbox"
                checked={query.filters.excludeNodeTypes[type]}
                onChange={handleChange} />
          Hide values of {type} nodes
        </label>
      </li>
    );
  }

  return (
    <form className="EventQueryForm">
      <div className="node-filters">
        {nodeFilters.length > 0 ? 'Only showing values for:' : ''}
        <ul>{nodeFilters}</ul>
      </div>

      <div className="node-type-filters">
        <ul>{nodeTypeFilters}</ul>
      </div>
    </form>
  );
}

export default EventQueryFormView;
