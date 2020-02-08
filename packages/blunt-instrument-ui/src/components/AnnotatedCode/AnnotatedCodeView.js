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
  highlightedNodeKey,
  node,
  onHoveredNodeChange,
  onNodeSelectedToggle,
  selectedNodeKeys,
}) {
  const { biKey: nodeKey, start, end } = node;
  let cur = start;
  const elements = [];

  // For code using shorthand object property notation, i.e. `{x}` instead of `{x: x}`,
  // there are three nodes corresponding to the code `x`: the ObjectProperty, ObjectProperty.id,
  // and ObjectProperty.value. This special case is here to avoid displaying `x` multiple times,
  // and to make sure the one we display is the one that trevs will actually be attached to.
  if (node.type === 'ObjectProperty' && node.shorthand) {
    return <CodeForNode key={node.value.biKey}
                        highlightedNodeKey={highlightedNodeKey}
                        node={node.value}
                        selectedNodeKeys={selectedNodeKeys}
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
      <CodeForNode key={child.biKey}
                     highlightedNodeKey={highlightedNodeKey}
                     node={child}
                     selectedNodeKeys={selectedNodeKeys}
                     code={code}
                     onHoveredNodeChange={onHoveredNodeChange}
                     onNodeSelectedToggle={onNodeSelectedToggle} />
    );

    cur = child.end;
  }

  if (cur < end) {
    elements.push(code.slice(cur, end));
  }

  const handleMouseOver = nodeKey && onHoveredNodeChange ? (event) => {
    onHoveredNodeChange(nodeKey);
    event.stopPropagation();
  } : null;

  const handleClick = nodeKey && onNodeSelectedToggle ? (event) => {
    onNodeSelectedToggle(nodeKey);
    event.stopPropagation();
  } : null;

  const className = [
    nodeKey && nodeKey === highlightedNodeKey ? 'highlighted' : '',
    nodeKey && selectedNodeKeys.includes(nodeKey) ? 'selected' : '',
  ].join(' ')

  return <span className={className}
               onClick={handleClick}
               onMouseOver={handleMouseOver}>
    {elements}
  </span>
}

function AnnotatedCodeView({
  ast,
  highlightedNodeKey,
  onHoveredNodeChange = null,
  onNodeSelectedToggle = null,
  selectedNodeKeys,
}) {
  const clearHover = onHoveredNodeChange ? () => onHoveredNodeChange(null) : null;
  return (
    <pre className="AnnotatedCode" onMouseLeave={clearHover}>
      <code>
        <CodeForNode highlightedNodeKey={highlightedNodeKey}
                       node={ast}
                       selectedNodeKeys={selectedNodeKeys}
                       code={ast.codeSlice}
                       onHoveredNodeChange={onHoveredNodeChange}
                       onNodeSelectedToggle={onNodeSelectedToggle} />
      </code>
    </pre>
  );
}

export default AnnotatedCodeView;