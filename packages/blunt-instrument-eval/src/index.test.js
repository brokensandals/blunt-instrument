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
  it('runs the given code and returns an ArrayTrace', () => {
    const trace = instrumentedEval(example);
    const tc = trace.toTC().withDenormalizedInfo();
    const sumNode = tc.astb.filterNodes((node) => node.codeSlice === 'num + by')[0];
    const { trevs } = tc.filter((trev) => trev.denormalized.node === sumNode);
    expect(trevs.map((trev) => trev.data)).toEqual([4, 7]);
    expect(trace.error).toBeUndefined();
  });

  it('returns the instrumented AST if requested', () => {
    const trace = instrumentedEval(example, { saveInstrumented: true });
    expect(trace.trevs.length).toBeGreaterThan(0);
    expect(trace.astb.instrumentedAST).toBeDefined();
    expect(trace.astb.instrumentedAST.codeSlice).toContain('_bie_tracer');
  });

  it('catches and returns errors when evaluating the code', () => {
    const trace = instrumentedEval('throw new Error("boo");');
    expect(trace.trevs.length).toBeGreaterThan(0);
    expect(trace.error).toBeDefined();
    expect(trace.error.message).toEqual('boo');
  });
});

test('the code in the readme works', () => {
  const code = `
    function factorial(n) {
      return n == 1 ? 1 : n * factorial(n - 1);
    }
    factorial(5);`;

  const trace = instrumentedEval(code);
  const tc = trace.toTC().withDenormalizedInfo();
  const { trevs } = tc.filter((trev) => trev.denormalized.node.codeSlice === 'factorial(n - 1)');
  expect(trevs.map((trev) => trev.data)).toEqual([1, 2, 6, 24]);
});
