'use strict';

import {
  IPCMessageReader, IPCMessageWriter, ServerCapabilities, SymbolKind, Range,
  createConnection, IConnection, TextDocumentSyncKind,
  TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity,
  InitializeResult, SymbolInformation, Files, ResponseError, InitializeError
} from 'vscode-languageserver';

import * as refractUtils from './refractUtils';

let lodash = require('lodash');
let apiDescriptionMixins = require('lodash-api-description');

let parser = undefined;
let parserName = undefined;

let refractOutput = undefined;
apiDescriptionMixins(lodash);

const setParser = (value, type : string) => {
  parser = value;
  parserName = type;
}

let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
let documents: TextDocuments = new TextDocuments();
documents.listen(connection);

let workspaceRoot: string;
connection.onInitialize((params): Thenable<InitializeResult | ResponseError<InitializeError>> => {
  workspaceRoot = params.rootPath;

  const capabilities : ServerCapabilities = {
      textDocumentSync: documents.syncKind,
      documentSymbolProvider: true
    }

  return Files.resolveModule(workspaceRoot, 'drafter.js').then((value) => {
    setParser(value, 'Drafter.js');
    return { capabilities: capabilities };
  }, (error) => {
    return Files.resolveModule(workspaceRoot, 'protagonist').then((value) => {
      setParser(value, 'Protagonist');
      return { capabilities: capabilities };
  }, (error) => {
      setParser(require('drafter.js'), 'Ext Drafter.js');
      return { capabilities: capabilities };
    });
  });
});

documents.onDidChangeContent((change) => {
  validateTextDocument(change.document);
});

interface Settings {
  apiElements: ApiElementsSettings;
};

interface ApiElementsSettings {
  parser: ParserSettings;
};

interface ParserSettings {
  exportSourcemap: boolean;
  json: boolean;
  requireBlueprintName: boolean;
  type: string;
};

let currentSettings : ApiElementsSettings;

connection.onDidChangeConfiguration((change) => {
  currentSettings = lodash.cloneDeep(change.settings.apiElements);
  // Revalidate any open text documents
  documents.all().forEach(validateTextDocument);
});

function validateTextDocument(textDocument: TextDocument): void {
  let diagnostics: Diagnostic[] = [];
  let text = textDocument.getText();

  try {

    refractOutput = parser.parse(text, currentSettings.parser);
    let annotations = lodash.filterContent(refractOutput, {element: 'annotation'});

    let documentLines = text.split(/\r?\n/g);

    lodash.forEach(annotations, (annotation) => {
      const lineReference = refractUtils.createLineReferenceFromSourceMap(annotation.attributes.sourceMap, text, documentLines);

      diagnostics.push({
        severity: ((lodash.head(annotation.meta.classes) === 'warning') ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error),
        code: annotation.attributes.code,
        range: Range.create(
          lineReference.startIndex,
          lineReference.startIndex,
          lineReference.endIndex,
          lineReference.endIndex
        ),
        message: annotation.content,
        source: parserName
      });
    });
  } catch(err) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: {
        start: { line: 1, character: 0},
        end: { line: 1, character: 0 }
      },
      message: err.message,
      source: parserName
    });
  }
  finally {
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
  }
}

connection.onDocumentSymbol((symbolParam) => {
  if (currentSettings.parser.exportSourcemap === false) {
    return Promise.resolve([]); // I cannot let you navigate if I have no source map.
  }

  let symbolArray : SymbolInformation[] = [] ;

  const textDocument = documents.get(symbolParam.textDocument.uri);
  const documentLines = textDocument.getText().split(/\r?\n/g);

  let mainCategory = lodash.head(lodash.filterContent(refractOutput, {element: 'category'}));

  // The first category should always have at least a title.
  const title = lodash.get(mainCategory, 'meta.title');
  if (typeof(title) !== 'undefined') {
    const lineReference = refractUtils.createLineReferenceFromSourceMap(title.attributes.sourceMap, textDocument.getText(), documentLines);
    symbolArray.push(SymbolInformation.create(
      title.content,
      SymbolKind.Package,
      Range.create(
        lineReference.startRow,
        lineReference.startIndex,
        lineReference.endRow,
        lineReference.endIndex
      )
    ));
  }


  [{
    query: {
    "element": "category",
      "meta": {
        "classes": [
          "resourceGroup",
        ],
      },
    },
    symbolType: SymbolKind.Namespace
  }, {
      query: {"element": "resource"},
      symbolType: SymbolKind.Method
  }
  ].forEach(({query, symbolType}) => {
    const queryResults = refractUtils.query(refractOutput, query);

    symbolArray.push(...lodash.map(queryResults, (queryResult) => {
      /*
        Unfortunately drafter is missing some required sourcemaps, so as a
        temporaney solution, I have to try to lookup into multiple paths.
      */
      let sourceMap = lodash.get(queryResult, 'attributes.sourceMap',
        lodash.get(queryResult, 'meta.title.attributes.sourceMap',
          lodash.get(queryResult, 'attributes.href.attributes.sourceMap',
            lodash.get(queryResult, 'content[0].attributes.method.attributes.sourceMap')
          )
        )
      );

      const lineReference = refractUtils.createLineReferenceFromSourceMap(
      sourceMap,
      textDocument.getText(),
      documentLines
    );

      return SymbolInformation.create(
            lodash.get(queryResult, 'meta.title.content', lodash.get(queryResult, 'meta.title', lodash.get(queryResult, 'content[0].attributes.content'))),
            symbolType,
            Range.create(
              lineReference.startRow,
              lineReference.startIndex,
              lineReference.endRow,
              lineReference.endIndex
            )
          )
    }));
  })

  return Promise.resolve(symbolArray);
});

connection.listen();
