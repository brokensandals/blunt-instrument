import React from 'react';
import './ASTNav.css';

function locString({ start, end }) {
  return '' + start.line + ':' + start.column + '-' +
    end.line + ':' + end.column;
}

function ASTObjectView({
  highlightedNodeKey,
  object,
  onHoveredNodeChange,
  onNodeSelectedToggle,
  selectedNodeKeys,
}) {
  const {
    biId: nodeId,
    biKey: nodeKey,
    type,
    loc,
    // eslint-disable-next-line no-unused-vars
    biASTId,
    // eslint-disable-next-line no-unused-vars
    start,
    // eslint-disable-next-line no-unused-vars
    end,
    // eslint-disable-next-line no-unused-vars
    codeSlice,
    ...rest
  } = object;

  const typeEl = type ? <span className="type">{type}</span> : null;
  const nodeIdEl = nodeId ? <span className="nodeId">{nodeId}</span> : null;
  const locEl = loc ? <span className="loc">{locString(loc)}</span> : null; //TODO

  const entries = [];

  for (const key in rest) {
    const val = rest[key];

    if ((Array.isArray(val) && val.length === 0) ||
        (typeof val === 'object' && (val == null || Object.keys(val).length === 0)) ||
        typeof val === 'undefined') {
      // don't display it
    }
    else if (Array.isArray(val)) {
      entries.push([1, key,
        <ol>
          {val.map((item, index) => (
            <li key={index}>
              <ASTObjectView object={item}
                             highlightedNodeKey={highlightedNodeKey}
                             onHoveredNodeChange={onHoveredNodeChange}
                             onNodeSelectedToggle={onNodeSelectedToggle}
                             selectedNodeKeys={selectedNodeKeys} />
            </li>
          ))}
        </ol>
      ]);
    } else if (typeof val === 'object' && val != null) {
      entries.push([1, key,
        <ASTObjectView object={val}
                       highlightedNodeKey={highlightedNodeKey}
                       onHoveredNodeChange={onHoveredNodeChange}
                       onNodeSelectedToggle={onNodeSelectedToggle}
                       selectedNodeKeys={selectedNodeKeys} />
      ]);
    } else {
      entries.push([0, key, <span className="primitive">{JSON.stringify(val)}</span>]);
    }
  }

  entries.sort();

  const handleMouseOver = nodeKey && onHoveredNodeChange ? (event) => {
    onHoveredNodeChange(nodeKey);
    event.stopPropagation();
  } : null;

  const handleClick = nodeKey && onNodeSelectedToggle ? (event) => {
    onNodeSelectedToggle(nodeKey);
    event.stopPropagation();
  } : null;

  const className = [
    'object',
    nodeKey ? 'node' : null,
    nodeKey && nodeKey === highlightedNodeKey ? 'highlighted' : null,
    nodeKey && selectedNodeKeys.includes(nodeKey) ? 'selected' : null,
  ].join(' ');

  return (
    <div className={className} onMouseOver={handleMouseOver} onClick={handleClick}>
      {nodeIdEl} {typeEl} {locEl}
      <dl>
        {entries.map(([_, key, val], index) =>
          [
            <dt key={'k' + index}>{key}</dt>,
            <dd key={'v' + index}>{val}</dd>
          ]
        )}
      </dl>
    </div>
  );
}

function ASTNavView({
  ast,
  highlightedNodeKey,
  onHoveredNodeChange = null,
  onNodeSelectedToggle = null,
  selectedNodeKeys = [],
}) {
  const clearHover = onHoveredNodeChange ? () => onHoveredNodeChange(null) : null;

  return (
    <div className="ASTNav" onMouseLeave={clearHover}>
      <ASTObjectView object={ast}
                     highlightedNodeKey={highlightedNodeKey}
                     onHoveredNodeChange={onHoveredNodeChange}
                     onNodeSelectedToggle={onNodeSelectedToggle}
                     selectedNodeKeys={selectedNodeKeys} />
    </div>
  );
}

export default ASTNavView;
