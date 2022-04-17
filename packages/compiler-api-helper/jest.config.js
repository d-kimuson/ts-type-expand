const { pathsToModuleNameMapper } = require("ts-jest")
const {
  readConfigFile,
  parseJsonConfigFileContent,
  sys,
} = require("typescript")

const configFile = readConfigFile("./tsconfig.json", sys.readFile)
if (typeof configFile.error !== "undefined") {
  throw new Error(`Failed to load tsconfig: ${configFile.error}`)
}

const { options } = parseJsonConfigFileContent(
  configFile.config,
  {
    fileExists: sys.fileExists,
    readFile: sys.readFile,
    readDirectory: sys.readDirectory,
    useCaseSensitiveFileNames: true,
  },
  __dirname
)

module.exports = {
  roots: ["<rootDir>"],
  testMatch: ["**/tests/**/?(*.)+(spec|test).+(ts|tsx|js)"],
  testPathIgnorePatterns: ["<rootDir>/example/"],
  globals: {
    "ts-jest": {
      tsconfig: "tests/tsconfig.json",
    },
  },
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  moduleNameMapper: pathsToModuleNameMapper(options.paths, {
    prefix: "<rootDir>",
  }),
}
