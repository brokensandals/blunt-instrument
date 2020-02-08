/**
 * Builds display names for given AST ids.
 * This splits the ids by '/' then removes all common leading components.
 * For example, ['/foo/bar/baz.js', '/foo/wat/meh.js'] would yield
 * { '/foo/bar/baz.js': 'bar/baz.js', '/foo/wat/meh.js': 'wat/meh.js' }
 *
 * @param {string[]} astIds
 * @returns {object} keys are AST ids, values are names
 */
export default function buildASTNames(astIds) {
  if (astIds.length === 0) {
    return {};
  }

  const partArrays = astIds.map((id) => id.split('/'));
  while (partArrays.every((array) => array.length > 1 && array[0] === partArrays[0][0])) {
    partArrays.forEach((array) => array.shift());
  }

  const names = partArrays.map((array) => array.join('/'));
  const result = {};
  for (let i = 0; i < astIds.length; i += 1) {
    result[astIds[i]] = names[i];
  }

  return result;
}
