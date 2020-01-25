import React from 'react';
import './TrevTable.css';

function ValuePreview({ value, trevType }) {
  const output = [];

  function recurse(current, classes = '', top = false) {
    if (current === undefined) {
      return;
    } else if (current === null) {
      output.push(<span className={`preview-null ${classes}`}>null</span>);
      return;
    }
  
    switch (typeof current) {
      case 'number':
        output.push(<span className={`preview-number ${classes}`}>{current}</span>);
        return;
      case 'boolean':
        output.push(<span className={`preview-boolean ${classes}`}>{current.toString()}</span>);
        return;
      case 'string':
        output.push(<span className={`preview-string ${classes}`}>{JSON.stringify(current)}</span>);
        return;
      case 'object':
        switch (current.type) {
          case 'array':
            {
              const keys = Object.keys(current);
              output.push(<span className="preview-array-start">[</span>);
              let count = 0;
              let fixedWidth = top;
              for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (key === 'type' || key === 'id') {
                  continue;
                }
                if (count > 0) {
                  output.push(<span className="preview-array-comma">,</span>);
                }
                if (count > 4 || key !== `.${count}`) {
                  output.push(<span className="preview-array-more">...</span>);
                  break;
                }
                fixedWidth = fixedWidth
                              && (current[key] === null
                                  || typeof current[key] === 'boolean'
                                  || typeof current[key] === 'number');
                count++;
                recurse(current[key], fixedWidth ? 'preview-array-fixed-element' : '');
              }
              output.push(<span className="preview-array-end">]</span>);
              return;
            }
          case 'bigint':
            output.push(<span className={`preview-bigint ${classes}`}>{current.string}</span>);
            return;
          case 'builtin':
            output.push(<span className={`preview-builtin ${classes}`}>{current.name}</span>);
            return;
          case 'function':
            if (current['.name'] && current['.name'].value) {
              output.push(<span className={`preview-function ${classes}`}>{current['.name'].value}</span>);
            } else {
              let truncated = current.source.slice(0, 20);
              if (truncated.length < current.source.length) {
                truncated += '...';
              }
              output.push(<span className={`preview-function ${classes}`}>{truncated}</span>);
            }
            return;
          case 'object':
            {
              output.push(<span className="preview-object-start">{'{'}</span>);
              let more = false;
              const keys = Object.keys(current);
              let count = 0;
              for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (key === 'type' || key === 'id') {
                  continue;
                }
                if (top && (key === '.arguments' || key === '.this')) {
                  more = true;
                  continue;
                }
                if (key === 'prototype') {
                  more = true;
                  continue;
                }
                if (count > 4 || !key.startsWith('.')) {
                  more = true;
                  break;
                }
                if (count > 0) {
                  output.push(<span className="preview-object-comma">,</span>);
                }
                count++;
                output.push(<span className="preview-object-key">{key.slice(1)}</span>);
                output.push(<span className="preview-object-colon">:</span>);
                recurse(current[key]);
              }
              if (more) {
                if (count > 0) {
                  output.push(<span className="preview-object-comma">,</span>);
                }
                output.push(<span className="preview-object-more">...</span>);
              }
              output.push(<span className="preview-object-end">{'}'}</span>);
              return;
            }
          case 'symbol':
            if (current.description) {
              output.push(<span className={`preview-symbol ${classes}`}>~{current.description}</span>);
            } else {
              output.push(<span className={`preview-symbol ${classes}`}>~{current.id}</span>);
            }
            return;
          default:
            output.push(JSON.stringify(value));
            return;
        }
      default:
        output.push('???');
        return;
    }
  }

  recurse(value, '', true);

  return output;
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
          <ValuePreview value={trev.data} trevType={trev.type} />
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
