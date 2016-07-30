import {workspace, Uri, window, Position, ViewColumn, WorkspaceEdit} from 'vscode';
import * as path from 'path';

export function showUntitledWindow(fileName: string, content: string, fallbackPath: string) {
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
