import isVisibleWithin from './isVisibleWithin';

const mockWithRect = (top, right, bottom, left) => ({
  getBoundingClientRect() {
    return { top, right, bottom, left };
  }
});

describe('isVisibleWithin', () => {
  test('fully inside', () => {
    const target = mockWithRect(10, 40, 30, 20);
    const container = mockWithRect(3, 50, 40, 10);
    expect(isVisibleWithin(target, container)).toBeTruthy();
  });

  test('exactly aligned', () => {
    const target = mockWithRect(10, 40, 30, 20);
    const container = mockWithRect(10, 40, 30, 20);
    expect(isVisibleWithin(target, container, 0)).toBeTruthy();
  });

  test('bottom-right inside but not enough', () => {
    const target = mockWithRect(10, 40, 30, 20);
    const container = mockWithRect(26, 90, 90, 36);
    expect(isVisibleWithin(target, container, 5)).toBeFalsy();
  });
  
  test('bottom-right inside', () => {
    const target = mockWithRect(10, 40, 30, 20);
    const container = mockWithRect(25, 90, 90, 35);
    expect(isVisibleWithin(target, container, 5)).toBeTruthy();
  });

  test('top-left inside but not enough', () => {
    const target = mockWithRect(10, 40, 30, 20);
    const container = mockWithRect(1, 24, 14, 1);
    expect(isVisibleWithin(target, container, 5)).toBeFalsy();
  });

  test('top-left inside', () => {
    const target = mockWithRect(10, 40, 30, 20);
    const container = mockWithRect(1, 25, 15, 1);
    expect(isVisibleWithin(target, container, 5)).toBeTruthy();
  });

  test('way above', () => {
    const target = mockWithRect(10, 30, 20, 10);
    const container = mockWithRect(100, 100, 300, 1);
    expect(isVisibleWithin(target, container)).toBeFalsy();
  })

  test('way below', () => {
    const target = mockWithRect(100, 30, 110, 10);
    const container = mockWithRect(1, 100, 50, 1);
    expect(isVisibleWithin(target, container)).toBeFalsy();
  });
});
