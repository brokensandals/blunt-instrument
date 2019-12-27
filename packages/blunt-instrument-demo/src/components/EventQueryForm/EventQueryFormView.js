import React from 'react';
import './EventQueryForm.css';

function NodeFilter({
  highlighted,
  nodeId,
  onHoveredNodeChange,
  onNodeSelectedToggle,
  querier,
}) {
  // TODO: handle nodes from instrumented ast
  const node = querier.astq.nodesById.get(nodeId);
  if (!node) {
    console.log('No node for nodeId: ' + nodeId);
  }

  let summary = '#' + nodeId;
  if (node) {
    summary = summary + ':' + node.type;
    // TODO: show source code in summary
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
