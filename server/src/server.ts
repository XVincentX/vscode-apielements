'use strict';

import {
  IPCMessageReader, IPCMessageWriter, ServerCapabilities, SymbolKind, Range,
  createConnection, IConnection, TextDocumentSyncKind,
  TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity,
  InitializeParams, InitializeResult, TextDocumentPositionParams,
  CompletionItem, CompletionItemKind, SymbolInformation
} from 'vscode-languageserver';

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
  apielements: ApiElementsSettings;
}

interface ApiElementsSettings {
  exportSourcemap: boolean;
  json: boolean;
  requireBlueprintName: boolean;
  type: string;
};

let currentSettings : ApiElementsSettings;

connection.onDidChangeConfiguration((change) => {
  currentSettings = lodash.defaults({
    exportSourcemap: true,
    json: false,
    requireBlueprintName: false,
    type: 'refract'
  }, change.settings);
  // Revalidate any open text documents
  documents.all().forEach(validateTextDocument);
});

function validateTextDocument(textDocument: TextDocument): void {
  let diagnostics: Diagnostic[] = [];
  let text = textDocument.getText();

  try {

    refractOutput = parser.parse(text, currentSettings);
    let annotations = lodash.filterContent(refractOutput, {element: 'annotation'});

    let documentLines = text.split(/\r?\n/g);

    lodash.forEach(annotations, (annotation) => {

      const sourceMap = lodash.map(lodash.first(annotation.attributes.sourceMap).content, (sm) => {
        return {
          charIndex: lodash.head(sm),
          charCount: lodash.last(sm)
        }
      });

      const sm = lodash.head(sourceMap);

      const errorLine = lodash.head(text.substring(sm.charIndex).split(/\r?\n/g));
      const errorRow = lodash.findIndex(documentLines, (line) =>
          line.indexOf(errorLine) > -1
      );

      const startIndex = documentLines[errorRow].indexOf(errorLine);

      diagnostics.push({
        severity: ((lodash.head(annotation.meta.classes) === 'warning') ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error),
        code: annotation.attributes.code,
        range: {
          start: { line: errorRow, character: startIndex},
          end: { line: errorRow, character: startIndex + sm.charCount }
        },
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

connection.onDidChangeWatchedFiles((change) => {
  connection.console.log('We recevied an file change event');
});

connection.onDocumentSymbol((symbolParam) => {
  let cat = lodash.head(lodash.filterContent(refractOutput, {element: 'category'}));
  let cat2 = lodash.filterContent(cat, {element: 'category'});

  let resources = lodash.map(cat2, (ct2) => {return lodash.resources(ct2)});

  const symbolArray = lodash.map(lodash.flatten(resources), (resource) => {
    return SymbolInformation.create(resource.meta.title, SymbolKind.Property, Range.create(1,1,1,1), "", "");
  });

  return Promise.resolve<SymbolInformation[]>(symbolArray);
});

connection.listen();
