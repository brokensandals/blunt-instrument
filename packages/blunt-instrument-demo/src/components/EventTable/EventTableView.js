import React from 'react';
import './EventTable.css';

function ValueDisplay({ value }) {
  switch (value) {
    case null:
    case true:
    case false:
    case undefined:
      return <span class="primitive">{'' + value}</span>
    
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
          return <span class="primitive">{JSON.stringify(value)}</span>;
        case 'symbol':
          return <span class="primitive">{value.toString()}</span>;
      }
  }
}

function EventTableView({
  events,
  highlightedEventId,
  highlightedNodeId,
  onHoveredEventChange,
}) {
  const entries = [];

  for (const event of events) {
    const handleMouseOver = onHoveredEventChange ? (ev) => {
      onHoveredEventChange(event.step); // TODO create real eventId
    } : null;

    const className = [
      highlightedEventId != null && event.step === highlightedEventId ? 'highlighted-event' : null,
      highlightedNodeId != null && event.nodeId === highlightedNodeId ? 'highlighted-node' : null,
    ].join(' ');

    entries.push(
      <tr key={event.step} onMouseOver={handleMouseOver} className={className}>
        <td>{event.step}</td>
        <td><code>{event.source}</code></td>
        <td><ValueDisplay value={event.value} /></td>
      </tr>
    );
  }

  const clearHover = onHoveredEventChange ? () => onHoveredEventChange(null) : null;

  return (
    <div className="EventTable">
      <table onMouseLeave={clearHover}>
        <thead>
          <tr>
            <th>step</th>
            <th>code</th>
            <th>value</th>
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
