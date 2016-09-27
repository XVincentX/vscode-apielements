import {SymbolKind} from 'vscode-languageserver';

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

const defaultRefractSymbolsTree: RefractSymbolMap[] = [{
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

export {RefractSymbolMap, defaultRefractSymbolsTree};
