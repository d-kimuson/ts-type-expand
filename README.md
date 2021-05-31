# ts-type-expand for VSCode

VSCode extension that allows you to expand TypeScript type definitions.

- Displays the type information of the selected node
- This is especially useful for hard-to-read types, such as those automatically generated from GraphQL schemas.

![](https://user-images.githubusercontent.com/37296661/119652128-b18edd80-be60-11eb-87b7-aca155ac1210.gif)

## Installation

You can install this extension from the [ts-type-expand - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=kimuson.ts-type-expand)!

There is nothing additional that needs to be installed.

If `tsconfig.json` is not directly under your workspace, specify the path with the `ts-type-expand.tsconfigPath` option. See [Configure](#Configure) for other valid options.

## Supports

### Expansion

The following types can be expanded

- Properties
- Candidate types for union type
- Arguments and return values of functions or methods

It is not possible to expand `User` from an array type such as `User[]` (we hope to support this in the future).

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
|   Enum Declaration    |    ☓    |
|    Enum statement     |    ☓    |

### Types

Types are calculated by the [CompilerAPI](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API), so all types supported by TypeScript are supported in this extension.

### Others

- Vue is not supported (not tried)
- React also works, but there can be problems with component types

## Configure

Configure `ts-type-expand.*` to your vscode config to customize.

| key                     | value                                                                                                   | default       |
| :---------------------- | :------------------------------------------------------------------------------------------------------ | ------------- |
| `tsconfigPath`          | Path for `tsconfig.json`                                                                                | tsconfig.json |
| `compactOptionalType`   | display `T?` for type T \| undefined                                                                    | true          |
| `compactPropertyLength` | Omit when the type can be expanded and the number of characters of the type is longer than this length. | 10            |
| `directExpandArray`     | Directly expand T for Array\<T\>                                                                        | true          |

## License

MIT
