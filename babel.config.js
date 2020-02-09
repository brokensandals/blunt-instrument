const modulesEnv = process.env.BABEL_MODULES;
const modules = modulesEnv === 'false' ? false : (modulesEnv || 'auto');

module.exports = {
  presets: [['@babel/preset-env', { modules }]],
};
