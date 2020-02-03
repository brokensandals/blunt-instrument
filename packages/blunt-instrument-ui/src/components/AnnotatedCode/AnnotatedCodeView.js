import React from 'react';
import './AnnotatedCode.css';

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
  const { biId: nodeId, start, end } = node;
  let cur = start;
  const elements = [];

  // For code using shorthand object property notation, i.e. `{x}` instead of `{x: x}`,
  // there are three nodes corresponding to the code `x`: the ObjectProperty, ObjectProperty.id,
  // and ObjectProperty.value. This special case is here to avoid displaying `x` multiple times,
  // and to make sure the one we display is the one that trevs will actually be attached to.
  if (node.type === 'ObjectProperty' && node.shorthand) {
    return <CodeForNode key={node.value.biId}
                        highlightedNodeId={highlightedNodeId}
                        node={node.value}
                        selectedNodeIds={selectedNodeIds}
                        code={code}
                        onHoveredNodeChange={onHoveredNodeChange}
                        onNodeSelectedToggle={onNodeSelectedToggle} />;
  }

  // TODO does this sorting need to look at 'end' too?
  const children = findChildNodes(node).sort((a, b) => a.start - b.start);
  for (const child of children) {
    if (cur < child.start) {
      elements.push(code.slice(cur, child.start));
    }
    
    elements.push(
      <CodeForNode key={child.biId}
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

  const handleMouseOver = nodeId && onHoveredNodeChange ? (event) => {
    onHoveredNodeChange(nodeId);
    event.stopPropagation();
  } : null;

  const handleClick = nodeId && onNodeSelectedToggle ? (event) => {
    onNodeSelectedToggle(nodeId);
    event.stopPropagation();
  } : null;

  const className = [
    nodeId && nodeId === highlightedNodeId ? 'highlighted' : '',
    nodeId && selectedNodeIds.includes(nodeId) ? 'selected' : '',
  ].join(' ')

  return <span className={className}
               onClick={handleClick}
               onMouseOver={handleMouseOver}>
    {elements}
  </span>
}

function AnnotatedCodeView({
  ast,
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
                       node={ast}
                       selectedNodeIds={selectedNodeIds}
                       code={ast.codeSlice}
                       onHoveredNodeChange={onHoveredNodeChange}
                       onNodeSelectedToggle={onNodeSelectedToggle} />
      </code>
    </pre>
  );
}

export default AnnotatedCodeView;