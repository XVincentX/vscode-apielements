'use strict';

import {
  IPCMessageReader, IPCMessageWriter, ServerCapabilities, SymbolKind, Range,
  createConnection, IConnection, TextDocumentSyncKind,
  TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity,
  InitializeResult, SymbolInformation
} from 'vscode-languageserver';

import * as refractUtils from './refractUtils';

let lodash = require('lodash');
let apiDescriptionMixins = require('lodash-api-description');
let parser = require('drafter.js');
let refractOutput = undefined;
apiDescriptionMixins(lodash);

let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
let documents: TextDocuments = new TextDocuments();
documents.listen(connection);

let workspaceRoot: string;
connection.onInitialize((params): InitializeResult => {
  workspaceRoot = params.rootPath;

  let capabilities : ServerCapabilities = {
      textDocumentSync: documents.syncKind,
      documentSymbolProvider: true
    }

  return {
    capabilities: capabilities
  }
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
        source: "drafter.js"
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
      source: "drafter.js"
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

  return Promise.resolve(symbolArray);
});

connection.listen();
