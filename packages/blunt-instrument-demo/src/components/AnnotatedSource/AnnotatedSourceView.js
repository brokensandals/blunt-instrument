import React from 'react';
import './AnnotatedSource.css';

// TODO babel probably provides a better way to do this
function findNodes(object) {
  if (object == null || typeof object !== 'object') {
    return [];
  }

  if (Array.isArray(object)) {
    return object.flatMap(findNodes);
  }

  if (object.type) {
    return [object];
  }

  return Object.keys(object).flatMap(k => findNodes(object[k]));
}

function findChildNodes(node) {
  return Object.keys(node).flatMap(k => findNodes(node[k]));
}

function SourceForNode({
  highlightedNodeId,
  node,
  onHoveredNodeChange,
  source
}) {
  const { nodeId, start, end } = node;
  let cur = start;
  const elements = [];

  // TODO does this sorting need to look at 'end' too?
  const children = findChildNodes(node).sort((a, b) => a.start - b.start);
  for (const child of children) {
    if (cur < child.start) {
      elements.push(source.slice(cur, child.start));
    }
    
    elements.push(
      <SourceForNode key={child.nodeId}
                     highlightedNodeId={highlightedNodeId}
                     node={child}
                     source={source}
                     onHoveredNodeChange={onHoveredNodeChange} />
    );

    cur = child.end;
  }

  if (cur < end) {
    elements.push(source.slice(cur, end));
  }

  const handleMouseOver = onHoveredNodeChange ? (event) => {
    onHoveredNodeChange(nodeId);
    event.stopPropagation();
  } : null;

  const className = nodeId === highlightedNodeId ? 'highlighted' : '';

  return <span className={className} onMouseOver={handleMouseOver}>
    {elements}
  </span>
}

function AnnotatedSourceView({
  ast,
  highlightedNodeId,
  onHoveredNodeChange = null,
  source
}) {
  const clearHover = onHoveredNodeChange ? () => onHoveredNodeChange(null) : null;
  return (
    <pre className="AnnotatedSource" onMouseLeave={clearHover}>
      <code>
        <SourceForNode highlightedNodeId={highlightedNodeId}
                       node={ast}
                       source={source}
                       onHoveredNodeChange={onHoveredNodeChange} />
      </code>
    </pre>
  );
}

export default AnnotatedSourceView;