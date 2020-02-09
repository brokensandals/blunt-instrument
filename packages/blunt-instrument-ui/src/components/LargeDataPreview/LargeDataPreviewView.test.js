import React from 'react';
import renderer from 'react-test-renderer';
import LargeDataPreviewView from './LargeDataPreviewView';

describe('LargeDataPreviewView', () => {
  const cases = [
    ['boolean true', true],
    ['boolean false', false],
    ['short string', 'Hello World'],
    ['multiline string', "Hello, \"World\"!\nI am so pleased to exist and, secondarily, to make your acquaintance.\nBye now."],
    ['number', 1234567],
    ['object', { foo: 'bar' }],
  ];

  cases.forEach(([name, value]) => {
    test(name, () => {
      const result = renderer.create(<LargeDataPreviewView data={value} />).toJSON();
      expect(result).toMatchSnapshot();
    });
  });
});
