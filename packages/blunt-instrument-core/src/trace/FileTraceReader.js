import * as fs from 'fs';
import ASTBundle from '../ast/ASTBundle';
import TrevCollection from './TrevCollection';

/**
 * Loads traces created by FileTraceWriter.
 */
export default class FileTraceReader {
  constructor({ path }) {
    this.path = path;
  }

  /**
   * Read and parse the file asynchronously.
   * @returns {Promise<TrevCollection>}
   */
  readAsTC() {
    return fs.promises.readFile(this.path, { encoding: 'utf8' })
      .then((text) => {
        const astb = new ASTBundle();
        const trevs = [];

        text.split(/[\r\n]+/).forEach((line) => {
          if (line.length === 0) {
            return;
          }

          const json = JSON.parse(line);
          if (json.ast) {
            astb.add(json.astId, json.ast, json.code);
          } else {
            trevs.push(json);
          }
        });

        return new TrevCollection(trevs, astb);
      });
  }
}
