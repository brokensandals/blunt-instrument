This is an example of configuring a project to be instrumented by [babel-plugin-blunt-instrument][babel-plugin].

In this example, tracing is logged to the console, and the entire program is traced.

Key points:

- The `'blunt-instrument'` plugin is configured in [babel.config.js](babel.config.js).
  - This should run before other plugins so that you can match trace events to the parts of your original source code they correspond to.
- `babel-plugin-blunt-instrument` and `blunt-instrument-core` are listed as devDependencies in [package.json](package.json).
  - If you wanted to deploy instrumented code in production, you'd need `blunt-instrument-core` to be a runtime dependency instead.

Use `npm run exec` to invoke the program.
This uses `babel-node` to run `index.js`.

[babel-plugin]: ../babel-plugin-blunt-instrument/README.md
