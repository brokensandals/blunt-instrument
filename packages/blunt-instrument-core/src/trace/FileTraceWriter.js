import * as fs from 'fs';
import { Encoder } from 'object-graph-as-json';
import ASTBundle from '../ast/ASTBundle';
import TrevCollection from './TrevCollection';

/**
 * Attach this using a Tracer's addListener() method. All data from the tracer will be
 * written to a file. Each line of the file will be one of the following:
 * - an AST registration, represented as a JSON object containing "ast", "code", and "astId" fields
 * - a trev, represented as JSON, with the data field encoded via object-graph-as-json
 *
 * The FileTraceReader class can load this format back into memory.
 */
export default class FileTraceWriter {
  /**
   * @param {Object} opts
   * @param {Encoder} opts.encoder - encoder to apply to data, defaults to a new Encoder()
   * @param {string} opts.prefix - path & filename, to which a timestamp & extension
   *    will be appended
   */
  constructor({ encoder = new Encoder(), prefix = 'trace' }) {
    this.encoder = encoder;
    this.filename = `${prefix}.${new Date().getTime()}.tracebi`;
    this.ws = fs.createWriteStream(this.filename);
    this.ws.on('error', (error) => {
      // eslint-disable-next-line no-console
      console.error(`Error while opening or writing to trace file ${this.filename}:`);
      // eslint-disable-next-line no-console
      console.error(error);

      if (this.endReject) {
        this.endReject(error);
      }
    });
  }

  handleRegisterAST(astId, ast, code) {
    this.ws.write(JSON.stringify({ astId, ast, code }));
    this.ws.write('\n');
  }

  handleTrev(trev) {
    const encoded = { ...trev, data: this.encoder.encode(trev.data) };
    this.ws.write(JSON.stringify(encoded));
    this.ws.write('\n');
  }

  end() {
    return new Promise((resolve, reject) => {
      this.endReject = reject;
      this.ws.end(resolve);
    });
  }

  /**
   * Read a file created by FileTraceWriter.
   * @param {string} path
   * @returns {Promise<TrevCollection>}
   */
  static readToTC(path) {
    return fs.promises.readFile(path, { encoding: 'utf8' }).then(this.parseToTC);
  }

  /**
   * Parse a file created by FileTraceWriter.
   * @param {string} text - the contents of a trace file
   * @returns {TrevCollection}
   */
  static parseToTC(text) {
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
  }
}
