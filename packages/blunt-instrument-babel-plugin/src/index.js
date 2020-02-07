import template from '@babel/template';
import * as types from '@babel/types';
import { addNodeIdsToAST } from 'blunt-instrument-core';

const buildImportTracer = template(`
  import { defaultTracer as %%tempId%% } from 'blunt-instrument-core';
  const %%tracerId%% = %%tempId%%;
`);

const buildAttachConsoleTraceWriter = template(`
  import { ConsoleTraceWriter as %%tempId%% } from 'blunt-instrument-core';
  if (!%%tracerId%%.attachedWriterByPlugin) {
    new %%tempId%%().attach(%%tracerId%%);
    %%tracerId%%.attachedWriterByPlugin = true;
  }
`);

const buildSetAstId = template(`
  const %%astIdId%% = %%astId%%;
`);

const buildRegisterAST = template(`
  %%tracerId%%.onRegisterAST(%%astIdId%%, JSON.parse(%%astString%%));
`);

const buildFnTrace = template(`{
  const %%fnStartIdId%% = %%tracerId%%.traceFnStart(%%astIdId%%, %%nodeId%%, %%args%%);
  try {
    %%body%%
  } catch (e) {
    %%tracerId%%.traceFnThrow(%%astIdId%%, %%nodeId%%, e);
    throw e;
  }
  %%tracerId%%.traceFnRet(%%astIdId%%, %%nodeId%%, undefined);
}`);

const buildReturnTrace = template(`
  return %%tracerId%%.traceFnRet(%%astIdId%%, %%nodeId%%, %%retval%%);
`);

function addFnTrace(path, {
  astIdId, tracerId, fnStartIdId, checkEnabled,
}) {
  const { node } = path;

  if (!checkEnabled(node)) {
    return;
  }

  // Don't trace nodes without a node ID - those are nodes we added
  if (!node.biId) {
    return;
  }

  // If biTracedFn is true, we've already added tracing to this node
  if (node.biTracedFn) {
    return;
  }

  const idNames = new Set(Object.keys(types.getBindingIdentifiers(node.params)));
  // We always want to trace the values of `this` and `arguments`. It's possible
  // to define parameters on a function named `this` and `arguments`, which will
  // supersede the built-in bindings; if the function has done that, `this` and `arguments`
  // will be in the set already.
  idNames.add('this');
  idNames.add('arguments');

  const properties = [];
  idNames.forEach((idName) => {
    const key = types.identifier(idName);
    // When setting a property named `this` in an object expression,
    // the key must be an Identifier node with name=`this`. For setting the
    // value to `this`, either a `ThisExpression` node or an `Identifier` node
    // with name=`this` will work. But if you re-parse the generated code,
    // it's always a `ThisExpression`, so we use that here because blunt-instrument-eval
    // does re-parse the generated code and expect it to have all the same node types
    // as the AST generated by the plugin.
    const val = idName === 'this' ? types.thisExpression() : key;
    properties.push(types.objectProperty(key, val, false, !['this', 'arguments'].includes(idName)));
  });

  let { body } = node;
  if (types.isExpression(body)) {
    body = buildReturnTrace({
      tracerId,
      astIdId,
      nodeId: types.numericLiteral(node.biId),
      retval: node.body,
    });
  }

  const trace = buildFnTrace({
    body,
    tracerId,
    fnStartIdId,
    astIdId,
    nodeId: types.numericLiteral(node.biId),
    args: types.objectExpression(properties),
  });

  node.body = trace;
  node.biTracedFn = true;
}

function addReturnTrace(path, { astIdId, tracerId, checkEnabled }) {
  const { node } = path;

  if (!checkEnabled(node)) {
    return;
  }

  // Don't trace nodes without a node ID - those are nodes we added
  if (!node.biId) {
    return;
  }

  const trace = buildReturnTrace({
    tracerId,
    astIdId,
    nodeId: types.numericLiteral(node.biId),
    retval: node.argument,
  });
  path.replaceWith(trace);
}

const buildExpressionTrace = template(`
  %%tracerId%%.traceExpr(%%astIdId%%, %%nodeId%%, %%expression%%)
`);

/**
 * Replaces an expression node with a traced equivalent.
 * For example, rewrites `x + 1` to `tracer.logExpr('NODEID', x + 1)`
 * @param {NodePath} path - path containing expression node
 * @param {object} state - metadata returned from addInstrumenterInit
 */
function addExpressionTrace(path, { astIdId, tracerId, checkEnabled }) {
  const { node } = path;

  if (!checkEnabled(node)) {
    return;
  }

  // Don't try to instrument the "bar" in `import foo from "bar"`
  if (types.isImportDeclaration(path.parentPath.node)) {
    return;
  }

  // Don't trace the retrieval of a method from an object.
  // In other words, this if block detects if we're looking at a node like
  // `x.y` that's part of a node like `x.y()`, and skips tracing if so.
  // Otherwise, we'd rewrite `x.y()` to something like `trace(x.y)()`, which
  // changes the semantics of the program: the former will bind `this` to `x`
  // but the latter will not.
  // TODO the right way to do this is probably to save `x` and `x.y` into temp
  // variables t1 and t2, and rewrite the expression to t2.apply(t1, args).
  // (We must avoid retrieving `x.y` twice, because it might be a getter, and
  // we don't want to change the original program's semantics by invoking a
  // getter twice instead of once.)
  // To be really robust though we'd also need to account for the possibility
  // that y's `apply` method has been overridden.
  // `x.y` twice (which would change the program semantics if `y` is a getter).
  if (types.isMemberExpression(node)
      && types.isCallExpression(path.parentPath.node)
      && path.node === path.parentPath.node.callee) {
    return;
  }

  // Don't trace nodes without a node ID - those are nodes we added
  if (!node.biId) {
    return;
  }

  // If biTracedExpr is true, we've already added tracing for this node
  if (node.biTracedExpr) {
    return;
  }

  // Don't trace identifiers that aren't being evaluated, e.g. the x in `x = 4`
  if (!(path.isReferenced())) {
    return;
  }
  // Workaround for https://github.com/babel/babel/issues/11087
  if ((types.isObjectMethod(path.parentPath.node)
        || types.isClassMethod(path.parentPath.node)
        || types.isClassPrivateMethod(path.parentPath.node))
      && path.parentPath.node.params.includes(path.node)) {
    return;
  }

  const trace = buildExpressionTrace({
    tracerId,
    astIdId,
    nodeId: types.numericLiteral(node.biId),
    expression: node,
  });
  node.biTracedExpr = true;
  path.replaceWith(trace);
}

const buildPauseTrace = template.expression(`
  %%tracerId%%.traceFnPause(%%astIdId%%, %%nodeId%%, %%argument%%)
`);

const buildResumeTrace = template.expression(`
  %%tracerId%%.traceFnResume(%%astIdId%%, %%nodeId%%, %%expression%%, %%fnStartIdId%%)
`);

/**
 * Replaces a yield or await expression with a traced equivalent.
 * @param {NodePath} path - path containing yield or await expression node
 * @param {object} state - metadata returned from addInstrumenterInit
 */
function addPauseTrace(path, {
  astIdId, tracerId, fnStartIdId, checkEnabled,
}) {
  const { node } = path;

  if (!checkEnabled(node)) {
    return;
  }

  // Don't trace nodes without a node ID - those are nodes we added
  if (!node.biId) {
    return;
  }

  // if biTracedYield is true, we've already added tracing for this node
  if (node.biTracedYield) {
    return;
  }

  const pauseTrace = buildPauseTrace({
    tracerId,
    astIdId,
    nodeId: types.numericLiteral(node.biId),
    argument: node.argument,
  });
  node.argument = pauseTrace;
  const resumeTrace = buildResumeTrace({
    tracerId,
    fnStartIdId,
    astIdId,
    nodeId: types.numericLiteral(node.biId),
    expression: node,
  });
  node.biTracedYield = true;
  path.replaceWith(resumeTrace);
}

const basePostfixRewrite = `
  (() => {
    const %%tempId%% = %%lval%%;
    %%lval%% OPERATOR 1;
    return %%tempId%%;
  })()
`;
const postfixRewriteTemplates = {
  '++': template(basePostfixRewrite.replace('OPERATOR', '+=')),
  '--': template(basePostfixRewrite.replace('OPERATOR', '-=')),
};

const instrumentVisitor = {
  UpdateExpression(path) {
    // TODO this is super hacky, and also written when the tracing worked
    // differently, so probably can be simplified
    const op = `${path.node.operator[0]}=`;
    if (path.node.prefix) {
      // Change ++x to x += 1
      const replacement = types.assignmentExpression(
        op, path.node.argument, types.numericLiteral(1),
      );
      replacement.biId = path.node.biId;
      path.replaceWith(replacement);
    } else {
      // Change x++ to (() => { const _postfix = x; x += 1; return _postfix})()
      // TODO: currently, for x++, the original value of x is traced twice:
      // once for the AST node corresponding to 'x' and once for the node corresponding
      // to 'x++'. This seems correct (though tracing the node for 'x' at all may be
      // superfluous) since the original value is the actual value returned by the
      // expression. However, it might be desirable to add a third trace entry of
      // a different type to trace the fact that 'x' is being updated to a new value.
      const lval = path.node.argument;
      const tempId = path.scope.generateUidIdentifier('postfix');
      const replacement = postfixRewriteTemplates[path.node.operator]({ tempId, lval });
      const nodeId = path.node.biId;
      path.replaceWith(replacement);
      // replaceWith appears to drop additional properties, so we must set biId
      // afterward, not before
      // TODO if that's true, why does setting it before work above
      path.node.biId = nodeId; // eslint-disable-line no-param-reassign
    }
  },

  Expression: {
    exit(path) {
      if (types.isAwaitExpression(path.node) || types.isYieldExpression(path.node)) {
        return;
      }
      addExpressionTrace(path, this.state);
    },
  },

  Function(path) {
    addFnTrace(path, this.state);
  },

  ReturnStatement(path) {
    addReturnTrace(path, this.state);
  },

  AwaitExpression(path) {
    addPauseTrace(path, this.state);
  },

  YieldExpression(path) {
    addPauseTrace(path, this.state);
  },
};

const directiveRegexes = [
  [/^\s*bi-enable-line\s*$/, 'enable-line'],
  [/^\s*bi-disable-line\s*$/, 'disable-line'],
  [/^\s*bi-enable\s*$/, 'enable'],
  [/^\s*bi-disable\s*$/, 'disable'],
];

function enabledChecker(defaultEnabled, path) {
  const directives = [];
  types.traverseFast(path.node, (node) => {
    (node.leadingComments || node.trailingComments || []).forEach((comment) => {
      const match = directiveRegexes.find(([regex]) => regex.test(comment.value));
      if (match) {
        directives[comment.loc.start.line] = match[1]; // eslint-disable-line prefer-destructuring
      }
    });
  });

  const enabled = [];
  let current = defaultEnabled;
  for (let i = 1; i < directives.length; i += 1) {
    switch (directives[i]) {
      case 'enable-line':
        enabled[i] = true;
        break;
      case 'disable-line':
        enabled[i] = false;
        break;
      case 'enable':
        enabled[i] = true;
        current = true;
        break;
      case 'disable':
        enabled[i] = false;
        current = false;
        break;
      default:
        enabled[i] = current;
    }
  }

  return (node) => {
    const line = node.loc && node.loc.start && node.loc.start.line;
    return enabled[line] === undefined ? defaultEnabled : enabled[line];
  };
}

/**
 * Babel plugin that instruments source code for automatic tracing.
 *
 * See README for usage and options.
 *
 * @param {*} babel
 */
export default function (api, opts) {
  const {
    runtime: {
      mechanism = 'import',
      tracerVar,
      writer: {
        type: writerType,
      } = {},
    } = {},
    ast: {
      callback = () => {},
      id: givenASTId,
      selfRegister = true,
    } = {},
    instrument: {
      defaultEnabled = true,
    } = {},
  } = opts;

  let astId;

  function addInstrumenterInit(path) {
    const ids = {
      astIdId: path.scope.generateUidIdentifier('astId'),
      tracerId: tracerVar ? types.identifier(tracerVar)
        : path.scope.generateUidIdentifier('tracer'),
      fnStartIdId: path.scope.generateUidIdentifier('fnStartId'),
    };

    if (selfRegister) {
      // TODO insert object directly instead of via json
      const astString = types.stringLiteral(JSON.stringify(path.node));
      path.node.body.unshift(buildRegisterAST({
        astIdId: ids.astIdId,
        tracerId: ids.tracerId,
        astString,
      }));
    }

    path.node.body.unshift(buildSetAstId({
      astIdId: ids.astIdId,
      astId: types.stringLiteral(astId),
    }));

    switch (writerType) {
      case undefined:
      case null:
        // nothing
        break;
      case 'console':
        path.node.body.unshift(...buildAttachConsoleTraceWriter({
          tempId: path.scope.generateUidIdentifier('temp'),
          tracerId: ids.tracerId,
        }));
        break;
      default:
        throw new Error(`Unrecognized writer type ${writerType}`);
    }

    if (mechanism === 'import') {
      path.node.body.unshift(...buildImportTracer({
        tempId: path.scope.generateUidIdentifier('temp'),
        tracerId: ids.tracerId,
      }));
    }

    return ids;
  }

  return {
    visitor: {
      Program(path) {
        astId = givenASTId || this.file.opts.filename;
        if (!astId) {
          throw new Error('opts.ast.id is required when no filename is available');
        }
        const checkEnabled = enabledChecker(defaultEnabled, path);
        addNodeIdsToAST(path.node);
        callback(astId, path.node);
        const state = { ...addInstrumenterInit(path), checkEnabled };
        path.traverse(instrumentVisitor, { state });
      },
    },
  };
}
