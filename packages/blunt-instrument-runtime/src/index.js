import { Encoder } from 'object-graph-as-json';

export const defaultEncoder = new Encoder();

export class Trace {
  constructor({ encoder = defaultEncoder } = {}) {
    this.encoder = encoder;
    this.tracers = {};
    this.trevs = [];
    this.trevIdStack = [];
  }

  tracerFor(astKey = undefined) {
    const trace = this;

    if (trace.tracers[astKey]) {
      return trace.tracers[astKey];
    }

    if (!astKey) {
      let i;
      for (i = 1; trace.tracers[i]; i += 1);
      astKey = i.toString(); // eslint-disable-line no-param-reassign
    }

    const tracer = {
      astKey,

      record(type, nodeId, rawData, stackDirection = 0) {
        const id = trace.trevs.length + 1;
        const parentId = trace.trevIdStack[trace.trevIdStack.length - 1];
        if (stackDirection > 0) {
          trace.trevIdStack.push(id);
        } else if (stackDirection < 0) {
          trace.trevIdStack.pop();
        }
        const data = trace.encoder.encode(rawData);

        trace.trevs.push({
          parentId,
          id,
          type,
          astKey,
          nodeId,
          data,
        });

        return rawData;
      },
    };

    trace.tracers[astKey] = tracer;
    return tracer;
  }
}

export const defaultTrace = new Trace();
