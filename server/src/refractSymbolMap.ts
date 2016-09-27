import {SymbolKind} from 'vscode-languageserver';

export interface RefractSymbolMap {
  symbolKind: SymbolKind,
  query: any,
  friendlyName?: string
};
