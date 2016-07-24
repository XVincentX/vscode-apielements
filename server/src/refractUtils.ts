const lodash = require("lodash");

import {SymbolInformation, Range, SymbolKind} from 'vscode-languageserver';

export function createLineReferenceFromSourceMap(refractSourceMap, document : string, documentLines : string[]) : any {

  const firstSourceMap = lodash.first(refractSourceMap);

  if (typeof(firstSourceMap) === 'undefined') {
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

export function query(element, elementQuery) {
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

  const results = lodash.filter(element.content, elementQuery);

  return lodash
    .chain(element.content)
    .map((nestedElement) => {
      return query(nestedElement, elementQuery);
    })
    .flatten()
    .concat(results)
    .value();
}

export function extractSymbols(element : any,
                                document : string,
                                documentLines: string[],
                                refractSymbol = refractSymbolsTree,
                                containerName: string = ""
                              ) : SymbolInformation[] {

  if (!element.content) {
    return [];
  }

  if (!lodash.isArray(element.content)) {
    return [];
  }

  const queryResults = query(element, refractSymbol.query);

  return lodash.flatten(queryResults.map((queryResult) => {
    const lineReference = createLineReferenceFromSourceMap(
      lodash.get(queryResult, refractSymbol.sourceMapPath, []),
      document,
      documentLines
    );

    let results = {};
    const description = lodash.get(queryResult, refractSymbol.descriptionPath, '');

    const lodashChain =
      lodash
        .chain(refractSymbol.childs)
        .map((child) => {
          return extractSymbols(queryResult, document, documentLines, child, description);
        })
        .flatten()

    if (!lodash.isEmpty(lineReference)) {
      results = SymbolInformation.create(
        description,
        refractSymbol.symbol,
        Range.create(lineReference.startRow, lineReference.startIndex, lineReference.endRow, lineReference.endIndex),
        null,
        containerName);

      return lodashChain.concat(results).value();
    }

    return lodashChain.value();

  }));

}

interface RefractSymbolMap {
  name: string,
  symbol : SymbolKind,
  query: any,
  sourceMapPath: string,
  descriptionPath: string,
  childs: RefractSymbolMap[]
};


/*
  The following structure is based on
  http://api-elements.readthedocs.io/en/latest/overview/#relationship-of-elements.
  This might not be the complete three, but just the elements we care about.
*/

const refractSymbolsTree : RefractSymbolMap = {
    name: "API",
    symbol: SymbolKind.Namespace,
    query: {
      "element": "category",
        "meta": {
          "classes": [
            "api"
          ]
      }
    },
    sourceMapPath: "meta.title.attributes.sourceMap",
    descriptionPath: "meta.title.content",
    childs: [{
      name: "Resource Group",
      symbol: SymbolKind.Class,
      query: {
        "element": "category",
        "meta": {
          "classes": [
            "resourceGroup"
          ]
        }
      },
      sourceMapPath: "meta.title.attributes.sourceMap",
      descriptionPath: "meta.title.content",
      childs: [{
        name: "Resource",
        symbol: SymbolKind.Method,
        query: {
          "element": "resource"
        },
        sourceMapPath: "meta.title.attributes.sourceMap",
        descriptionPath: "meta.title.content",
        childs: []
      }]
    }]
  };
