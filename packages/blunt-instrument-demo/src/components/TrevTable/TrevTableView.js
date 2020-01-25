import React from 'react';
import './TrevTable.css';

function ValuePreview({ value }) {
  if (value === undefined) {
    return null;
  } else if (value === null) {
    return <span className="preview-null">null</span>;
  }

  switch (typeof value) {
    case 'number':
      return <span className="preview-number">{value}</span>;
    case 'boolean':
      return <span className="preview-boolean">{value.toString()}</span>;
    case 'string':
      return <span className="preview-string">{JSON.stringify(value)}</span>;
    case 'object':
      switch (value.type) {
        case 'array':
          {
            const keys = Object.keys(value);
            const results = [];
            results.push(<span className="preview-array-start">[</span>);
            let count = 0;
            for (let i = 0; i < keys.length; i++) {
              const key = keys[i];
              if (key === 'type' || key === 'id') {
                continue;
              }
              if (count > 0) {
                results.push(<span className="preview-array-comma">,</span>);
              }
              if (count > 5 || key !== `.${count}`) {
                results.push(<span className="preview-array-more">...</span>);
                break;
              }
              count++;
              results.push(<span className="preview-array-element"><ValuePreview value={value[key]} /></span>)
            }
            results.push(<span className="preview-array-end">]</span>);
            return <span className="preview-array">{results}</span>;
          }
        case 'bigint':
          return <span className="preview-bigint">{value.string}</span>;
        case 'builtin':
          return <span className="preview-builtin">{value.name}</span>;
        case 'function':
          if (value['.name'] && value['.name'].value) {
            return <span className="preview-function">{value['.name'].value}</span>;
          } else {
            let truncated = value.source.slice(0, 20);
            if (truncated.length < value.source.length) {
              truncated += '...';
            }
            return <span className="preview-function">{truncated}</span>;
          }
        case 'object':
          return 'TODO';
        case 'symbol':
          if (value.description) {
            return <span className="preview-symbol">~{value.description}</span>;
          } else {
            return <span className="preview-symbol">~{value.id}</span>;
          }
        default:
          return JSON.stringify(value);
      }
    default:
      return '???';
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
      highlightedNodeId != null && trev.nodeId === highlightedNodeId ? 'highlighted-node' : null,
    ].join(' ');

    const handleCodeClick = () => onNodeSelectedToggle(trev.nodeId);

    entries.push(
      <tr key={trev.id} onMouseOver={handleMouseOver} className={className}>
        <td className="parent-id">{trev.parentId}</td>
        <td className="id">{trev.id}</td>
        <td className="type">{trev.type}</td>
        <td className="node" onClick={handleCodeClick}>
          <code>{trev.extra.node.codeSlice}</code>
        </td>
        <td className="data">
          <ValuePreview value={trev.data} />
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
