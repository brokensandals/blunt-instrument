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
          return <code className="function">{value.toString()}</code>;
        case 'object':
          if (Array.isArray(value)) {
            const items = [];
            for (const val of value) {
              items.push(<ValueDisplay value={val} />);
              items.push(', ');
            }
            return ['[', items, ']'];
          }

          const items = [];
          for (const key in value) {
            items.push(key, ': ');
            items.push(<ValueDisplay value={value[key]} />);
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

function EventTableView({
  events,
  highlightedEventId,
  highlightedNodeId,
  onHoveredEventChange = (eventId) => {},
  onNodeSelectedToggle = (nodeId) => {},
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

    const handleCodeClick = () => onNodeSelectedToggle(event.node.extra.biNodeId);
    const handleLogValueClick = () => console.log(event.value);

    entries.push(
      <tr key={event.id} onMouseOver={handleMouseOver} className={className}>
        <td className="id">{event.id}</td>
        <td className="node" onClick={handleCodeClick}>
          <code>{event.node.extra.code}</code>
        </td>
        <td className="value">
          <ValueDisplay value={event.value} />
          <button className="console-log" onClick={handleLogValueClick}>log</button>
        </td>
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
