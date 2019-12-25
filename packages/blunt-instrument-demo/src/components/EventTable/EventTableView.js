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
  highlightedNodeId,
  onHoveredNodeChange,
}) {
  const entries = [];

  for (const event of events) {
    entries.push(
      <tr key={event.step}>
        <td>{event.step}</td>
        <td><code>{event.source}</code></td>
        <td><ValueDisplay value={event.value} /></td>
      </tr>
    );
  }

  return (
    <div className="EventTable">
      <table>
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
