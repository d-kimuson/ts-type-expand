const { pathsToModuleNameMapper } = require("ts-jest/utils")

const { compilerOptions } = require("./tsconfig.json")

module.exports = {
  roots: ["<rootDir>"],
  testMatch: ["<rootDir>/tests/**/?(*.)+(spec|test).+(ts)"],
  globals: {
    "ts-jest": {
      tsconfig: "tests/tsconfig.json",
    },
  },
  preset: "ts-jest",
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>/src",
  }),
}
