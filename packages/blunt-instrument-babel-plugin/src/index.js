const visitor = {
  Identifier(path) {
    path.node.name = 'changed_' + path.node.name;
  }
};

export function bluntInstrumentPlugin(babel) {
  return { visitor: visitor };
};
