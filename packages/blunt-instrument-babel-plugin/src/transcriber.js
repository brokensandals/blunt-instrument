const seenObjects = new WeakMap();
let nextObjectId = 1;

function intern(value) {
  const existingId = seenObjects.get(value);
  if (existingId) {
    return existingId;
  }

  const id = nextObjectId++;
  seenObjects.set(value, nextObjectId);
  return id;
}

function transcribeForJSON(input) {
  // If it's a primitive we can represent directly, short-circuit.
  if (input === null ||
      typeof input === 'boolean' ||
      typeof input === 'string') {
    return input;
  }

  const refs = new Map();

  function attemptSimpleRepresentation(object, id) {
    const proto = Object.getPrototypeOf(object);
    if (proto === Array.prototype) {
      if (object.constructor !== Array) {
        return false;
      }
  
      let nextExpected = 0;
      const descs = Object.getOwnPropertyDescriptors(object);
      const expectedLength = Object.keys(descs).length - 1;
      for (const key in descs) {
        const desc = descs[key];
        if (key === 'length') {
          if (!(desc.value === expectedLength &&
                desc.writable && !desc.enumerable && !desc.configurable)) {
            return false;
          }
          continue;
        }
        
        if (!(key === nextExpected && desc.writable && desc.enumerable && desc.configurable)) {
          return false;
        }
  
        nextExpected++;
      }

      // TODO
    }
  
    if (proto === Object.prototype) {
      if (object.constructor !== Object) {
        return false;
      }
  
      const descs = Object.getOwnPropertyDescriptors(object);
      for (const key in descs) {
        if (!(typeof key === 'number' || typeof key === 'string')) {
          return false;
        }
  
        if (key === '_type' || key === '_id') {
          return false;
        }
  
        const desc = descs[key];
        if (!(typeof desc.get === 'undefined' &&
              typeof desc.set === 'undefined' &&
              desc.configurable && desc.enumerable && desc.writable)) {
          return false;
        }
      }
  
      // TODO
    }
  
    return false;
  }

  function convert(value) {
    const type = typeof value;
    switch (type) {
      case 'undefined':
        return { _type: 'undefined' };
      case 'boolean':
        return value;
      case 'number':
        return value;
      case 'bigint':
        return { _type: 'bigint', string: value.toString() };
      case 'string':
        return value;
      case 'symbol':
        const ref = refs.get(value);
        if (ref) {
          return ref;
        }

        const id = intern(value);
        refs.set(value, { _type: 'ref', toId: id });
        return { _type: 'symbol', id, description: value.description };
      case 'function':
      case 'object':
        if (value === null) {
          return null;
        }

        const ref = refs.get(value);
        if (ref) {
          return ref;
        }

        const id = intern(value);
        refs.set(value, { _type: 'ref', toId: id });


        // TODO
        return result;
      default:
        throw new Error(`Unexpected typeof: ${type}`);
    }
  }

  return convert(value);
}