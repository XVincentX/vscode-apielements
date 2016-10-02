export interface Settings {
  apiElements: ApiElementsSettings;
};

export interface ApiElementsSettings {
  parser: ParserSettings;
  validation: ValidationSettings;
  symbols: SymbolsSettings;
};

export interface ParserSettings {
  exportSourcemap: boolean;
  json: boolean;
  requireBlueprintName: boolean;
  type: string;
};

export interface ValidationSettings {
  debounce: number;
};

export interface SymbolsSettings {
  api: boolean;
  resourceGroup: boolean;
  resource: boolean;
  transition: boolean;
}
