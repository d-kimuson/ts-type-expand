const { pathsToModuleNameMapper } = require("ts-jest")

const { compilerOptions } = require("./tsconfig.json")

module.exports = {
  roots: ["<rootDir>"],
  testMatch: ["<rootDir>/src/test/jest/**/?(*.)+(spec|test).+(ts)"],
  globals: {
    "ts-jest": {
      tsconfig: "./tsconfig.test.json",
    },
  },
  preset: "ts-jest",
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>",
  }),
}
