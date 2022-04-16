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
  "*.{js,json,md}": ["yarn prettier --write"],
}
