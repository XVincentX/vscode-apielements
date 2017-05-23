import * as fs from 'fs';
import * as path from 'path';
import { Position, Uri, ViewColumn, WorkspaceEdit, window, workspace } from 'vscode';

export function showUntitledWindow(fileName: string, content: string, fallbackPath: string, viewColumn : ViewColumn) {
  const filePath = path.join(workspace.rootPath || fallbackPath, fileName);
  const uri = Uri.parse(`untitled:${filePath}`);

  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    fs.unlinkSync(filePath);
  } catch (err) {
  }

  return workspace.openTextDocument(uri)
    .then((textDocument) => {
      const edit = new WorkspaceEdit();
      edit.insert(uri as Uri, new Position(0, 0), content);
      return Promise.all([textDocument as any, workspace.applyEdit(edit)]);
    })
    .then(([textDocument]) => {
      return window.showTextDocument(textDocument as any, viewColumn, false);
    });
}
