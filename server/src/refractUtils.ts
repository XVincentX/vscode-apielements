const lodash = require("lodash");

import {SymbolInformation, Range, SymbolKind} from 'vscode-languageserver';

export function createLineReferenceFromSourceMap(refractSourceMap, document: string, documentLines: string[]): any {

  const firstSourceMap = lodash.first(refractSourceMap);

  if (typeof (firstSourceMap) === 'undefined') {
    return {};
  }

  const sourceMapArray = lodash.map(firstSourceMap.content, (sm) => {
    return {
      charIndex: lodash.head(sm),
      charCount: lodash.last(sm)
    }
  });

  // I didn't find any useful example of multiple sourcemap elements.
  const sourceMap = lodash.head(sourceMapArray);

  const sourceSubstring = document.substring(sourceMap.charIndex, sourceMap.charIndex + sourceMap.charCount);
  const sourceLines = sourceSubstring.split(/\r?\n/g);

  if (sourceSubstring === '\n' || sourceSubstring === '\r') {
    // It's on a newline which I cannot show in the document.
    return {
      startRow: 0,
      endRow: documentLines.length,
      startIndex: 0,
      endIndex: lodash.last(documentLines).length
    };
  }

  const startRow = lodash.findIndex(documentLines, (line) => line.indexOf(lodash.head(sourceLines)) > -1);
  const endRow = startRow + (sourceLines.length > 1 ? sourceLines.length - 1 : sourceLines.length) - 1; // - 1 for the current line, - 1 for the last nextline

  const startIndex = documentLines[startRow].indexOf(lodash.head(sourceLines));
  const endIndex = documentLines[endRow].length;

  return {
    startRow: startRow,
    endRow: endRow,
    startIndex: startIndex,
    endIndex: endIndex
  };
}

export function query(element, elementQueries: RefractSymbolMap[], container: string = '') {
  /*
    NOTE: This function is a copy paste of https://github.com/apiaryio/refract-query
    The reason for that was to change some of its behavior and update it to use
    lodash 4. When the PR I opened in the original repo will be merged, this can
    be safely removed.
  */
  if (!element.content) {
    return [];
  }

  if (!lodash.isArray(element.content)) {
    return [];
  }

  const arrayOfArrayOfResults = lodash.map(elementQueries, (elementQuery: RefractSymbolMap) => {
    let filterResult = lodash.filter(element.content, elementQuery.query);
    lodash.forEach(filterResult, res => {
      res.symbolKind = elementQuery.symbolKind;
      res.container = container;
     });
    return filterResult;
  });

  let results = lodash.flatten(arrayOfArrayOfResults);

  return lodash
    .chain(element.content)
    .map((nestedElement) => {
      return query(nestedElement, elementQueries, lodash.get(nestedElement, 'meta.title.content', lodash.get(nestedElement, 'attributes.href.content')));
    })
    .flatten()
    .concat(results)
    .value();
}

export function extractSymbols(element: any,
  document: string,
  documentLines: string[]
): SymbolInformation[] {


  let SymbolInformations: SymbolInformation[] = [];

  const queryResults = query(element, refractSymbolsTree);


  return lodash.transform(queryResults, (result, queryResult) => {
    const lineReference = createLineReferenceFromSourceMap(
      lodash.get(queryResult, 'meta.title.attributes.sourceMap', lodash.get(queryResult, 'attributes.href.attributes.sourceMap')),
      document,
      documentLines
    );

    const description = lodash.get(queryResult, 'meta.title.content', lodash.get(queryResult, 'attributes.href.content'));

    if (!lodash.isEmpty(lineReference)) {
      result.push(SymbolInformation.create(
        description,
        queryResult.symbolKind,
        Range.create(lineReference.startRow, lineReference.startIndex, lineReference.endRow, lineReference.endIndex),
        null,
        queryResult.container));

    }

  });

}

interface RefractSymbolMap {
  symbolKind: SymbolKind,
  query: any,
};


/*
  The following structure is based on
  http://api-elements.readthedocs.io/en/latest/overview/#relationship-of-elements.
  This might not be the complete three, but just the elements we care about.
*/

const refractSymbolsTree: RefractSymbolMap[] = [{
  symbolKind: SymbolKind.Namespace,
  query: {
    "element": "category",
    "meta": {
      "classes": [
        "api"
      ]
    }
  }
}, {
    symbolKind: SymbolKind.Module,
    query: {
      "element": "category",
      "meta": {
        "classes": [
          "resourceGroup"
        ]
      }
    },
  }, {
    symbolKind: SymbolKind.Class,
    query: {
      "element": "resource"
    },
  }, {
    symbolKind: SymbolKind.Method,
    query: {
      "element": "transition"
    },
  }];
