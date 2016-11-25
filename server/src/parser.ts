const fury = require('fury');
const apibParser = require('./furyApibAdapter');
const swaggerParser = require('fury-adapter-swagger');

fury.use(swaggerParser);
fury.use(apibParser); // Everything is APIB if something fails

export function parse(source: string, options: any): Thenable<any> {
  return new Promise((resolve, reject) => {
    fury.parse({ source, generateSourceMap: options.generateSourceMap, options }, (err, result) => {
      // Yet callbacks in 2016? Yes.

      if (result !== undefined) {
        return resolve(result.toRefract());
      }

      return reject(err);

    });
  });
}

export function validate(source: string, options: any): Thenable<any> {
  return new Promise((resolve, reject) => {
    fury.validate({ source, options }, (err, result) => {
      if (err) {
        return reject(err);
      }

      if (result !== null) {
        return reject(result.toRefract());
      }

      return resolve();

    });
  });
}
