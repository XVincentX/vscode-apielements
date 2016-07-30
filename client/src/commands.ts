import {TextEditor, ExtensionContext, commands, window, QuickPickItem} from 'vscode';
import {LanguageClient} from 'vscode-languageclient';
import * as path from 'path';
import * as fs from 'fs';

import {showMessage} from './showMessage';
import {showUntitledWindow} from './showUntitledWindow';
import {requestApiaryClient, killCurrentApiaryClient} from './requestApiaryClient';

export function parseOutput(context: ExtensionContext, client: LanguageClient, editor: TextEditor) {
  const statusBarDisposable = window.setStatusBarMessage('Parsing current document...');
  client.sendRequest({ method: 'parserOutput' }, editor.document.getText())
    .then(result => showUntitledWindow('parseResult.json', <string>result, context.extensionPath))
    .then(() => statusBarDisposable.dispose())
    .then(null, showMessage);
}

export function fetchApi(context: ExtensionContext) {
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
    })

    .then(([selectedApi, client]) => {
      if (selectedApi === undefined) {
        throw 0;
      }

      return Promise.all([(<any>client).getApiCode((<any>selectedApi).label), (<any>selectedApi).label]);
    })
    .then(([res, apiName]) => showUntitledWindow(`${apiName}.apib`, (<any>res).code, context.extensionPath))
    .then(undefined, showMessage);

}

export function publishApi(context: ExtensionContext, textEditor: TextEditor) {
  requestApiaryClient(context)
    .then(client =>
      Promise.all([client, window.showInputBox({
        value: 'Saving API Description Document from VSCode',
        placeHolder: 'Commit message for this change'
      })])
    )
    .then(([client, message]) => {
      // Try to infer the API Name from the file
      const filePath = (textEditor.document.fileName);
      const apiName = path.basename(filePath, path.extname(filePath));

      return Promise.all([client, filePath, apiName, message]);
    })
    .then(([client, filePath, apiName, message]) => (<any>client).publishApi(apiName, textEditor.document.getText(), message))
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
