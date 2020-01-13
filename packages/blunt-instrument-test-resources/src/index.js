export const examples = {};

examples.factorial = `function fac(n) {
  return n == 1 ? 1 : n * fac(n - 1);
}
const result = fac(3);`;

examples.insertionSort = `function insertionSort(array) {
  for (let i = 0; i < array.length; i++) {
    for (let j = i - 1; j >= 0; j--) {
      if (array[j] <= array[j + 1]) {
        break;
      }

      const tmp = array[j + 1];
      array[j + 1] = array[j];
      array[j] = tmp;
    }
  }
}

const a = [3, 1, 2, 5, 4];
insertionSort(a);`
