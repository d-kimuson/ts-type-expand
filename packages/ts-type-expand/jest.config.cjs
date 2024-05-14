const { pathsToModuleNameMapper } = require('ts-jest')
const {
  readConfigFile,
  parseJsonConfigFileContent,
  sys,
} = require('typescript')

const configFile = readConfigFile('./tsconfig.json', sys.readFile)
if (typeof configFile.error !== 'undefined') {
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
  __dirname,
)

module.exports = {
  roots: ['<rootDir>'],
  testMatch: ['<rootDir>/src/test/jest/**/?(*.)+(spec|test).+(ts)'],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json',
    },
  },
  preset: 'ts-jest',
  moduleNameMapper: pathsToModuleNameMapper(options.paths, {
    prefix: '<rootDir>',
  }),
}
