import { resolve } from "path"
import {
  sys,
  readConfigFile,
  parseJsonConfigFileContent,
  createProgram as baseCreateProgram,
} from "typescript"
import type * as ts from "typescript"

export const createProgram = (tsConfigPath: string): ts.Program => {
  const configFile = readConfigFile(tsConfigPath, sys.readFile)
  if (typeof configFile.error !== "undefined") {
    throw new Error(`Failed to load tsconfig: ${configFile.error}`)
  }

  const { options, fileNames } = parseJsonConfigFileContent(
    configFile.config,
    {
      fileExists: sys.fileExists,
      readFile: sys.readFile,
      readDirectory: sys.readDirectory,
      useCaseSensitiveFileNames: true,
    },
    resolve(tsConfigPath, "..")
  )

  return baseCreateProgram({
    rootNames: fileNames,
    options,
  })
}
