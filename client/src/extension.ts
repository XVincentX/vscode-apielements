/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as path from 'path';
import * as fs from 'fs';
import {ApiaryClient} from './apiaryClient';

import { window, workspace, Disposable, ExtensionContext, commands, Uri, WorkspaceEdit, Position, ViewColumn, EndOfLine, QuickPickItem } from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';

function showError(err) {
  window.showErrorMessage(err.message || err);
}

function registerCommands(client: LanguageClient, context: ExtensionContext) {
  context.subscriptions.push(commands.registerTextEditorCommand('apiElements.parserOutput', (editor) => {
    const statusBarDisposable = window.setStatusBarMessage("Parsing current document...");
    client.sendRequest({ method: "parserOutput" }, editor.document.getText())
      .then((result) => {
        const stringifiedResult = JSON.stringify(result, null, 2);
        return showUntitledWindow("parseResult.json", stringifiedResult, context.extensionPath);
      })
      .then(() => {
        statusBarDisposable.dispose();
      })
      .then(null, showError);
  }));

  context.subscriptions.push(commands.registerCommand('apiElements.apiary.fetchApi', () => {
    let tmpClient = new ApiaryClient("PLACE SOME TOKEN HERE");
    let d = window.setStatusBarMessage('Querying Apiary registry on your behalf...');
    return tmpClient.getApiList()
      .then(res => {
        const elements = res.map((element => {
          return <QuickPickItem>{
            label: element.apiSubdomain,
            description: element.apiName,
            detail: element.apiDocumentationUrl
          };
        }))
        d.dispose();
        return window.showQuickPick(elements, { matchOnDescription: true, matchOnDetail: false, placeHolder: "Select your API" });
      })
      .then((selectedApi: QuickPickItem) => {
        return Promise.all([tmpClient.getApiCode(selectedApi.label), selectedApi.label]);
      })
      .then(([res, apiName]) => {
        return showUntitledWindow(`${apiName}.apib`, (<any>res).code, context.extensionPath);
      })
      .then(undefined, showError);
  }));

  context.subscriptions.push(commands.registerCommand('apiElements.apiary.publishApi', () => {
    commands.executeCommand('vscode.open', Uri.parse('https://login.apiary.io/tokens'));
  }));

  context.subscriptions.push(commands.registerCommand('apiElements.apiary.logout', () => {
    commands.executeCommand('vscode.open', Uri.parse('https://login.apiary.io/tokens'));
  }));
}

function registerNotifications(client: LanguageClient) {
  client.onNotification({ method: "openUrl" }, (url) => {
    commands.executeCommand("vscode.open", Uri.parse(<string>url));
  });
}

function registerWindowEvents() {
  window.onDidChangeActiveTextEditor((textEditor) => {

    if (textEditor.document.languageId === 'API Blueprint') {

      const adjustEditor = workspace.getConfiguration('apiElements').get('editor.adjustOptions');

      if (adjustEditor === true) {
        textEditor.options = {
          insertSpaces: false,
          tabSize: 4,
        };

        textEditor.edit((editBuilder) => {
          editBuilder.setEndOfLine(EndOfLine.LF);
        });
      }
    }
  })

}

function showUntitledWindow(fileName: string, content: string, fallbackPath : string) {
  const uri = Uri.parse(`untitled:${path.join(workspace.rootPath || fallbackPath, fileName)}`);
  return workspace.openTextDocument(uri)
    .then((textDocument) => {
      const edit = new WorkspaceEdit();
      edit.insert(<Uri>uri, new Position(0, 0), content);
      return Promise.all([<any>textDocument, workspace.applyEdit(edit)]);
    })
    .then(([textDocument, editApplied]) => {
      return window.showTextDocument(<any>textDocument, ViewColumn.One, false);
    })
}

export function activate(context: ExtensionContext) {
  const serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
  const debugOptions = { execArgv: ["--nolazy", "--debug=6004"] };
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
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

  registerCommands(client, context);
  registerNotifications(client);
  registerWindowEvents();

  context.subscriptions.push(client.start());

}
