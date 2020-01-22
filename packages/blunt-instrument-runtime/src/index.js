import { Encoder } from 'object-graph-as-json';

export const defaultEncoder = new Encoder();

export class Tracer {
  constructor({ encoder = defaultEncoder } = {}) {
    this.asts = {};
    this.encoder = encoder;
    this.trevs = [];
    this.trevIdStack = [];
  }

  record(type, nodeId, data, stackDirection = 0) {
    const id = this.trevs.length + 1;
    const parentId = this.trevIdStack[this.trevIdStack.length - 1];
    if (stackDirection > 0) {
      this.trevIdStack.push(id);
    } else if (stackDirection < 0) {
      this.trevIdStack.pop();
    }

    this.trevs.push({
      id,
      parentId,
      nodeId,
      type,
      data: this.encoder.encode(data),
    });
    return data;
  }
}

export const defaultTracer = new Tracer();
