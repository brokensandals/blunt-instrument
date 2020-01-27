import * as runtime from '.';

test('defaultTrace is created', () => {
  expect(runtime.defaultTrace).toBeInstanceOf(runtime.InMemoryTrace);
});
