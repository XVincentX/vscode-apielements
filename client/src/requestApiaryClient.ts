import {commands, window, ExtensionContext, Uri} from 'vscode';
import * as path from 'path';
import * as fs from 'fs';


import {ApiaryClient} from './apiaryClient';
import {showMessage} from './showMessage';

let apiaryClient = undefined;

export function requestApiaryClient(context: ExtensionContext): Thenable<ApiaryClient> {

  const tokenFilePath = path.join(context.extensionPath, ".apiaryToken");

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

export function killCurrentApiaryClient() {
  apiaryClient = undefined;
}
