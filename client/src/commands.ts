import {TextEditor, ExtensionContext, commands, window, QuickPickItem, Position, Range} from 'vscode';
import {LanguageClient} from 'vscode-languageclient';
import * as path from 'path';
import * as fs from 'fs';

import {showMessage} from './showMessage';
import {showUntitledWindow} from './showUntitledWindow';
import {requestApiaryClient, killCurrentApiaryClient} from './requestApiaryClient';

function selectApi(context: ExtensionContext) {
  return requestApiaryClient(context)
    .then(client => Promise.all([client.getApiList(), client]))
    .then(([res, client]) => {
      const elements = (<any>res).apis.map(element =>
        <QuickPickItem>{
          label: element.apiSubdomain,
          description: element.apiName,
          detail: element.apiDocumentationUrl
        });
      return Promise.all([window.showQuickPick(elements, {
        matchOnDescription: true,
        matchOnDetail: false,
        placeHolder: "Select your API"
      }), client]);
    });
}

export function parseOutput(context: ExtensionContext, client: LanguageClient, editor: TextEditor) {
  const statusBarDisposable = window.setStatusBarMessage('Parsing current document...');
  client.sendRequest({ method: 'parserOutput' }, editor.document.getText())
    .then(result => showUntitledWindow('parseResult.json', <string>result, context.extensionPath))
    .then(() => statusBarDisposable.dispose())
    .then(null, showMessage);
}

export function fetchApi(context: ExtensionContext) {
  return selectApi(context)
    .then(([selectedApi, client]) => {
      if (selectedApi === undefined) {
        throw 0;
      }

      return Promise.all([(<any>client).getApiCode((<any>selectedApi).label), (<any>selectedApi).label]);
    })
    .then(([res, apiName]): Thenable<any> => {
      if (window.activeTextEditor === undefined)
        return showUntitledWindow(`${apiName}.apib`, (<any>res).code, context.extensionPath)
      return window.activeTextEditor.edit((builder) => {
        const lastLine = window.activeTextEditor.document.lineCount;
        const lastChar = window.activeTextEditor.document.lineAt(lastLine - 1).range.end.character;
        builder.delete(new Range(0, 0, lastLine, lastChar));
        builder.replace(new Position(0, 0), (<any>res).code);
      });
    })
    .then(undefined, showMessage);

}

export function publishApi(context: ExtensionContext, textEditor: TextEditor) {
  selectApi(context)
    .then(([selectedApi, client]) => {
      return (<any>client).publishApi((<any>selectedApi).label, textEditor.document.getText(), '');
    })
    .then(() => window.showInformationMessage('API successuflly published on Apiary!'))
    .then(undefined, showMessage);
}

export function logout(context: ExtensionContext) {
  const tokenFilePath = path.join(context.extensionPath, '.apiaryToken');
  if (fs.existsSync(path.join(context.extensionPath, '.apiaryToken'))) {
    fs.unlinkSync(tokenFilePath);
    killCurrentApiaryClient();
  }
}
