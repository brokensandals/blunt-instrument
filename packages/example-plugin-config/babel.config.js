module.exports = {
  plugins: [
    ['blunt-instrument', {
      // Just for demo purposes, we'll write to both the console and a file
      consoleWriter: 'encoded',
      fileWriterPath: 'trace',
      // In a real project you would likely also want:
      // defaultEnabled: false,
      // so that only specific code blocks are traced
      // (see "Enabling and Disabling Tracing" in the babel plugin's README)
    }]],
  presets: ['@babel/preset-env'],
};
