const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'target', 'umd'),
    filename: 'blunt-instrument-standalone.min.js',
    library: 'BluntInstrument',
    libraryTarget: 'umd',
  },
  externals: {
    fs: 'null',
  },
};
