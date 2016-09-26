import {SymbolKind} from 'vscode-languageserver';

export interface Settings {
  apiElements: ApiElementsSettings;
};

export interface ApiElementsSettings {
  parser: ParserSettings;
  validation: ValidationSettings;
};

export interface ParserSettings {
  exportSourcemap: boolean;
  json: boolean;
  requireBlueprintName: boolean;
  type: string;
};

export interface ValidationSettings {
  debounce: number
};

export interface RefractSymbolMap {
  symbolKind: SymbolKind,
  query: any,
};
