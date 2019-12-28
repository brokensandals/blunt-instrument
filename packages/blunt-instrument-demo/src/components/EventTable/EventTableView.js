import React from 'react';
import './EventTable.css';

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
          // TODO
          return 'function';
        case 'object':
          // TODO
          return 'object';
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

function EventTableView({
  events,
  highlightedEventId,
  highlightedNodeId,
  onHoveredEventChange = null,
  onNodeSelectedToggle = null,
}) {
  const entries = [];

  for (const event of events) {
    const handleMouseOver = onHoveredEventChange ? (ev) => {
      onHoveredEventChange(event.id);
    } : null;

    const className = [
      highlightedEventId != null && event.id === highlightedEventId ? 'highlighted-event' : null,
      highlightedNodeId != null && event.node.extra.biNodeId === highlightedNodeId ? 'highlighted-node' : null,
    ].join(' ');

    function codeClickHandler(nodeId) {
      return onNodeSelectedToggle ? () => onNodeSelectedToggle(nodeId) : null;
    }

    entries.push(
      <tr key={event.id} onMouseOver={handleMouseOver} className={className}>
        <td className="id">{event.id}</td>
        <td className="node"
            onClick={codeClickHandler(event.node.extra.biNodeId)}>
          <code>{event.node.extra.code}</code>
        </td>
        <td className="value"><ValueDisplay value={event.value} /></td>
      </tr>
    );
  }

  const clearHover = onHoveredEventChange ? () => onHoveredEventChange(null) : null;

  return (
    <div className="EventTable">
      <table onMouseLeave={clearHover}>
        <thead>
          <tr>
            <th className="id">id</th>
            <th className="node">code</th>
            <th className="value">value</th>
          </tr>
        </thead>
        <tbody>
          {entries}
        </tbody>
      </table>
    </div>
  );
}

export default EventTableView;
