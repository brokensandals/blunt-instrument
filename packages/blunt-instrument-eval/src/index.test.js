import instrumentedEval from '.';

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
  it('runs the given code and returns a TrevCollection', () => {
    const result = instrumentedEval(example);
    const sumNode = result.tc.astb.filterNodes((node) => node.codeSlice === 'num + by')[0];
    const { trevs } = result.tc.filter((trev) => trev.denormalized.node === sumNode);
    expect(trevs.map((trev) => trev.data)).toEqual([4, 7]);
    expect(result.error).toBeUndefined();
  });

  it('returns the instrumented AST if requested', () => {
    const result = instrumentedEval(example, { saveInstrumented: true });
    expect(result.tc).toBeDefined();
    expect(result.instrumentedAST).toBeDefined();
    expect(result.instrumentedAST.codeSlice).toContain('_bie_tracer');
  });

  it('catches and returns errors when evaluating the code', () => {
    const result = instrumentedEval('throw new Error("boo");');
    expect(result.tc).toBeDefined();
    expect(result.error).toBeDefined();
    expect(result.error.message).toEqual('boo');
  });
});

test('the code in the readme works', () => {
  const code = `
    function factorial(n) {
      return n == 1 ? 1 : n * factorial(n - 1);
    }
    factorial(5);`;

  const result = instrumentedEval(code);
  const { trevs } = result.tc.filter((trev) => trev.denormalized.node.codeSlice === 'factorial(n - 1)');
  expect(trevs.map((trev) => trev.data)).toEqual([1, 2, 6, 24]);
});
