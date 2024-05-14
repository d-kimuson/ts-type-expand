export type ExtensionOption = {
  compactOptionalType: boolean
  compactPropertyLength: number
  directExpandArray: boolean
  port: number
  validate: (
    | 'typescript'
    | 'typescriptreact'
    | 'javascript'
    | 'javascriptreact'
    // eslint-disable-next-line @typescript-eslint/ban-types
    | (string & {})
  )[]
}
