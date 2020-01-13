import React from 'react';
import './TraceQueryForm.css';
import { getCodeSlice } from 'blunt-instrument-ast-utils';
import update from 'immutability-helper';
import Select from 'react-select';

function NodeFilter({
  highlighted,
  nodeId,
  onHoveredNodeChange,
  onNodeSelectedToggle,
  querier,
}) {
  const node = querier.astQuerier.getNodeById(nodeId);
  if (!node) {
    console.log('No node for nodeId: ' + nodeId);
  }

  const summary = [<span className="id">{nodeId}</span>]
  if (node) {
    summary.push(<code className="summary">{getCodeSlice(node)}</code>);
  }

  const handleMouseLeave = () => onHoveredNodeChange(null);
  const handleMouseOver = () => onHoveredNodeChange(nodeId);

  const handleClick = (event) => {
    onNodeSelectedToggle(nodeId);
    event.preventDefault();
  };

  const className = [
    'node',
    highlighted ? 'highlighted' : null
  ].join(' ');
  return (
    <span className={className}
          onClick={handleClick}
          onMouseLeave={handleMouseLeave}
          onMouseOver={handleMouseOver}>
      {summary}
    </span>
  );
}

export function TraceQueryFormView({
  highlightedNodeId,
  onTraceQueryChange = (query) => {},
  onHoveredNodeChange = (nodeId) => {},
  onNodeSelectedToggle = (nodeId) => {},
  querier,
  query,
}) {
  const nodeFilters = [];
  const onlyNodeIds = query.filters.onlyNodeIds ?
    Object.keys(query.filters.onlyNodeIds)
      .filter(k => query.filters.onlyNodeIds[k]) : [];
  if (onlyNodeIds.length > 0) {
    for (const nodeId of onlyNodeIds) {
      nodeFilters.push(
        <li key={nodeId}>
          <NodeFilter highlighted={highlightedNodeId === nodeId}
                      nodeId={nodeId}
                      querier={querier}
                      onHoveredNodeChange={onHoveredNodeChange}
                      onNodeSelectedToggle={onNodeSelectedToggle} />
        </li>);
    }
  }

  const excludeNodeTypeOptions = [];
  for (const type of new Set(querier.query().map(trev => trev.extra.node.type))) {
    excludeNodeTypeOptions.push({ value: type, label: type });
  }

  const excludeNodeTypeValue = query.filters.excludeNodeTypes
    .map(type => ({
      value: type, label: type
    }));

  const handleExcludeNodeTypesChange = (value) => {
    onTraceQueryChange(update(query, { filters: { excludeNodeTypes: { $set: (value || []).map(option => option.value) } } }));
  }

  return (
    <form className="TraceQueryForm">
      <div className="node-filters">
        {nodeFilters.length > 0 ? 'Only showing values for:' : ''}
        <ul>{nodeFilters}</ul>
      </div>

      <div className="node-type-filters">
        <label className="label" id="node-type-filters-label">Exclude node types:</label>
        <Select className="node-type-filters-select"
                isMulti
                options={excludeNodeTypeOptions}
                value={excludeNodeTypeValue}
                onChange={handleExcludeNodeTypesChange}
                placeholder="(none)"
                aria-labelledby="node-type-filters-label" />
      </div>
    </form>
  );
}

export default TraceQueryFormView;
