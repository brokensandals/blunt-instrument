import React from 'react';
import './TraceQueryForm.css';
import update from 'immutability-helper';
import Select from 'react-select';

export function TraceQueryFormView({
  highlightedNodeId,
  onTraceQueryChange = (query) => {},
  onHoveredNodeChange = (nodeId) => {},
  querier,
  query,
}) {
  function nodeOption(node) {
    const value = node.biId;
    const codeSlice = node.codeSlice;
    const codePreview = codeSlice.length > 20 ? codeSlice.slice(0, 20) + '...' : codeSlice;
    const label = `[${value}] ${node.type}: ${codePreview}`;
    return { value, label };
  }
  const includeNodesOptions = [];
  for (const node of querier.astb.filterNodes(Boolean)) {
    includeNodesOptions.push(nodeOption(node));
  }

  const includeNodesValue = [];
  for (const nodeId in query.filters.onlyNodeIds) {
    if (query.filters.onlyNodeIds[nodeId]) {
      includeNodesValue.push(nodeOption(querier.astb.getNode('eval', Number(nodeId))));
    }
  }

  const handleIncludeNodesChange = (value) => {
    const onlyNodeIds = {};
    for (const selected of (value || [])) {
      onlyNodeIds[selected.value] = true;
    }
    onTraceQueryChange(update(query, { filters: { onlyNodeIds: { $set: onlyNodeIds }}}))
  }

  const excludeNodeTypesOptions = [];
  for (const type of new Set(querier.query().map(trev => trev.denormalized.node.type))) {
    excludeNodeTypesOptions.push({ value: type, label: type });
  }

  const excludeNodeTypesValue = query.filters.excludeNodeTypes
    .map(type => ({
      value: type, label: type
    }));

  const handleExcludeNodeTypesChange = (value) => {
    onTraceQueryChange(update(query, { filters: { excludeNodeTypes: { $set: (value || []).map(option => option.value) } } }));
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
                options={excludeNodeTypesOptions}
                value={excludeNodeTypesValue}
                onChange={handleExcludeNodeTypesChange}
                placeholder="(none)"
                aria-labelledby="node-type-filters-label" />
      </div>
    </form>
  );
}

export default TraceQueryFormView;
