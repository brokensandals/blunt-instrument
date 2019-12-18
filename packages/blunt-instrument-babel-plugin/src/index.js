const visitor = {
  Identifier(path) {
    path.node.name = 'changed_' + path.node.name;
  }
};

export const bluntInstrumentPlugin = {
  visitor: visitor
};
