// @ts-check

/** @type {import("syncpack").RcFile} */
const config = {
  filter: ".",
  indent: "  ",
  semverGroups: [],
  semverRange: "",
  sortAz: [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "resolutions",
    "keywords",
  ],
  sortFirst: [
    "name",
    "description",
    "private",
    "version",
    "author",
    "main",
    "exports",
    "packageManager",
    "config",
    "scripts",
    "dependencies",
    "devDependencies",
    "engines",
  ],
  source: [],
  versionGroups: [],
}

module.exports = config
