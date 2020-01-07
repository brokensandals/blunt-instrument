import * as babel from '@babel/core';
import * as types from '@babel/types';
import { bluntInstrumentPlugin } from 'blunt-instrument-babel-plugin';
import { ASTQuerier } from 'blunt-instrument-ast-utils';
import { TraceQuerier } from 'blunt-instrument-querier';

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
    if (!toNodes[i].extra) {
      toNodes[i].extra = {};
    }

    const orig = fromNodes[i].extra ? fromNodes[i].extra.biNodeId : null;
    if (orig == null) {
      toNodes[i].extra.biNodeId = 'instr' + i;
    } else {
      toNodes[i].extra.biNodeId = orig;
    }
  }
}

export function instrumentedEval(source, { saveInstrumented = false } = {}) {
  const assignTo = '_bluntInstrumentEvalRet';
  const babelOpts = { plugins: [[bluntInstrumentPlugin, { outputs: { assignTo }}]] };
  if (saveInstrumented) {
    babelOpts.ast = true;
  }

  const babelResult = babel.transformSync(source, { ast: true, sourceType: 'module', ...babelOpts });
  const { code } = babelResult;
  const wrapped = '(function(){var ' + assignTo + ';' + code + '; return ' + assignTo + ';})()';
  const evalResult = (0, eval)(wrapped);
  const { ast, events } = evalResult;

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
