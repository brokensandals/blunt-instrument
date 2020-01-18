import { getNodeId } from 'blunt-instrument-ast-utils';
import instrumentedEval from './';

const example = `
  let num = 1;
  function increaseNum(by) {
    num = num + by;
    return num;
  }
  increaseNum(3);
  increaseNum(3);
`;

describe('instrumentedEval', () => {
  it('runs the given code and returns a TraceQuerier', () => {
    const result = instrumentedEval(example);
    const sumNode = result.traceQuerier.astQuerier.getNodesByCodeSlice('num + by')[0];
    const trevs = result.traceQuerier.query({ filters: { onlyNodeIds: { [getNodeId(sumNode)]: true } } });
    expect(trevs.map(trev => trev.data)).toEqual([4, 7]);
    
    expect(result.instrumentedASTQuerier).toBeUndefined();
  });

  it('builds an ASTQuerier for the instrumented code if requested', () => {
    const result = instrumentedEval(example, { saveInstrumented: true });
    expect(result.traceQuerier).toBeDefined();
    expect(result.instrumentedASTQuerier).toBeDefined();
    expect(result.instrumentedASTQuerier.getNodesByCodeSlice('trace: []')).toHaveLength(1);
  });
});

test('the code in the readme works', () => {
  const code = `
    function factorial(n) {
      return n == 1 ? 1 : n * factorial(n - 1);
    }
    factorial(5);`;
  
  const result = instrumentedEval(code);
  const recursiveCallNode = result.traceQuerier.astQuerier.getNodesByCodeSlice('factorial(n - 1)')[0];
  const trevs = result.traceQuerier.query({ filters: { onlyNodeIds: getNodeId(recursiveCallNode) }});
  expect(trevs.map(trev => trev.data)).toEqual([1, 2, 6, 24]);
});
