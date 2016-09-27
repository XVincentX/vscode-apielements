/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as path from 'path';
import { window, workspace, ExtensionContext, commands, Uri, EndOfLine } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';
import * as Commands from './commands';

function registerCommands(client: LanguageClient, context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerTextEditorCommand('apiElements.parserOutput', Commands.parseOutput.bind(this, context, client)),
    commands.registerCommand('apiElements.apiary.fetchApi', Commands.fetchApi.bind(this, context)),
    commands.registerCommand('apiElements.apiary.logout', Commands.logout.bind(this, context)),
    commands.registerTextEditorCommand('apiElements.apiary.publishApi', Commands.publishApi.bind(this, context)),
    commands.registerTextEditorCommand('apiElements.apiary.browse', Commands.browse.bind(this, context))
  );
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
          insertSpaces: true,
          tabSize: 4,
        };

        textEditor.edit(editBuilder =>
          editBuilder.setEndOfLine(EndOfLine.LF)
        );
      }
    }
  });

}

export function activate(context: ExtensionContext) {
  const serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
  const debugOptions = { execArgv: ["--nolazy", "--debug=6004"] };
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: ['API Blueprint', 'Swagger'],
    synchronize: {
      configurationSection: 'apiElements',
      fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
    }
  };

  const client = new LanguageClient('apiElements', 'Api Elements', serverOptions, clientOptions);

  registerCommands(client, context);
  registerNotifications(client);
  registerWindowEvents();

  context.subscriptions.push(client.start());

}
