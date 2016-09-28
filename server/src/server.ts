'use strict';

import {
  IPCMessageReader, IPCMessageWriter, ServerCapabilities, Range,
  createConnection, IConnection, TextDocuments, TextDocument,
  Diagnostic, DiagnosticSeverity, InitializeResult,
} from 'vscode-languageserver';

import {parse} from './parser';
import {defaultRefractSymbolsTree} from './refractSymbolMap';
import * as refractUtils from './refractUtils';
import {ApiElementsSettings} from './structures';
import {utf16to8} from './utfUtils';

const lodash = require('lodash');
const apiDescriptionMixins = require('lodash-api-description');

const refractDocuments = new Map();
apiDescriptionMixins(lodash);

let debouncedValidateTextDocument: Function = validateTextDocument;

const getHelpUrl = (section: string): string => {
  return `https://github.com/XVincentX/vscode-apielements/blob/master/TROUBLESHOT.md${section}`;
};

let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
let documents: TextDocuments = new TextDocuments();
documents.listen(connection);

let workspaceRoot: string;
connection.onInitialize((params): InitializeResult => {
  workspaceRoot = params.rootPath;

  const capabilities: ServerCapabilities = {
    documentSymbolProvider: true,
    textDocumentSync: documents.syncKind,
  };

  return <InitializeResult> {
    capabilities,
  };

});

documents.onDidChangeContent((change) => {
  debouncedValidateTextDocument(change.document);
});

documents.onDidClose((event) => {
  connection.sendDiagnostics({ diagnostics: [], uri: event.document.uri });
});

let currentSettings: ApiElementsSettings;
let desideredSymbols = defaultRefractSymbolsTree;

connection.onDidChangeConfiguration((change) => {
  const apiElementsSettings: ApiElementsSettings = change.settings.apiElements;
  currentSettings = lodash.cloneDeep(apiElementsSettings);
  debouncedValidateTextDocument = lodash.debounce(validateTextDocument, apiElementsSettings.validation.debounce);

  const desideredSymbolNames =
    Object.keys(apiElementsSettings.symbols).filter(sym => apiElementsSettings.symbols[sym] === true);

  desideredSymbols =
    defaultRefractSymbolsTree.filter(sym => lodash.includes(desideredSymbolNames, sym.friendlyName));

  // Revalidate any open text documents
  documents.all().forEach(validateTextDocument);
});

function validateTextDocument(textDocument: TextDocument): void {
  let diagnostics: Diagnostic[] = [];
  let text = textDocument.getText();

  parse(text, currentSettings.parser)
    .then(output => output, (error) => error.result)
    .then(refractOutput => {

      refractDocuments.set(textDocument.uri.toString(), refractOutput);
      let annotations = lodash.filterContent(refractOutput, { element: 'annotation' });

      const utf8Text = utf16to8(text);
      const documentLines = utf8Text.split(/\r?\n/g);

      lodash.forEach(annotations, (annotation) => {

        const lineReference = refractUtils.createLineReferenceFromSourceMap(
          annotation.attributes.sourceMap,
          text,
          documentLines
        );

        diagnostics.push(<Diagnostic> {
          code: annotation.attributes.code,
          message: annotation.content,
          range: Range.create(
            lineReference.startRow,
            lineReference.startIndex,
            lineReference.endRow,
            lineReference.endIndex
          ),
          severity: ((lodash.head(annotation.meta.classes) === 'warning')
          ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error),
          source: 'fury',
        });

      });

      connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
    });

}

connection.onDocumentSymbol((symbolParam) => {
  try {
    if (currentSettings.parser.exportSourcemap === false) {
      connection.window.showWarningMessage('\
        The current parser options have source maps disabled.\
        Without those, it\'s not possible to generate document symbol.\
        ', { title: 'More Info' }).then(() => {
          connection.sendNotification({ method: 'openUrl' }, getHelpUrl('#no-sourcemaps-enabled'));
        });

      return Promise.resolve([]); // I cannot let you navigate if I have no source map.
    }

    const documentObject = documents.get(symbolParam.textDocument.uri);
    let textDocument = documentObject.getText();

    if (documentObject.languageId === 'API Blueprint') {
      textDocument = utf16to8(textDocument);

      /*
        The reason why this is happening just for API Blueprint is that drafter.js
        is coming from C++ code (using es). Swagger parser is pure javascript thuos
        sourcemaps are char based and not byte based.

        See https://github.com/apiaryio/fury.js/issues/63 for more details.
      */
    }

    const documentLines = textDocument.split(/\r?\n/g);
    const refractOutput = refractDocuments.get(symbolParam.textDocument.uri.toString());

    const symbolArray = refractUtils.extractSymbols(refractOutput, textDocument, documentLines, desideredSymbols);
    return Promise.resolve(symbolArray);
  } catch (err) {
    connection.window.showErrorMessage(err.message);
  }

});

connection.onRequest({ method: 'parserOutput' }, (code: string) => {
  return parse(code, currentSettings.parser);
});

connection.listen();
