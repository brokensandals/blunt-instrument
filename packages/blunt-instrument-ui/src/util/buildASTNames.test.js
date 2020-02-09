import buildASTNames from './buildASTNames';

describe('buildASTNames', () => {
  test('no ids', () => {
    expect(buildASTNames([])).toEqual({});
  });

  test('single id', () => {
    expect(buildASTNames(['/foo/bar/baz.js'])).toEqual({
      '/foo/bar/baz.js': 'baz.js'
    });
  });

  test('no shared prefix', () => {
    expect(buildASTNames(['/foo/bar/baz.js', '/foo/bar/oh.js', '/meh/bar/wat.js'])).toEqual({
      '/foo/bar/baz.js': 'foo/bar/baz.js',
      '/foo/bar/oh.js': 'foo/bar/oh.js',
      '/meh/bar/wat.js': 'meh/bar/wat.js',
    });
  });

  test('a shared prefix', () => {
    expect(buildASTNames(['/foo/bar/one/a.js', '/foo/bar/two/a.js'])).toEqual({
      '/foo/bar/one/a.js': 'one/a.js',
      '/foo/bar/two/a.js': 'two/a.js',
    });
  });
});
