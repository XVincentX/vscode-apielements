const lodash = require("lodash");

import { RefractSymbolMap } from './refractSymbolMap';
import { Range, SymbolInformation } from 'vscode-languageserver';

export function createLineReferenceFromSourceMap(refractSourceMap, document: string, documentLines: string[]): any {

  const firstSourceMap = lodash.first(refractSourceMap);

  if (typeof (firstSourceMap) === 'undefined') {
    return {
      endIndex: documentLines[documentLines.length - 1].length,
      endRow: documentLines.length - 1,
      startIndex: 0,
      startRow: 0,
    };
  }

  const sourceMap = {
    charCount: firstSourceMap[1],
    charIndex: firstSourceMap[0],
  };

  const sourceSubstring = document.substring(sourceMap.charIndex, sourceMap.charIndex + sourceMap.charCount);
  const sourceLines = sourceSubstring.split(/\r?\n/g);

  if (sourceSubstring === '\n' || sourceSubstring === '\r') {
    // It's on a newline which I cannot show in the document.
    return {
      endIndex: lodash.last(documentLines).length,
      endRow: documentLines.length,
      startIndex: 0,
      startRow: 0,
    };
  }

  const startRow = document.substring(0, sourceMap.charIndex).split(/\r?\n/g).length - 1;
  const endRow = startRow + sourceLines.length - 1;

  const startIndex = documentLines[startRow].indexOf(lodash.head(sourceLines));
  const endIndex = documentLines[endRow].length;

  return {
    startRow,
    endRow,
    startIndex,
    endIndex,
  };
}

export function query(element, elementQueries, container: string = '') {
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
    const filterResult = lodash.filter(element.content, elementQuery.query);
    lodash.forEach(filterResult, (res) => {
      res.symbolKind = elementQuery.symbolKind;
      res.container = container;
    });
    return filterResult;
  });

  const results = lodash.flatten(arrayOfArrayOfResults);

  return lodash
    .chain(element.content)
    .map((nestedElement) => {
      return query(nestedElement,
        elementQueries,
        decodeURI(lodash.get(nestedElement, 'meta.title.content',
          lodash.get(nestedElement, 'attributes.href.content',
            lodash.get(nestedElement, 'meta.title'),
          )),
        ),
      );
    })
    .flatten()
    .concat(results)
    .value();
}

export function extractSymbols(
  element: any,
  document: string,
  documentLines: string[],
  symbolsType: RefractSymbolMap[],
): SymbolInformation[] {

  const queryResults = query(element, symbolsType);

  return lodash.transform(queryResults, (result, queryResult) => {

    /*
      WARNING: This might be your reaction when you'll look into this code: 😱
      Thing is there is no really source map here and I do not want to solve this
      thing in this release. The long term idea would be to wait till the underlying
      parser will be updated to generate sourcemaps on generated content as well
      and everybody will be happy; till that moment, please bear with me.
    */

    let sourceMap;
    ['meta.title.attributes.sourceMap',
      'attributes.href.attributes.sourceMap',
      (qs) => query(qs, [{ query: { attributes: { method: {} } }, symbolKind: 0 }]),
    ].some((path: string | Function): boolean => {
      if (typeof (path) === 'function') {
        sourceMap = lodash.get((path as Function)(queryResult)[0], 'attributes.method.attributes.sourceMap');
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
      documentLines,
    );

    let description = '';

    ['meta.title.content',
      'attributes.href.content',
      (qs) => query(qs, [{ query: { attributes: { method: {} } }, symbolKind: 0 }]),
    ].some((path: string | Function): boolean => {
      if (typeof (path) === 'function') {
        description = decodeURI(lodash.get((path as Function)(queryResult)[0], 'attributes.method.content'));
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
          lineReference.endIndex,
        ),
        null,
        queryResult.container));

    }

  });

}
