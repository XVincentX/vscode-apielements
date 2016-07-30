/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as path from 'path';
import * as fs from 'fs';
import {ApiaryClient} from './apiaryClient';
import {showUntitledWindow} from './showUntitledWindow';
import {showMessage} from './showMessage';

import { window, workspace, Disposable, ExtensionContext, commands, Uri, WorkspaceEdit, Position, ViewColumn, EndOfLine, QuickPickItem } from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';

let apiaryClient = undefined;

function requestApiaryClient(context: ExtensionContext): Thenable<ApiaryClient> {

  const tokenFilePath = path.join(context.extensionPath, ".apiaryToken");

  if (apiaryClient === undefined) {

    if (process.env.APIARY_API_KEY !== undefined){
      // According to apiary-client, this might be defined.
      apiaryClient = new ApiaryClient(process.env.APIARY_API_KEY);
      return Promise.resolve(apiaryClient);
    }
    // Probably it's saved into our super fancy file?
    try {
      const token = fs.readFileSync(tokenFilePath, 'utf8');
      apiaryClient = new ApiaryClient(token);
      return Promise.resolve(apiaryClient);
    } catch (e) {

    }


    return window.showWarningMessage("Unable to find an Apiary Token. It's required to operate with Apiary", "Grab one!")
      .then(result => {
        if (result === "Grab one!")
          return commands.executeCommand('vscode.open', Uri.parse("https://login.apiary.io/tokens"));

        throw 0;
      })
      .then(() => window.showInputBox({ placeHolder: "Paste Apiary token here", password: true }))
      .then(token => {
        if (token === undefined) {
          const e = new Error('No Apiary token provided');
          e["type"] = "info";
          throw e;
        }

        try {
          fs.writeFileSync(tokenFilePath, token, { encoding: 'utf8' });
        } catch (e) {
          showMessage(e);
        }
        apiaryClient = new ApiaryClient(token);
        return apiaryClient;

      });
  }

  return Promise.resolve(apiaryClient);
}

function registerCommands(client: LanguageClient, context: ExtensionContext) {
  context.subscriptions.push(commands.registerTextEditorCommand('apiElements.parserOutput', editor => {
    const statusBarDisposable = window.setStatusBarMessage("Parsing current document...");
    client.sendRequest({ method: "parserOutput" }, editor.document.getText())
      .then(result => {
        const stringifiedResult = JSON.stringify(result, null, 2);
        return showUntitledWindow("parseResult.json", stringifiedResult, context.extensionPath);
      })
      .then(() => {
        statusBarDisposable.dispose();
      })
      .then(null, showMessage);
  }));

  context.subscriptions.push(commands.registerCommand('apiElements.apiary.fetchApi', () => {
    let d = window.setStatusBarMessage('Querying Apiary registry on your behalf...');
    return requestApiaryClient(context)
      .then(client => client.getApiList())
      .then(res => {
        const elements = res.apis.map(element =>
          <QuickPickItem>{
            label: element.apiSubdomain,
            description: element.apiName,
            detail: element.apiDocumentationUrl
          });
        d.dispose();
        return window.showQuickPick(elements, { matchOnDescription: true, matchOnDetail: false, placeHolder: "Select your API" });
      })

      .then((selectedApi: QuickPickItem) => {
        if (selectedApi === undefined) {
          throw 0;
        }

        return Promise.all([apiaryClient.getApiCode(selectedApi.label), selectedApi.label]);
      })
      .then(([res, apiName]) => showUntitledWindow(`${apiName}.apib`, (<any>res).code, context.extensionPath))
      .then(undefined, showMessage);
  }));

  context.subscriptions.push(commands.registerCommand('apiElements.apiary.logout', () => {
    const tokenFilePath = path.join(context.extensionPath, ".apiaryToken");
    if (fs.existsSync(path.join(context.extensionPath, ".apiaryToken")))
      fs.unlinkSync(tokenFilePath);

    apiaryClient = undefined;

  }));

  context.subscriptions.push(commands.registerTextEditorCommand('apiElements.apiary.publishApi', textEditor => {

    window.showInputBox({
      value: "Saving API Description Document from VSCode",
      placeHolder: "Commit message for this change"
    })
      .then(message => {
        // Try to infer the API Name from the file
        const filePath = (textEditor.document.fileName);
        const apiName = path.basename(filePath, path.extname(filePath));

        return Promise.all([requestApiaryClient(context), filePath, apiName, message]);
      })
      .then(([client, filePath, apiName, message]) => (<any>client).publishApi(apiName, textEditor.document.getText(), message))
      .then(() => window.showInformationMessage('API successuflly published on Apiary!'))
      .then(undefined, showMessage);
  }));

}

function registerNotifications(client: LanguageClient) {
  client.onNotification({ method: "openUrl" }, url =>
    commands.executeCommand("vscode.open", Uri.parse(<string>url))
  );
}

function registerWindowEvents() {
  window.onDidChangeActiveTextEditor(textEditor => {

    if (textEditor.document.languageId === 'API Blueprint') {

      const adjustEditor = workspace.getConfiguration('apiElements').get('editor.adjustOptions');

      if (adjustEditor === true) {
        textEditor.options = {
          insertSpaces: false,
          tabSize: 4,
        };

        textEditor.edit(editBuilder =>
          editBuilder.setEndOfLine(EndOfLine.LF)
        );
      }
    }
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
