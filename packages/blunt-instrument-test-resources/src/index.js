const examples = {};

examples.factorial = `function fac(n) {
  return n == 1 ? 1 : n * fac(n - 1);
}
const result = fac(10);`;

examples.fizzBuzzGenerator = `function* fizzbuzzer(limit) {
  for (let i = 1; i < limit; i++) {
    if (i % 15 === 0) {
      yield 'FizzBuzz';
    } else if (i % 3 === 0) {
      yield 'Fizz';
    } else if (i % 5 === 0) {
      yield 'Buzz';
    } else {
      yield i.toString();
    }
  }
}

const result = Array.from(fizzbuzzer(31));`;

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
insertionSort(a);`;

export default examples;
