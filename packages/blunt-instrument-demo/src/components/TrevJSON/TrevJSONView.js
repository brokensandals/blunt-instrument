import React from 'react';
import './TrevJSON.css';

function TrevJSONView({
  trevs,
  highlightedTrevId,
  highlightedNodeId,
  onHoveredTrevChange = (trevId) => {},
  onNodeSelectedToggle = (nodeId) => {},
}) {
  const entries = [];

  for (const trev of trevs) {
    const { parentId, id, nodeId, ...rest } = trev;

    const handleMouseOver = () => onHoveredTrevChange(trev.id);
    const handleCodeClick = () => onNodeSelectedToggle(trev.nodeId);

    const className = [
      trev.id === highlightedTrevId ? 'highlighted-trev' : null,
      highlightedTrevId && trev.extra.ancestorIds.includes(highlightedTrevId) ? 'highlighted-trev-descendant' : null,
      trev.nodeId === highlightedNodeId ? 'highlighted-node' : null,
    ].join(' ');

    const generic = [];
    const keys = Object.keys(rest).filter(key => typeof rest[key] !== 'undefined');
    keys.forEach((key, index) => {
      generic.push(JSON.stringify(key, null, 2));
      generic.push(': ');
      generic.push(JSON.stringify(rest[key], null, 2));
      if (index != keys.length - 1) {
        generic.push(',\n  ');
      }
    });

    entries.push(<span className={className}>
      {"{\n  "}
      {typeof parentId === 'undefined' ? null : <span className="parentId">"parentId": {JSON.stringify(parentId)}{",\n  "}</span>}
      <span className="id">"id": {JSON.stringify(id, null, 2)}{",\n  "}</span>
      <span className="nodeId">"nodeId": {JSON.stringify(nodeId, null, 2)}{",\n  "}</span>
      {generic}
    </span>);
    if (trev != trevs[trevs.length - 1]) {
      entries.push(',\n');
    }
  }

  return (<pre className="TrevJSON">
    <code>
      {entries}
    </code>
  </pre>);
}

export default TrevJSONView;
