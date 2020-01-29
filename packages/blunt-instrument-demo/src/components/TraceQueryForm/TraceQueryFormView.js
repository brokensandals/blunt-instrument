import React from 'react';
import './TraceQueryForm.css';
import update from 'immutability-helper';
import Select from 'react-select';

export function TraceQueryFormView({
  highlightedNodeId,
  onTraceQueryChange = (query) => {},
  onHoveredNodeChange = (nodeId) => {},
  query,
  stats,
}) {
  // TODO: a little hacky to be building this map here
  const nodesByKeyAndId = new Map();
  stats.nodes.keys().forEach((node) => nodesByKeyAndId.set(`${node.astKey}:${node.biId}`, node));

  function nodeOption(node, count) {
    const value = `${node.astKey}:${node.biId}`;
    const codeSlice = node.codeSlice;
    const codePreview = codeSlice.length > 20 ? codeSlice.slice(0, 20) + '...' : codeSlice;
    const label = `[${value}] ${node.type} (${count}): ${codePreview}`;
    return { value, label };
  }

  const includeNodesOptions = stats.nodes.entries().map(nodeOption);
  const includeNodesValue = query.nodes.map((node) =>
    nodeOption(node, stats.nodes.get(node))
  );

  const handleIncludeNodesChange = (value) => {
    const nodes = (value || []).map((selected) => nodesByKeyAndId.get(selected.value));
    onTraceQueryChange(update(query, { nodes: { $set: nodes } }));
  }

  function nodeTypeOption(nodeType, count) {
    return { nodeType, label: `${nodeType} (${count})` };
  }
  const includeNodeTypesOptions = stats.nodeTypes.entries().map(nodeTypeOption);
  const includeNodeTypesValue = query.nodeTypes.map((nodeType) =>
    nodeTypeOption(nodeType, stats.nodeTypes.get(nodeType))
  );

  const handleIncludeNodeTypesChange = (value) => {
    onTraceQueryChange(update(query, { nodeTypes: { $set: (value || []).map(option => option.value) } }));
  }

  return (
    <form className="TraceQueryForm">
      <div className="node-filters">
        <label className="label" id="node-filters-label">Only include nodes:</label>
        <Select className="node-filters-select"
                isMulti
                options={includeNodesOptions}
                value={includeNodesValue}
                onChange={handleIncludeNodesChange}
                placeholder="(all)"
                aria-labelledby="node-filters-select" />
      </div>

      <div className="node-type-filters">
        <label className="label" id="node-type-filters-label">Exclude node types:</label>
        <Select className="node-type-filters-select"
                isMulti
                options={includeNodeTypesOptions}
                value={includeNodeTypesValue}
                onChange={handleIncludeNodeTypesChange}
                placeholder="(all)"
                aria-labelledby="node-type-filters-label" />
      </div>
    </form>
  );
}

export default TraceQueryFormView;
