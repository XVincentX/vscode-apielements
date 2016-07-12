const lodash = require("lodash");

export function createLineReferenceFromSourceMap(sourceMap, document, documentLines) {

  const x = lodash.map(lodash.first(sourceMap).content, (sm) => {
    return {
      charIndex: lodash.head(sm),
      charCount: lodash.last(sm)
    }
  });

  const sm = lodash.head(x);

  const errorLine = lodash.head(document.substring(sourceMap.charIndex).split(/\r?\n/g));
  const errorRow = lodash.findIndex(documentLines, (line) =>
      line.indexOf(errorLine) > -1
  );

  const startIndex = documentLines[errorRow].indexOf(errorLine);

  return {
    errorRow: errorRow,
    startIndex: startIndex,
    charCount: sm.charCount
  };
}
