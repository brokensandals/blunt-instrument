module.exports = {
  plugins: [
    ['module:blunt-instrument-babel-plugin', {
      runtime: {
        writer: {
          type: 'console',
        },
      },
    }]],
  presets: ['@babel/preset-env'],
};
