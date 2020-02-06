import fromNodeKey from './fromNodeKey';

describe('fromNodeKey', () => {
  it('decodes colons', () => {
    expect(fromNodeKey('foo%3Abar:10')).toEqual({ astId: 'foo:bar', nodeId: 10 });
  });
});
