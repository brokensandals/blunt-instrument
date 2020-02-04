import * as runtime from '.';

test('defaultTracer is created', () => {
  expect(runtime.defaultTracer).toBeInstanceOf(runtime.Tracer);
});
