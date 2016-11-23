// API Blueprint parser for Fury.js

const drafter = require('drafter.js');

const name = 'api-blueprint';
const mediaTypes = [
  'text/vnd.apiblueprint',
];

function detect(source) {
  return true;
}

/*
 * Parse an API Blueprint into refract elements.
 */
function parse({source, generateSourceMap}, done) {
  const options = { exportSourcemap: generateSourceMap };
  drafter.parse(source, options, done);
}

function validate({source, requireBlueprintName}, done) {
  const options = { requireBlueprintName };
  drafter.validate(source, options, done);
}

export default { name, mediaTypes, detect, validate, parse };
