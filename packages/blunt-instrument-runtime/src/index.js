import { Encoder } from 'object-graph-as-json';

export const defaultEncoder = new Encoder();

export class Tracer {
  constructor({ encoder = defaultEncoder }) {
    this.asts = {};
    this.encoder = encoder;
    this.trevs = [];
    this.trevIdStack = [];
  }

  record(type, nodeId, data) {
    this.trevs.push({
      id: this.trevs.length + 1,
      parentId: this.trevIdStack[this.trevIdStack.length - 1],
      nodeId,
      type,
      data: this.encoder.encode(data),
    });
  }
}

export const defaultTracer = new Tracer();
