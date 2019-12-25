import React from 'react';
import './ASTNav.css';

function locString({ start, end }) {
  return '' + start.line + ':' + start.column + '-' +
    end.line + ':' + end.column;
}

function ASTObjectView({
  highlightedNodeId,
  object,
  onHoveredNodeChange
}) {
  const {
    nodeId = null,
    type = null,
    loc = null,
    start = null,
    end = null,
    ...rest
  } = object;

  const typeEl = type ? <span className="type">{type}</span> : null;
  const locEl = loc ? <span className="loc">{locString(loc)}</span> : null; //TODO

  const entries = [];

  for (const key in rest) {
    const val = object[key];

    if ((Array.isArray(val) && val.length == 0) ||
        (typeof val === 'object' && (val == null || Object.keys(val).length == 0))) {
      // don't display it
    }
    else if (Array.isArray(val)) {
      entries.push([1, key,
        <ol>
          {val.map((item, index) => (
            <li key={index}>
              <ASTObjectView object={item}
                             highlightedNodeId={highlightedNodeId}
                             onHoveredNodeChange={onHoveredNodeChange} />
            </li>
          ))}
        </ol>
      ]);
    } else if (typeof val === 'object' && val != null) {
      entries.push([1, key,
        <ASTObjectView object={val}
                       highlightedNodeId={highlightedNodeId}
                       onHoveredNodeChange={onHoveredNodeChange} />
      ]);
    } else {
      entries.push([0, key, <span className="primitive">{JSON.stringify(val)}</span>]);
    }
  }

  entries.sort();

  const handleMouseOver = nodeId && onHoveredNodeChange ? (event) => {
    onHoveredNodeChange(nodeId);
    event.stopPropagation();
  } : null;

  const className = [
    'object',
    nodeId ? 'node' : null,
    nodeId && nodeId === highlightedNodeId ? 'highlighted' : null
  ].join(' ');

  return (
    <div className={className} onMouseOver={handleMouseOver}>
      {typeEl} {locEl}
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
  highlightedNodeId,
  onHoveredNodeChange = null
}) {
  const clearHover = onHoveredNodeChange ? () => onHoveredNodeChange(null) : null;

  return (
    <div className="ASTNav" onMouseLeave={clearHover}>
      <ASTObjectView object={ast}
                     highlightedNodeId={highlightedNodeId}
                     onHoveredNodeChange={onHoveredNodeChange} />
    </div>
  );
}

export default ASTNavView;
