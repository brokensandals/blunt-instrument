function transcribe(input) {
  // If it's a primitive we can represent directly, short-circuit.
  if (input === null ||
      typeof input === 'boolean' ||
      typeof input === 'string') {
    return input;
  }

  const refs = new Map();
  function convert(value) {
    switch (typeof value) {
      case 'undefined':
        // TODO
        break;
      case 'boolean':
        // TODO
        break;
      case 'number':
        // TODO
        break;
      case 'bigint':
        // TODO
        break;
      case 'string':
        // TODO
        break;
      case 'symbol':
        // TODO
        break;
      case 'function':
        // TODO
        break;
      case 'object':
        // TODO
        break;
      default:
        throw new Error(`Unexpected typeof: ${typeof value}`);
    }
  }

  return convert(value);
}