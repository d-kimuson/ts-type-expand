export type ExtensionOption = {
  compactOptionalType: boolean;
  compactPropertyLength: number;
  directExpandArray: boolean;
  port: number;
  validate: (
    | "typescript"
    | "typescriptreact"
    | "javascript"
    | "javascriptreact"
    | (string & {})
  )[];
};
