# ts-type-expand for VSCode

:memo: ts-type-expand is now v1 and the mechanism behind it has changed. You can downgrade to v0.12 if you find it inconvenient.

VSCode extension that allows you to expand TypeScript type definitions.

- Displays the type information of the selected node
- This is especially useful for hard-to-read types, such as those automatically generated from GraphQL schemas.

![](https://user-images.githubusercontent.com/37296661/119652128-b18edd80-be60-11eb-87b7-aca155ac1210.gif)

## Installation

You can install this extension from the [ts-type-expand - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=kimuson.ts-type-expand)!

There is nothing additional that needs to be installed.

## Supports

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

### Types

Types are calculated by the [CompilerAPI](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API), so all types supported by TypeScript are supported in this extension.

### Others

- SFC for Vue is not supported
- React is supported.

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

### :memo:

For debugging purposes, it is recommended to put a symbolic link to the directory where the logs are written.

```bash
$ ln -s ~/.ts-type-expand/logs ./logs
```

To start the debugger in a plain environment, you must enable `Workbench > Experimental > Settings Profile`. This setting does not exist in the per-workspace settings, only in the user settings, and must be set individually by the developer.
