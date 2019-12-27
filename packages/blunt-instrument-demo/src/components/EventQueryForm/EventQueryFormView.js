import React from 'react';
import './EventQueryForm.css';

function findNodeMultiQuerier(nodeId, astQueriers) {
  const { input, ...rest } = astQueriers;
  for (const astq of [input, ...Object.values(rest)]) {
    const node = astq.nodesById.get(nodeId);
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
    summary.push(<code className="summary">{node.extra.code.slice(0, 15)}</code>);
    if (node.extra.code.length > 15) {
      summary.push('...');
    }
  }

  const handleMouseLeave = onHoveredNodeChange ? () => {
    onHoveredNodeChange(null);
  } : null;

  const handleMouseOver = onHoveredNodeChange ? () => {
    onHoveredNodeChange(nodeId);
  } : null;

  const handleClick = onNodeSelectedToggle ? (event) => {
    onNodeSelectedToggle(nodeId);
    event.preventDefault();
  } : null;

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
  onHoveredNodeChange = null,
  onNodeSelectedToggle = null,
  querier,
  query,
}) {
  const nodeFilters = [];
  if (query.filters.includeNodeIds) {
    for (const nodeId of query.filters.includeNodeIds) {
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

  return (
    <form className="EventQueryForm">
      <p className="node-filters">
        {nodeFilters.length > 0 ? 'Only showing values for:' : ''}
        <ul>{nodeFilters}</ul>
      </p>
    </form>
  );
}

export default EventQueryFormView;
