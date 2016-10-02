import {window} from 'vscode';

export function showMessage(err) {
  if (typeof err === 'number') {
    return;
  }

  const message = err.message || err;

  if (err.type === 'info') {
    return window.showInformationMessage(message);
  } else if (err.type === 'warn') {
    return window.showWarningMessage(message);
  }

  return window.showErrorMessage(message);
}
