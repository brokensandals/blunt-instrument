import { Encoder } from 'object-graph-as-json';

export default class InMemoryTrace {
  constructor({
    encoder = new Encoder(),
    maxTrevs = Infinity,
  } = {}) {
    this.asts = {};
    this.encoder = encoder;
    this.maxTrevs = maxTrevs;
    this.tracers = {};
    this.trevs = [];
    this.trevIdStack = [];
  }

  tracerFor(astId = undefined) {
    const trace = this;

    if (trace.tracers[astId]) {
      return trace.tracers[astId];
    }

    if (!astId) {
      let i;
      for (i = 1; trace.tracers[i]; i += 1);
      astId = i.toString(); // eslint-disable-line no-param-reassign
    }

    const tracer = {
      astId,

      pushContext(id) {
        trace.trevIdStack.push(id);
      },

      popContext() {
        trace.trevIdStack.pop();
      },

      logTrev(type, nodeId, rawData, more = {}) {
        const id = trace.trevs.length + 1;
        if (id > trace.maxTrevs) {
          return null;
        }

        const parentId = trace.trevIdStack[trace.trevIdStack.length - 1];
        const data = trace.encoder.encode(rawData);

        trace.trevs.push({
          parentId,
          id,
          type,
          astId,
          nodeId,
          data,
          ...more,
        });

        return id;
      },

      registerAST(ast) {
        trace.asts[astId] = ast;
      },

      logExpr(nodeId, rawData) {
        this.logTrev('expr', nodeId, rawData);
        return rawData;
      },

      logFnStart(nodeId, rawData) {
        const id = this.logTrev('fn-start', nodeId, rawData);
        this.pushContext(id);
        return id;
      },

      logFnRet(nodeId, rawData) {
        this.logTrev('fn-ret', nodeId, rawData);
        this.popContext();
        return rawData;
      },

      logFnThrow(nodeId, rawData) {
        this.logTrev('fn-throw', nodeId, rawData);
        this.popContext();
        return rawData;
      },

      logFnPause(nodeId, rawData) {
        this.logTrev('fn-pause', nodeId, rawData);
        this.popContext();
        return rawData;
      },

      logFnResume(nodeId, rawData, fnStartId) {
        const id = this.logTrev('fn-resume', nodeId, rawData, { fnStartId });
        this.pushContext(id);
        return rawData;
      },
    };

    trace.tracers[astId] = tracer;
    return tracer;
  }
}
