# ts-type-expand for VSCode

VSCode extension that allows you to expand TypeScript type definitions.

- Displays the type information of the selected node
- This is especially useful for hard-to-read types, such as those automatically generated from GraphQL schemas, ...etc.

![](https://user-images.githubusercontent.com/37296661/119652128-b18edd80-be60-11eb-87b7-aca155ac1210.gif)

## Installation

You can install this extension from the [ts-type-expand - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=kimuson.ts-type-expand)!

There is nothing additional that needs to be installed.

## Features

### Expansion

The following types can be expanded

- Properties
- Array (`T` for `Array<T>`)
- Candidate types for union type
- Arguments and return values of functions or methods

### Selection

The following are the destination nodes that support type expansion. More nodes will be added in the future.

|      Statements       | Support |
| :-------------------: | :-----: |
| TypeAlias declaration |    ✓    |
| Interface declaration |    ✓    |
| Varibale declaration  |    ✓    |
|  Varibale statement   |    ✓    |
|   Class declaration   |    ✓    |
| Function declaration  |    ✓    |
|     Function call     |    ✓    |
|   Function argument   |    ✓    |
|  Method declaration   |    ✓    |
|   Enum Declaration    |    ✓    |
|    Enum statement     |    ✓    |

### \[Experimental\] Copy type information

We have added a feature that allows you to copy type information as a type alias when you press the COPY button on an expanded type!

This feature is experimental. If you have any feedback, I welcome it through an [Issues](https://github.com/d-kimuson/ts-type-expand/issues).

## Supports

### Types

Types are calculated by the [CompilerAPI](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API), so all types supported by TypeScript are supported in this extension.

### Platforms

This extension supports Node.js environments, specifically versions v18 and v20. For TypeScript, versions 4.9 through 5.4 are supported. While other versions might work, some features could be unstable or broken.

Outside of Node, the extension is compatible with [bun](https://bun.sh/) but not with [deno](https://deno.com/). This is because deno does not support the required language service plugin. Therefore, we have no plans to support deno in the future.

### Others

- React and Vue (SFC) is supported.
- for using Vue, Hybrid Mode is required.
  - Install [Vue.volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) extension above 2.0.16.
  - Enable the Hybrid Mode. (from UI or set `"vue.server.hybridMode": true` in .vscode/settings.json)

## Configure

Configure `ts-type-expand.*` to your vscode config to customize.

| key                     | value                                                                                                   | default                                                              |
| :---------------------- | :------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `compactOptionalType`   | display `T?` for type `T \| undefined`                                                                  | `true`                                                               |
| `compactPropertyLength` | Omit when the type can be expanded and the number of characters of the type is longer than this length. | `10`                                                                 |
| `directExpandArray`     | Directly expand T for `Array<T>`                                                                        | `true`                                                               |
| `validate`              | Validate by specifying languageId                                                                       | `["typescript", "typescriptreact", "javascript", "javascriptreact"]` |

In order for these settings to take effect, you need to run `ts-type-expand.restart` or reload the VSCode after making the changes.

## Commands

| command                  | effect                                     |
| :----------------------- | :----------------------------------------- |
| `ts-type-expand.restart` | Update configuration and restart extension |

## License

MIT

## Contribute

Welcome.
