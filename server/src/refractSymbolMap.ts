import {SymbolKind} from 'vscode-languageserver';

interface RefractSymbolMap {
  symbolKind: SymbolKind;
  query: any;
  friendlyName?: string;
};

/*
  The following structure is based on
  http://api-elements.readthedocs.io/en/latest/overview/#relationship-of-elements.
  This might not be the complete three, but just the elements we care about.
*/

const defaultRefractSymbolsTree: RefractSymbolMap[] = [{
  friendlyName: 'api',
  query: {
    element: "category",
    meta: {
      classes: [
        "api",
      ],
    },
  },
  symbolKind: SymbolKind.Namespace,
}, {
    friendlyName: 'resourceGroup',
    query: {
      element: "category",
      meta: {
        classes: [
          "resourceGroup",
        ],
        title: {},
      },
    },
    symbolKind: SymbolKind.Module,
  }, {
    friendlyName: 'resource',
    query: {
      element: "resource",
    },
    symbolKind: SymbolKind.Class,
  }, {
    friendlyName: 'transition',
    query: {
      content: [{
        element: "httpTransaction",
      }],
      element: "transition",
    },
    symbolKind: SymbolKind.Method,
  }];

export {RefractSymbolMap, defaultRefractSymbolsTree};
