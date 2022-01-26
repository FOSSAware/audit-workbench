import { EventEmitter } from 'events';
import { isBinaryFile, isBinaryFileSync } from 'isbinaryfile';
import { SearchEvents } from './SearchEvents';

const fs = require('fs');
const pathLib = require('path');
const { performance } = require('perf_hooks');
const readline = require('readline');
const osType = require('os').type();
const { spawn } = require('child_process');

export class Search extends EventEmitter {
  private files: any;

  private word:string;

  private path: string;

  constructor(word, path) {
    super();
    this.word = word;
    this.path = path;
  }

  public async search() {
    let output = '';

    const ls = spawn('grep', ['-w', '-n', '-R', '-I', '-b', '-o', `${this.word}`, `${this.path}`]);

    ls.stdout.on('data', (data) => {
      output += data.toString();
      this.emit(SearchEvents.SEARCH_ON_RESULT, data.toString());
    });   

    ls.on('close', async (code) => {
      if (code === 0) {
        this.emit(SearchEvents.SEARCH_FINISHED, 'SEARCH FINISHED');
        // const data = getData(output.toString().match(/.*.+?(?=:)/g));

        // console.log("Search results for 'data': ", results);
      }
    });
  }

  public async generateDictionary() {
    const t0 = performance.now();
    const dictionary = {};
    for (let i = 0; i < this.files.length; i += 1) {
      if (!isBinaryFileSync(`${this.path}${this.files[i].path}`) && this.filter(this.files[i].path)) {
        const lines: any = await this.readFile(`${this.path}${this.files[i].path}`);
        lines.forEach((line) => {
          if (line.content !== undefined) {
            const words = line.content?.split(/[^a-zA-Z0-9*s]/g);

            words?.forEach((word) => {
              if (!dictionary[word]) {
                dictionary[word] = {};
                dictionary[word][`${this.files[i].path}-${line.line}`] = 1;
              } else if (!dictionary[word][`${this.files[i].path}-${line.line}`])
                dictionary[word][`${this.files[i].path}-${line.line}`] = 1;
            });
          }
        });
      }
    }
    const t1 = performance.now();
    console.log(`Time: ${(t1 - t0) / 1000} seconds.`);
    console.log('Dictionary is created\n', 'WORDS:', Object.keys(dictionary).length);

    return dictionary;
  }

  public async getDictionary() {
    const t0 = performance.now();
    const dictionary = await this.generateDictionary();
    const t1 = performance.now();
    console.log(`Tiempo de ejecución: ${(t1 - t0) / 1000} segundos.`);
    console.log(dictionary);
    console.log(Object.keys(dictionary).length);
    const search = [];
    Array.from(
      new Set(
        Object.keys(dictionary)
          .filter((k) => k.toLowerCase().includes('license'))
          .map((k) => search.push(dictionary[k]))
      )
    );
  }

  private readFile(path) {
    const rl = readline.createInterface({
      input: fs.createReadStream(path),
      encoding: 'utf8',
      terminal: false,
    });

    return new Promise((resolve, reject) => {
      const lines = [{}];
      let lineCount = 1;
      rl.on('line', function (line) {
        lines.push({
          line: (lineCount += 1),
          content: line,
        });
      });

      rl.on('close', function () {
        resolve(lines);
      });
    });
  }

  private filter(path) {
    if (
      pathLib.extname(path) === '.pack' ||
      pathLib.extname(path) === '.o' ||
      pathLib.extname(path) === '.so' ||
      pathLib.extname(path) === '.deb' ||
      pathLib.extname(path) === '.wfp'
    ) {
      return false;
    }

    return true;
  }
}
