const lodash = require("lodash");

export function createLineReferenceFromSourceMap(sourceMap, document, documentLines) {

  const x = lodash.map(lodash.first(sourceMap).content, (sm) => {
    return {
      charIndex: lodash.head(sm),
      charCount: lodash.last(sm)
    }
  });

  const sm = lodash.head(x);

  const startRowBreak = lodash.head(document.substring(sm.charIndex).split(/\r?\n/g));
  const endRowBreak = lodash.head(document.substring(sm.charIndex + sm.charCount).split(/\r?\n/g));

  const startRow = lodash.findIndex(documentLines, (line) => line.indexOf(startRowBreak) > -1);
  const endRow = lodash.findIndex(documentLines, (line) => line.indexOf(endRowBreak) > -1);

  const startIndex = documentLines[startRow].indexOf(startRowBreak);

  let endIndex = documentLines[endRow].indexOf(endRowBreak);

  if (startRow === endRow)
    endIndex = sm.charCount;

  return {
    startRow: startRow,
    endRow: endRow,
    startIndex: startIndex,
    endIndex: endIndex
  };
}
