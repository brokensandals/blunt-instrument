# blunt-instrument

1. [Development](#development)
1. [Contributing](#contributing)
1. [License](#license)

## Development

Requires [node](https://nodejs.org) and [npm](https://www.npmjs.com).

Clone this repo and run `npm install` to install dependencies, then run `npx lerna bootstrap` to link the packages together.

This is a multi-package project managed using [lerna](https://github.com/lerna/lerna).
Each package is in a subdirectory of the `packages` folder.
Jest and Babel config are at the root and apply to all packages except `blunt-instrument-ui`, whose babel/webpack/jest config are managed by create-react-app.

Build and test commands can be run from the root directory.

Run `npm run build:cjs` or `npm run build:cjs:watch` to build the library packages.
You must do this before running tests, and you must rebuild a package before changes to it will affect other packages' tests.

Run `npm test` or `npm run test:watch` to run the unit tests.

Run `npm start` to run the UI locally.

Run `npm run build` to build all packages, including the UI and ESM builds of the libraries.

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/brokensandals/blunt-instrument.

## License

This is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
