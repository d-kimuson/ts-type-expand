const { pathsToModuleNameMapper } = require("ts-jest/utils")

const { compilerOptions } = require("./tsconfig.json")

module.exports = {
  roots: ["<rootDir>"],
  testMatch: ["<rootDir>/src/test/jest/**/?(*.)+(spec|test).+(ts)"],
  globals: {
    "ts-jest": {
      tsconfig: "src/test/jest/tsconfig.json",
    },
  },
  preset: "ts-jest",
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>/src",
  }),
}
