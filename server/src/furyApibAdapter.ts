// API Blueprint parser for Fury.js

const drafter = require('drafter.js');

export const name = 'api-blueprint';
export const mediaTypes = [
  'text/vnd.apiblueprint',
];

export function detect(source) {
  return true;
}

/*
 * Parse an API Blueprint into refract elements.
 */
export function parse({source, generateSourceMap}, done) {
  const options = { exportSourcemap: generateSourceMap };
  drafter.parse(source, options, done);
}

export default { name, mediaTypes, detect, parse };
