import React from 'react';
import './LargeDataPreview.css';

export default function LargeDataPreviewView({ data }) {
  switch (typeof data) {
    case 'boolean':
      return <p className="LargeDataPreview boolean">{data.toString()}</p>;
    case 'string':
      return <pre className="LargeDataPreview string">{data}</pre>;
    case 'number':
      return <p className="LargeDataPreview number">{data}</p>;
    default:
      return <pre className="LargeDataPreview object"><code>{JSON.stringify(data, null, 2)}</code></pre>;
  }
}
