/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
  IPCMessageReader, IPCMessageWriter,
  createConnection, IConnection, TextDocumentSyncKind,
  TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity,
  InitializeParams, InitializeResult, TextDocumentPositionParams,
  CompletionItem, CompletionItemKind
} from 'vscode-languageserver';

let lodash = require('lodash');
let apiDescriptionMixins = require('lodash-api-description');
let drafter = require('drafter.js');
apiDescriptionMixins(lodash);

// Create a connection for the server. The connection uses Node's IPC as a transport
let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilites.
let workspaceRoot: string;
connection.onInitialize((params): InitializeResult => {
  workspaceRoot = params.rootPath;
  return {
    capabilities: {
      // Tell the client that the server works in FULL text document sync mode
      textDocumentSync: documents.syncKind,
      // Tell the client that the server support code complete
      completionProvider: {
        resolveProvider: true
      }
    }
  }
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
  validateTextDocument(change.document);
});

// The settings interface describe the server relevant settings part
interface Settings {
  languageServerExample: ExampleSettings;
}

// These are the example settings we defined in the client's package.json
// file
interface ExampleSettings {
  maxNumberOfProblems: number;
}

// hold the maxNumberOfProblems setting
let maxNumberOfProblems: number;
// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration((change) => {
  let settings = <Settings>change.settings;
  maxNumberOfProblems = settings.languageServerExample.maxNumberOfProblems || 100;
  // Revalidate any open text documents
  documents.all().forEach(validateTextDocument);
});

function validateTextDocument(textDocument: TextDocument): void {
  let diagnostics: Diagnostic[] = [];
  let text = textDocument.getText();

  try {

    let refractOutput = drafter.parse(text);
    let annotations = lodash.filterContent(refractOutput, {element: 'annotation'});

    lodash.forEach(annotations, (annotation) => {
      let errorLine = text
                  .substring(annotation.attributes.sourceMap[0].content[0][0])
                  .split(/\r?\n/g)[0];

      //let lineNumber = lodash.findIndex(text.split(/\r?\n/g), (line) => {line.indexOf(errorLine) > -1});
      const lineNumber = 0;

      diagnostics.push({
        severity: ((annotation.meta.classes[0] === 'warning') ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error),
        code: annotation.attributes.code,
        range: {
          start: { line: lineNumber, character: 0},
          end: { line: lineNumber, character: 1 }
        },
        message: annotation.content,
        source: 'drafter.js'
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
      source: 'drafter.js'
    });
  }
  finally {
    // Send the computed diagnostics to VSCode.
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
  }
}

connection.onDidChangeWatchedFiles((change) => {
  // Monitored files have change in VSCode
  connection.console.log('We recevied an file change event');
});


// This handler provides the initial list of the completion items.
connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
  // The pass parameter contains the position of the text document in
  // which code complete got requested. For the example we ignore this
  // info and always provide the same completion items.
  return [
    {
      label: 'TypeScript',
      kind: CompletionItemKind.Text,
      data: 1
    },
    {
      label: 'JavaScript',
      kind: CompletionItemKind.Text,
      data: 2
    }
  ]
});

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  if (item.data === 1) {
    item.detail = 'Piedini fetosini',
    item.documentation = 'TypeScript documentation'
  } else if (item.data === 2) {
    item.detail = 'Nasino pariosino',
    item.documentation = 'JavaScript documentation'
  }
  return item;
});

/*
connection.onDidOpenTextDocument((params) => {
  // A text document got opened in VSCode.
  // params.uri uniquely identifies the document. For documents store on disk this is a file URI.
  // params.text the initial full content of the document.
  connection.console.log(`${params.uri} opened.`);
});

connection.onDidChangeTextDocument((params) => {
  // The content of a text document did change in VSCode.
  // params.uri uniquely identifies the document.
  // params.contentChanges describe the content changes to the document.
  connection.console.log(`${params.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});

connection.onDidCloseTextDocument((params) => {
  // A text document got closed in VSCode.
  // params.uri uniquely identifies the document.
  connection.console.log(`${params.uri} closed.`);
});
*/

// Listen on the connection
connection.listen();
