/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as path from 'path';
import * as fs from 'fs';

import { window, workspace, Disposable, ExtensionContext, commands, Uri } from 'vscode';
import * as vscode from 'vscode';

import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';

export function activate(context: ExtensionContext) {
  const serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
  const debugOptions = { execArgv: ["--nolazy", "--debug=6004"] };
  const serverOptions: ServerOptions = {
    run : { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
  }

  const clientOptions: LanguageClientOptions = {
    documentSelector: ['API Blueprint'],
    synchronize: {
      configurationSection: 'apiElements',
      fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
    }
  }

  const client = new LanguageClient('Api Elements', serverOptions, clientOptions);

  context.subscriptions.push(commands.registerTextEditorCommand('apiElements.parserOutput', (editor) => {
    const statusBarDisposable = window.setStatusBarMessage("Parsing current document...");

    client.sendRequest({method: "parserOutput"}, editor.document.getText()).then((result) => {
      const stringifiedResult = JSON.stringify(result, null, 2);
      const uri = Uri.parse(`untitled:${workspace.rootPath ||context.extensionPath}/parseResult.json`);
      workspace.openTextDocument(uri).then((textDocument) => {
        const edit = new vscode.WorkspaceEdit();
        edit.insert(uri, new vscode.Position(0,0), stringifiedResult);
        workspace.applyEdit(edit).then(() => {
          window.showTextDocument(textDocument, vscode.ViewColumn.One ,false).then(() => {
            statusBarDisposable.dispose();
          }, showError);
        }, showError);
      }, showError);
    }, showError)
  }));

  context.subscriptions.push(client.start());

  function showError(err) {
    window.showErrorMessage(err || err.message);
  }
}
