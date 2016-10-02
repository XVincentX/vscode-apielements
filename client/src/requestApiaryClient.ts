import * as fs from 'fs';
import * as path from 'path';
import {ExtensionContext, Uri, commands, window} from 'vscode';

import {ApiaryClient} from './apiaryClient';
import {showMessage} from './showMessage';

class TypedError extends Error {
  constructor(public message: string, public type: string) {
    super(message);
  }
}

let apiaryClient = undefined;

export function requestApiaryClient(context: ExtensionContext): Thenable<ApiaryClient> {

  const tokenFilePath = path.join(context.extensionPath, '.apiaryToken');

  if (apiaryClient === undefined) {

    if (process.env.APIARY_API_KEY !== undefined) {
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
      ;
    }

    return window.showWarningMessage(
      'Unable to find an Apiary Token. It\'s required to operate with Apiary',
      'Grab one!',
      'Paste one!'
    )
      .then(result => {
        if (result === 'Grab one!') {
          return commands.executeCommand('vscode.open', Uri.parse('https://login.apiary.io/tokens'));
        } else if (result === 'Paste one!') {
          return;
        }

        throw 0;
      })
      .then(() => window.showInputBox({ password: true, placeHolder: 'Paste Apiary token here' }))
      .then(token => {
        if (token === undefined) {
          throw new TypedError('No Apiary token provided', 'info');
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

export function killCurrentApiaryClient() {
  apiaryClient = undefined;
}
