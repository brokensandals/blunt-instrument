import React from 'react';
import './TraceQueryForm.css';
import update from 'immutability-helper';
import Select from 'react-select';

export function TraceQueryFormView({
  highlightedNodeId,
  onTraceQueryChange = (query) => {},
  onHoveredNodeChange = (nodeId) => {},
  query,
  tc,
}) {
  function nodeOption(node, count) {
    const value = node.biKey;
    const codeSlice = node.codeSlice;
    const codePreview = codeSlice.length > 20 ? codeSlice.slice(0, 20) + '...' : codeSlice;
    let label = `[${value}] ${node.type}: ${codePreview}`;
    if (count !== undefined) {
      label += ` (${count})`;
    }
    return { value, label };
  }

  const facets = tc.getFacets();
  
  const nodesOptions = Array.from(facets.nodes.entries()).map(
    ([node, count]) => nodeOption(node, count));
  const nodesValue = Object.keys(query.nodes).filter((key) => query.nodes[key]).map(
    (nodeKey) => nodeOption(tc.astb.getNodeByKey(nodeKey)));

  const nodeTypesOptions = Array.from(facets.nodeTypes.entries()).map(
    ([type, count]) => ({ value: type, label: `${type} (${count})` }),
  );
  const nodeTypesValue = Object.keys(query.nodeTypes).filter((key) => query.nodeTypes[key]).map(
    (type) => ({ value: type, label: type }),
  );

  const handleNodesChange = (value) => {
    const nodes = {};
    (value || []).forEach((selected) => {
      nodes[selected.value] = true;
    });
    onTraceQueryChange(update(query, { nodes: { $set: nodes }}));
  }

  const handleNodeTypesChange = (value) => {
    const nodeTypes = {};
    (value || []).forEach((selected) => {
      nodeTypes[selected.value] = true;
    });
    onTraceQueryChange(update(query, { nodeTypes: { $set: nodeTypes } }));
  }

  return (
    <form className="TraceQueryForm">
      <div className="node-filters">
        <label className="label" id="node-filters-label">Only include nodes:</label>
        <Select className="node-filters-select"
                isMulti
                options={nodesOptions}
                value={nodesValue}
                onChange={handleNodesChange}
                placeholder="(all)"
                aria-labelledby="node-filters-select" />
      </div>

      <div className="node-type-filters">
        <label className="label" id="node-type-filters-label">Exclude node types:</label>
        <Select className="node-type-filters-select"
                isMulti
                options={nodeTypesOptions}
                value={nodeTypesValue}
                onChange={handleNodeTypesChange}
                placeholder="(all)"
                aria-labelledby="node-type-filters-label" />
      </div>
    </form>
  );
}

export default TraceQueryFormView;
