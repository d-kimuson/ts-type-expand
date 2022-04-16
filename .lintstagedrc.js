// @ts-check

/**
 * @param {string[]} relPaths
 * @param {string} packageName
 */
function parsePackagePaths(relPaths, packageName) {
  return relPaths
    .map((file) => file.replace(`packages/${packageName}/`, "./"))
    .join(" ")
}

module.exports = {
  /**
   * @param {string[]} relPaths
   * @returns {string[]}
   */
  "packages/ts-type-expand/*.ts": (relPaths) => {
    return [
      `yarn --cwd 'packages/ts-type-expand' eslint --fix ${parsePackagePaths(
        relPaths,
        "ts-type-expand"
      )}`,
    ]
  },
  /**
   * @param {string[]} relPaths
   * @returns {string[]}
   */
  "packages/example/*.ts": (relPaths) => {
    return [
      `yarn --cwd 'packages/example' eslint --fix ${parsePackagePaths(
        relPaths,
        "example"
      )}`,
    ]
  },
  "*.{js,json,md}": ["yarn prettier --write"],
}
