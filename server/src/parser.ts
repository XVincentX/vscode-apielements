const fury = require('fury');
// const apibParser = require('fury-adapter-apib-parser');
const apibParser = require('./furyApibAdapter');
const swaggerParser = require('fury-adapter-swagger');

fury.use(swaggerParser);
fury.use(apibParser); // Everything is APIB if something fails


export function parse(source: string, options: any): Thenable<any> {
  return new Promise((resolve, reject) => {
    fury.parse({ source, generateSourceMap: true, options }, (err, result) => {
      // Yet callbacks in 2016? Yes.

      if (err) {
        err.result = result.toRefract();
        return reject(err);
      }

      return resolve(result.toRefract());
    })
  })
}
