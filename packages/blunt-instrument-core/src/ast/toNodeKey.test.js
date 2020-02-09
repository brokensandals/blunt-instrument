import toNodeKey from './toNodeKey';

describe('toNodeKey', () => {
  it('escapes colons', () => {
    expect(toNodeKey('foo:bar', 10)).toEqual('foo%3Abar:10');
  });
});
