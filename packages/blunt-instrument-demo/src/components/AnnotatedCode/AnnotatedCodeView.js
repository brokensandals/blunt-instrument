import React from 'react';
import './AnnotatedCode.css';
import { getCodeSlice, getNodeId } from 'blunt-instrument-ast-utils';

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

function CodeForNode({
  code,
  highlightedNodeId,
  node,
  onHoveredNodeChange,
  onNodeSelectedToggle,
  selectedNodeIds,
}) {
  const { extra: { biNodeId: nodeId }, start, end } = node;
  let cur = start;
  const elements = [];

  // TODO does this sorting need to look at 'end' too?
  const children = findChildNodes(node).sort((a, b) => a.start - b.start);
  for (const child of children) {
    if (cur < child.start) {
      elements.push(code.slice(cur, child.start));
    }
    
    elements.push(
      <CodeForNode key={getNodeId(child)}
                     highlightedNodeId={highlightedNodeId}
                     node={child}
                     selectedNodeIds={selectedNodeIds}
                     code={code}
                     onHoveredNodeChange={onHoveredNodeChange}
                     onNodeSelectedToggle={onNodeSelectedToggle} />
    );

    cur = child.end;
  }

  if (cur < end) {
    elements.push(code.slice(cur, end));
  }

  const handleMouseOver = onHoveredNodeChange ? (event) => {
    onHoveredNodeChange(nodeId);
    event.stopPropagation();
  } : null;

  const handleClick = onNodeSelectedToggle ? (event) => {
    onNodeSelectedToggle(nodeId);
    event.stopPropagation();
  } : null;

  const className = [
    nodeId === highlightedNodeId ? 'highlighted' : '',
    selectedNodeIds.includes(nodeId) ? 'selected' : '',
  ].join(' ')

  return <span className={className}
               onClick={handleClick}
               onMouseOver={handleMouseOver}>
    {elements}
  </span>
}

function AnnotatedCodeView({
  astQuerier,
  highlightedNodeId,
  onHoveredNodeChange = null,
  onNodeSelectedToggle = null,
  selectedNodeIds,
}) {
  const clearHover = onHoveredNodeChange ? () => onHoveredNodeChange(null) : null;
  return (
    <pre className="AnnotatedCode" onMouseLeave={clearHover}>
      <code>
        <CodeForNode highlightedNodeId={highlightedNodeId}
                       node={astQuerier.ast}
                       selectedNodeIds={selectedNodeIds}
                       code={getCodeSlice(astQuerier.ast)}
                       onHoveredNodeChange={onHoveredNodeChange}
                       onNodeSelectedToggle={onNodeSelectedToggle} />
      </code>
    </pre>
  );
}

export default AnnotatedCodeView;