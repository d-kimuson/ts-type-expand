# develop

## Build system

- Each package is built using tsup.
- All npm modules are bundled (to avoid requiring node_modules on the distribution side).
  - ts-type-expand-plugin is excluded since it’s referenced by convention, not directly, so bundling it would be pointless.
- Using `pnpm workspace`, but `vsce package` and `vsce publish` don't support it, so we do something slightly unconventional for release:
  - We copy the necessary files to extension-tmp directory and install only ts-type-expand-plugin before packaging.
  - We plan to stop doing this once vsce package provides better support.

## How to develop

```bash
$ pnpm i
$ corepack enable pnpm
$ pnpm dev # starting dev server
```

## How to debug

- To start the extension in development mode, use `Run Extension` in launch.json.
- The preLaunchTask runs `pnpm dev`, enabling hot reload. However, a reload is still needed to reflect changes in the extension.

## How to debug with installation

To test the extension before release, run the following script:

```bash
$ ./scripts/local-trial.sh
```

This script will generate the .vsix file in `extension-tmp/ts-type-expand-2.0.0.vsix` and install it locally as version 2.0.0. You can then run and verify the extension.
