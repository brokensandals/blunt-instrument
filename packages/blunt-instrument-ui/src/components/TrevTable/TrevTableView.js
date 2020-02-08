import React from 'react';
import SmallDataPreview from '../SmallDataPreview';
import './TrevTable.css';

function TrevTableView({
  trevs,
  highlightedTrevId,
  highlightedNodeKey,
  onHoveredTrevChange = (trevId) => {},
  onNodeSelectedToggle = (nodeKey) => {},
  onOpenModalData = (modalData) => {},
  onTrevTypeSelectedToggle = (type) => {},
}) {
  const entries = [];

  for (const trev of trevs) {
    const handleMouseOver = onHoveredTrevChange ? (ev) => {
      onHoveredTrevChange(trev.id);
    } : null;

    const className = [
      highlightedTrevId != null && trev.id === highlightedTrevId ? 'highlighted-trev' : null,
      highlightedTrevId != null && trev.denormalized.ancestorIds.includes(highlightedTrevId) ? 'highlighted-trev-descendant' : null,
      highlightedNodeKey != null && trev.denormalized.node.biKey === highlightedNodeKey ? 'highlighted-node' : null,
    ].join(' ');

    const handleTypeClick = () => onTrevTypeSelectedToggle(trev.type);
    const handleCodeClick = () => onNodeSelectedToggle(trev.denormalized.node.biKey);

    entries.push(
      <tr key={trev.id} onMouseOver={handleMouseOver} className={className}>
        <td className="parent-id">{trev.parentId}</td>
        <td className="id">{trev.id}</td>
        <td className="type" onClick={handleTypeClick}>{trev.type}</td>
        <td className="node" onClick={handleCodeClick}>
          <code>{trev.denormalized.node.codeSlice}</code>
        </td>
        <td className="data" onClick={() => onOpenModalData({data: trev.data})}>
          <SmallDataPreview data={trev.data} trevType={trev.type} />
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
