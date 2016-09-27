const lodash = require("lodash");

import {SymbolInformation, Range, SymbolKind} from 'vscode-languageserver';

export function createLineReferenceFromSourceMap(refractSourceMap, document: string, documentLines: string[]): any {

  const firstSourceMap = lodash.first(refractSourceMap);

  if (typeof (firstSourceMap) === 'undefined') {
    return {
      startRow: 0,
      startIndex: 0,
      endRow: documentLines.length - 1,
      endIndex: documentLines[documentLines.length - 1].length
    };
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

  const startRow = document.substring(0, sourceMap.charIndex).split(/\r?\n/g).length - 1;
  const endRow = startRow + sourceLines.length - 1;

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
      return query(nestedElement,
        elementQueries,
        decodeURI(lodash.get(nestedElement, 'meta.title.content',
          lodash.get(nestedElement, 'attributes.href.content',
            lodash.get(nestedElement, 'meta.title')
          ))
        )
      );
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

    /*
      WARNING: This might be your reaction when you'll look into this code: 😱
      Thing is there is no really source map here and I do not want to solve this
      thing in this release. The long term idea would be to wait till the underlying
      parser will be updated to generate sourcemaps on generated content as well
      and everybody will be happy; till that moment, please bear with me.
    */

    let sourceMap = undefined;
    ['meta.title.attributes.sourceMap',
      'attributes.href.attributes.sourceMap',
      (qs) => query(qs, [{ symbolKind: 0, query: { "attributes": { "method": {} } } }])
    ].some((path: string | Function): boolean => {
      if (typeof (path) === 'function') {
        sourceMap = lodash.get((<Function>path)(queryResult)[0], 'attributes.method.attributes.sourceMap');
        return true;
      } else {
        if (lodash.has(queryResult, path)) {
          sourceMap = lodash.get(queryResult, path);
          return true;
        }
      }
    });

    const lineReference = createLineReferenceFromSourceMap(
      sourceMap,
      document,
      documentLines
    );

    let description = '';

    ['meta.title.content',
      'attributes.href.content',
      (qs) => query(qs, [{ symbolKind: 0, query: { "attributes": { "method": {} } } }])
    ].some((path: string | Function): boolean => {
      if (typeof (path) === 'function') {
        description = decodeURI(lodash.get((<Function>path)(queryResult)[0], 'attributes.method.content'));
        return true;
      } else {
        if (lodash.has(queryResult, path)) {
          description = decodeURI(lodash.get(queryResult, path));
          return true;
        }
      }

    });

    if (!lodash.isEmpty(lineReference)) {
      result.push(SymbolInformation.create(
        description,
        queryResult.symbolKind,
        Range.create(
          lineReference.startRow,
          lineReference.startIndex,
          lineReference.endRow,
          lineReference.endIndex
        ),
        null,
        queryResult.container));

    }

  });

}

interface RefractSymbolMap {
  symbolKind: SymbolKind,
  query: any,
  friendlyName?: string
};


/*
  The following structure is based on
  http://api-elements.readthedocs.io/en/latest/overview/#relationship-of-elements.
  This might not be the complete three, but just the elements we care about.
*/

const refractSymbolsTree: RefractSymbolMap[] = [{
  symbolKind: SymbolKind.Namespace,
  friendlyName: 'api',
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
    friendlyName: 'resourceGroup',
    query: {
      "element": "category",
      "meta": {
        "classes": [
          "resourceGroup"
        ],
        "title": {}
      }
    },
  }, {
    symbolKind: SymbolKind.Class,
    friendlyName: 'resource',
    query: {
      "element": "resource"
    },
  }, {
    symbolKind: SymbolKind.Method,
    friendlyName: 'transition',
    query: {
      "element": "transition",
      "content": [{
        element: "httpTransaction"
      }]
    },
  }];
