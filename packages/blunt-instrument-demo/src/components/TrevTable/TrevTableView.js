import React from 'react';
import './TrevTable.css';
import { getCodeSlice, getNodeId } from 'blunt-instrument-ast-utils';

function ValueDisplay({ value }) {
  switch (value) {
    case null:
    case true:
    case false:
    case undefined:
      return <span className="primitive">{'' + value}</span>
    
    default:
      switch (typeof value) {
        case 'function':
          return <code className="function">{value.toString()}</code>;
        case 'object':
          if (Array.isArray(value)) {
            const items = [];
            for (let i = 0; i < value.length; i++) {
              items.push(<ValueDisplay key={i} value={value[i]} />);
              items.push(', ');
            }
            return ['[', items, ']'];
          }

          const items = [];
          for (const key in value) {
            items.push(key, ': ');
            items.push(<ValueDisplay key={key} value={value[key]} />);
            items.push(', ');
          }
          return ['{', items, '}'];
        case 'number':
        case 'bigint':
        case 'string':
          return <span className="primitive">{JSON.stringify(value)}</span>;
        case 'symbol':
          return <span className="primitive">{value.toString()}</span>;
        default:
          return typeof value;
      }
  }
}

function TrevTableView({
  trevs,
  highlightedTrevId,
  highlightedNodeId,
  onHoveredTrevChange = (trevId) => {},
  onNodeSelectedToggle = (nodeId) => {},
}) {
  const entries = [];

  for (const trev of trevs) {
    const handleMouseOver = onHoveredTrevChange ? (ev) => {
      onHoveredTrevChange(trev.id);
    } : null;

    const className = [
      highlightedTrevId != null && trev.id === highlightedTrevId ? 'highlighted-trev' : null,
      highlightedTrevId != null && trev.extra.ancestorIds.includes(highlightedTrevId) ? 'highlighted-trev-descendant' : null,
      highlightedNodeId != null && getNodeId(trev.extra.node) === highlightedNodeId ? 'highlighted-node' : null,
    ].join(' ');

    const handleCodeClick = () => onNodeSelectedToggle(getNodeId(trev.extra.node));
    const handleLogValueClick = () => console.log(trev.data);

    entries.push(
      <tr key={trev.id} onMouseOver={handleMouseOver} className={className}>
        <td className="parent-id">{trev.parentId}</td>
        <td className="id">{trev.id}</td>
        <td className="type">{trev.type}</td>
        <td className="node" onClick={handleCodeClick}>
          <code>{getCodeSlice(trev.extra.node)}</code>
        </td>
        <td className="value">
          <ValueDisplay value={trev.data} />
          <button className="console-log" onClick={handleLogValueClick}>log</button>
        </td>
      </tr>
    );
  }

  const clearHover = onHoveredTrevChange ? () => onHoveredTrevChange(null) : null;

  return (
    <div className="TrevTable">
      <table onMouseLeave={clearHover}>
        <thead>
          <tr>
            <th className="parent-id">parent</th>
            <th className="id">id</th>
            <th className="type">type</th>
            <th className="node">code</th>
            <th className="data">data</th>
          </tr>
        </thead>
        <tbody>
          {entries}
        </tbody>
      </table>
    </div>
  );
}

export default TrevTableView;
