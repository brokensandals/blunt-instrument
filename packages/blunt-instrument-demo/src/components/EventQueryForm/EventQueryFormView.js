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
  let nodesFilter = null;
  if (query.filters.includeNodeIds) {
    const elements = [];
    for (const nodeId of query.filters.includeNodeIds) {
      elements.push(
        <NodeFilter highlighted={highlightedNodeId === nodeId}
                    nodeId={nodeId}
                    querier={querier}
                    onHoveredNodeChange={onHoveredNodeChange}
                    onNodeSelectedToggle={onNodeSelectedToggle} />);
    }
    nodesFilter = <p>Only showing values for: {elements}</p>
  }

  return (
    <form className="EventQueryForm">
      {nodesFilter}
    </form>
  );
}

export default EventQueryFormView;
