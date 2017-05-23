import * as fs from 'fs';
import * as path from 'path';

import {
  commands, ExtensionContext, Position, QuickPickItem, Range, TextEditor,
  Uri, ViewColumn, window, workspace,
} from 'vscode';
import { LanguageClient } from 'vscode-languageclient';
import { killCurrentApiaryClient, requestApiaryClient } from './requestApiaryClient';
import { showMessage } from './showMessage';
import { showUntitledWindow } from './showUntitledWindow';

import axios from 'axios';

const escape = require('lodash.escape');

function selectApi(context: ExtensionContext) {
  return requestApiaryClient(context)
    .then((client) => Promise.all([client.getApiList(), client]))
    .then(([res, client]) => {
      const elements = (res as any).apis.map((element) =>
        ({
          description: element.apiName,
          detail: element.apiDocumentationUrl,
          label: element.apiSubdomain,
        } as QuickPickItem));
      return Promise.all([window.showQuickPick(elements, {
        matchOnDescription: true,
        matchOnDetail: false,
        placeHolder: 'Select your API',
      }), client]);
    });
}

export function parseOutput(
  context: ExtensionContext,
  client: LanguageClient,
  viewColumn: ViewColumn,
  editor: TextEditor) {
  window.setStatusBarMessage(
    'Parsing current document...',
    client.sendRequest('parserOutput', editor.document.getText())
      .then((result) => showUntitledWindow('parseResult.json', JSON.stringify(result, null, 2), context.extensionPath, viewColumn),
      (err) => {
        if (err.result !== undefined) {
          return showUntitledWindow('parseResult.json', JSON.stringify(err.result, null, 2), context.extensionPath, viewColumn);
        }

        throw err;
      })
      .then(undefined, showMessage),
  );
}

export function fetchApi(context: ExtensionContext) {
  window.setStatusBarMessage('Fetching API list from Apiary...',
    selectApi(context)
      .then(([selectedApi, client]) => {
        if (selectedApi === undefined) {
          throw 0;
        }

        return Promise.all([(client as any).getApiCode((selectedApi as any).label), (selectedApi as any).label]);
      })
      .then(([res, apiName]): Thenable<any> => {

        if (window.activeTextEditor === undefined) {
          return showUntitledWindow(`${apiName}`, (res as any).code, context.extensionPath, ViewColumn.One);
        }

        return window.activeTextEditor.edit((builder) => {
          const lastLine = window.activeTextEditor.document.lineCount;
          const lastChar = window.activeTextEditor.document.lineAt(lastLine - 1).range.end.character;
          builder.delete(new Range(0, 0, lastLine, lastChar));
          builder.replace(new Position(0, 0), (res as any).code);
        });
      })
      .then(undefined, showMessage),
  );

}

export function publishApi(context: ExtensionContext, textEditor: TextEditor) {
  window.setStatusBarMessage('Publishing API on Apiary...',
    selectApi(context)
      .then(([selectedApi, client]) => {
        return (client as any).publishApi((selectedApi as any).label, textEditor.document.getText(), '');
      })
      .then(() => window.showInformationMessage('API successuflly published on Apiary!'))
      .then(undefined, showMessage),
  );
}

export function previewApi(context: ExtensionContext, textEditor: TextEditor) {
  const code = escape(textEditor.document.getText());
  const preview =
    `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <title>API Preview</title>
    </head>
    <body>
    <script src="https://api.apiary.io/seeds/embed.js"></script>
    <script>
    var embed = new Apiary.Embed({
    apiBlueprint: \`${code}\`,
    });
    </script>
    </body>
    </html>`;

  const filePath = path.join(workspace.rootPath || context.extensionPath, 'preview.html');
  fs.writeFileSync(filePath, preview, 'utf8');

  return commands.executeCommand('vscode.previewHtml', Uri.parse(`file:${filePath}`), getViewColumn())
    .then(() => fs.unlinkSync(filePath));
}

export function logout(context: ExtensionContext) {
  const tokenFilePath = path.join(context.extensionPath, '.apiaryToken');
  if (fs.existsSync(path.join(context.extensionPath, '.apiaryToken'))) {
    fs.unlinkSync(tokenFilePath);
    killCurrentApiaryClient();
  }
}

export function browse(context: ExtensionContext, textEditor: TextEditor) {
  const documentFilename = path.basename(textEditor.document.fileName, path.extname(textEditor.document.fileName));
  const url = `http://docs.${documentFilename}.apiary.io/`;

  return axios.get(url)
    .then(() => Uri.parse(url), () => {
      return selectApi(context)
        .then(([selectedApi]) => {
          if (selectedApi === undefined) {
            throw 0;
          }

          return Uri.parse((selectedApi as any).detail) as any;
        });
    })
    .then((uri) => commands.executeCommand('vscode.open', uri), showMessage as any);
}

function getViewColumn(sideBySide = true): ViewColumn {
  const active = window.activeTextEditor;
  if (!active) {
    return ViewColumn.One;
  }

  if (!sideBySide) {
    return active.viewColumn;
  }

  switch (active.viewColumn) {
    case ViewColumn.One:
      return ViewColumn.Two;
    case ViewColumn.Two:
      return ViewColumn.Three;
    default:
      return active.viewColumn;
  }
}
