import * as refractUtils from '../src/refractUtils';
const drafter = require('drafter.js');

declare var describe: any;
declare var it: any;
declare var expect: any;
declare var jest: any;

describe('refractUtils', () => {
  it('adds 5 - 1 to equal 4 in TypeScript', () => {
    expect(3 + 1).toBe(4);
  });

  it('can test modules', () => {
    const s = refractUtils.query({}, [], "Nasino");
  });
})
