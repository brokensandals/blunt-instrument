import * as babel from '@babel/core';
import * as types from '@babel/types';
import { bluntInstrumentPlugin } from 'blunt-instrument-babel-plugin';
import { TraceQuerier, ASTQuerier } from 'blunt-instrument-querier';

function nodeArray(ast) {
  const array = [];
  types.traverseFast(ast, node => array.push(node));
  return array;
}

function copyNodeIds(from, to) {
  const fromNodes = nodeArray(from);
  const toNodes = nodeArray(to);
  if (fromNodes.length !== toNodes.length) {
    throw new Error('Expected ASTs to have the same number of nodes');
  }
  for (let i = 0; i < fromNodes.length; i++) {
    const orig = fromNodes[i].nodeId;
    if (orig == null) {
      toNodes[i].nodeId = 'instr' + i;
    } else {
      toNodes[i].nodeId = orig;
    }
  }
}

export function instrumentedEval(source, { saveInstrumented = false } = {}) {
  const babelOpts = { plugins: [bluntInstrumentPlugin] };
  if (saveInstrumented) {
    babelOpts.ast = true;
  }

  const babelResult = babel.transformSync(source, { ast: true, sourceType: 'script', ...babelOpts });
  const { code } = babelResult;
  const wrapped = code + '; [biAST, biEvents]'; // TODO: be less hacky
  const [ast, events] = (0, eval)(wrapped);

  const astQueriers = {
    input: new ASTQuerier(ast, source),
  };

  if (saveInstrumented) {
    const parsed = babel.parseSync(code);
    copyNodeIds(babelResult.ast, parsed);
    astQueriers.instrumented = new ASTQuerier(parsed, code);
  }

  return new TraceQuerier(astQueriers, events);
}
