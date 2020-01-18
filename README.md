# blunt-instrument

1. [Development](#development)
1. [Contributing](#contributing)
1. [License](#license)

## Development

Requires [node](https://nodejs.org) and [npm](https://www.npmjs.com).

Clone this repo and run `npm install` to install dependencies.

Run `npm test` or `npm test:watch` to run the unit tests.

Run `npm start` to run the demo app locally.

This is a multi-package project managed using [lerna](https://github.com/lerna/lerna).
Each package is in a subdirectory of the `packages` folder.
Jest and Babel config are at the root and run for all packages at once, rather than being configured in each package.
The exception is `blunt-instrument-demo`, whose babel/webpack/jest config are managed by create-react-app.

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/brokensandals/blunt-instrument.

## License

This is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
