import React from 'react';
import renderer from 'react-test-renderer';
import SmallDataPreviewView from './SmallDataPreviewView';
import { Encoder } from 'object-graph-as-json';

class Foo {
  constructor(x) {
    this.x = x;
  }
}

describe('SmallDataPreviewView', () => {
  const encoder = new Encoder();
  const cases = [
    ['boolean false', false],
    ['boolean true', true],
    ['string', 'Hello World! It is so nice to meet a world. Are you a good world?'],
    ['number', 12345678],
    // eslint-disable-next-line no-undef
    ['bigint', encoder.encode(BigInt('1234567890123456789'))],
    ['builtin', { type: 'builtin', name: 'globalThis' }],
    ['unnamed function', encoder.encode(function(){ return 'hi' })],
    ['named function', encoder.encode(function greet(){ return 'hello' })],
    ['short array', encoder.encode([1, 2, 3, 4])],
    ['array with object', encoder.encode([1, 2, { foo: 'bar' }, 3, 4])],
    ['object', encoder.encode({ foo: { bar: 'baz' } })],
    ['object with prototype', encoder.encode(new Foo(10))],
    ['symbol with description', encoder.encode(Symbol('whatevs'))],
    ['symbol without description', encoder.encode(Symbol())],
  ];

  cases.forEach(([name, value]) => {
    test(name, () => {
      const result = renderer.create(<SmallDataPreviewView data={value} />).toJSON();
      expect(result).toMatchSnapshot();
    });
  });

  test('fn-start trev', () => {
    const value = {
      this: { foo: 'bar' },
      arguments: { 0: 'baz', },
      meh: 'baz',
    };
    const result = renderer.create(<SmallDataPreviewView data={encoder.encode(value)} trevType="fn-start" />).toJSON();
    expect(result).toMatchSnapshot();
  });
});
