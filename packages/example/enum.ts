export enum OS {
  winsows,
  mac,
  ubuntu,
}

export const myOs = OS.mac

type ILogger = {
  [K in 'info' | 'warn']: (
    kind: string,
    obj: Record<string, unknown>,
    message?: string
  ) => void
}
