module.exports = {
  plugins: [
    ['blunt-instrument', {
      runtime: {
        writer: {
          type: 'console',
        },
      },
    }]],
  presets: ['@babel/preset-env'],
};
