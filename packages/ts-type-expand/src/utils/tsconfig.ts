import { readConfigFile, parseJsonConfigFileContent, sys } from 'typescript'
import type { ParsedCommandLine } from 'typescript'

export function loadTsConfig(
  filePath: string,
  basePath: string,
): ParsedCommandLine {
  const configFile = readConfigFile(filePath, sys.readFile)
  if (typeof configFile.error !== 'undefined') {
    throw new Error(
      `Failed to load tsconfig (${filePath}): ${configFile.error}`,
    )
  }

  return parseJsonConfigFileContent(
    configFile.config,
    {
      fileExists: sys.fileExists,
      readFile: sys.readFile,
      readDirectory: sys.readDirectory,
      useCaseSensitiveFileNames: true,
    },
    basePath,
  )
}
