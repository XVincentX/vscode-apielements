const drafter = require('drafter.js');

export const name = 'api-blueprint';
export const mediaTypes = [
  'text/vnd.apiblueprint',
];

export function detect(source) {
  return true;
}

export function parse(options, done) {
  drafter.parse(options.source, options, done);
}

export function validate(options, done) {
  drafter.validate(options.source, options, done);
}
