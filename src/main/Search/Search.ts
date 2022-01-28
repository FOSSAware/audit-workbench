import { EventEmitter } from 'events';
import { isBinaryFile, isBinaryFileSync } from 'isbinaryfile';
import { workspace } from '../workspace/Workspace';
import { SearchEvents } from './SearchEvents';

const fs = require('fs');
const pathLib = require('path');
const { performance } = require('perf_hooks');
const readline = require('readline');
const osType = require('os').type();
const { spawn } = require('child_process');
const { exec } = require('child_process');

export class Search extends EventEmitter {
  private files: any;

  private word: string;

  private path: string;

  constructor(files, path) {
    super();
    // this.word = word;
    this.path = path;
    this.files = files;
  }

  public async search() {
    const output = '';
    const command = `grep -R -I -b -o "${this.word}" ${this.path} > /tmp/search.txt`;

    // `grep -w -n -R -I -b -o "${this.word}" ${this.path}`;
    console.log(command);
    const ls = spawn('grep', ['-w', '-m', '1', '-n', '-R', '-I', '-b', '-o', `${this.word}`, `${this.path}`]);

    ls.stdout.on('data', (data) => {
      this.emit(SearchEvents.SEARCH_ON_RESULT, data.toString().split('\n'));
    });

    ls.on('close', async (code) => {
      this.emit(SearchEvents.SEARCH_FINISHED, 'FINISHED');
    });

    // const data = getData(output.toString().match(/.*.+?(?=:)/g));

    // console.log("Search results for 'data': ", results);
    // }
    // });
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
              if (word !== '') {
                if (!dictionary[word]) {
                  dictionary[word] = {};

                  dictionary[word][`${this.files[i].path}-${line.line}`] = [line.content.indexOf(word)];
                } else if (dictionary[word][`${this.files[i].path}-${line.line}`]) {
                  const auxIndex = dictionary[word][`${this.files[i].path}-${line.line}`];
                  dictionary[word][`${this.files[i].path}-${line.line}`].push(line.content.indexOf(word, auxIndex + 1));
                } else {
                  dictionary[word][`${this.files[i].path}-${line.line}`] = [line.content.indexOf(word)];
                }
              }
            });
          }
        });
      }
    }
    const t1 = performance.now();
    console.log(`Time: ${(t1 - t0) / 1000} seconds.`);
    console.log('Dictionary is created\n', 'WORDS:', Object.keys(dictionary).length);
    // fs.writeFileSync('/tmp/dictionary.json', JSON.stringify(dictionary,null,2));
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

  public searchIndex(wordSearched) {
    const dictionary = workspace.getOpenedProjects()[0].getDictionary();

    if (wordSearched.split(' ').length > 0) {
      const phrase = wordSearched.split(' ');
      const partialResults = this.getPartialResultForPhrase(phrase, dictionary);

      console.log('partial results', partialResults);
      const res = this.searchPhrase(partialResults, phrase);
      console.log('res', res);
      return res;
    }

    const results = [];
    Array.from(
      new Set(
        Object.keys(dictionary)
          .filter((k) => k.toLowerCase().includes(wordSearched))
          .map((k) => results.push(dictionary[k]))
      )
    );

    return results;
  }

  private readFile(path) {
    const rl = readline.createInterface({
      input: fs.createReadStream(path),
      encoding: 'utf8',
      terminal: false,
    });

    return new Promise((resolve, reject) => {
      const lines = [{}];
      let lineCount = 0;
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

  private getPartialResultForPhrase(searchedPhrase, dic) {
    const aux = {};

    let results = {};
    searchedPhrase.forEach((word) => {
      if (!results[word]) results[word] = dic[word];
    });

    // sort results by amount of keys
    const res = Object.keys(results)
      .sort((a, b) => Object.keys(results[b]).length - Object.keys(results[a]).length)
      // eslint-disable-next-line no-return-assign
      .reduce((acc, key) => ((acc[key] = results[key]), acc), {});

    results = res;
    // console.log(results);

    const auxKeys = Object.keys(results);

    let valid = true;

    Object.keys(results[auxKeys[0]]).forEach((file) => {
      for (let i = 0; i < auxKeys.length; i+=1) {
        if (results[auxKeys[i]][file] === undefined) {
          valid = false;
          break;
        }
      }

      if (valid) {
        auxKeys.forEach((key) => {
          if (aux[key] === undefined) {
            aux[key] = {};
            aux[key] = { [file]: results[key][file] };
          } else {
            aux[key][file] = results[key][file];
          }
        });
      }

      valid = true;
    });

    return aux;
  }

  private searchPhrase(results, phrase) {
    const searchedPhraseResults = [];
    const auxResults = Object.keys(results);

    if (auxResults.length !== phrase.length) {
      for (let i = 0; i < auxResults.length; i += 1) {
        if (auxResults[i] !== phrase[i]) {
          return [];
        }
      }

      return [];
    }

    const resultsPerWord = Object.keys(results[phrase[0]]).length;
    for (let i = 0; i < resultsPerWord; i += 1) {
      Object.keys(results[phrase[0]]).forEach((key) => {
        if (results[phrase[phrase.length - 1]][key][i]) {
          const range = `${results[phrase[0]][key][i]}-${
            results[phrase[phrase.length - 1]][key][i] + phrase.length + 1
          }`;
          searchedPhraseResults.push({ [key]: range });
        }
      });
    }

    return searchedPhraseResults;
  }
}
