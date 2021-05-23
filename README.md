# ts-type-expand for VSCode

VSCode extension that allows you to expand TypeScript type definitions.

Install from [ts-type-expand - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=kimuson.ts-type-expand) !

## Support Statement

|    Statements    | Support |
| :--------------: | :-----: |
|    TypeAlias     |    △    |
|    Interface     |    ✓    |
|     Function     |    ✓    |
|  Allow Function  |    ✓    |
|      Object      |    ✓    |
| Object Property  |    ✓    |
| Index Signatures |    ☓    |
|      Class       |    ✓    |
|   Class Method   |    ✓    |
|  Class Property  |    ✓    |
|     Variable     |    ✓    |
|      Import      |    ✓    |
|  TypeReference   |    ✓    |

## Support Types

|                Types                | Support |
| :---------------------------------: | :-----: |
| Baisc Types(string, number, ...etc) |    ✓    |
|                Array                |    △    |
|             Union Type              |    ✓    |
|          Intersection Type          |    ✓    |
|              Function               |    △    |
|              Generics               |    ✓    |
|           Keyof `<Type>`            |    ✓    |
|           Typeof `<Type>`           |    ✓    |
|        Indexed Access Types         |    ✓    |
|          Conditional Types          |    ✓    |
|            Mapped Types             |    ✓    |
|       Template Literal Types        |    ✓    |

## Configure

|              key              |          value           |
| :---------------------------: | :----------------------: |
| `ts-type-expand.tsconfigPath` | Path for `tsconfig.json` |

## Start dev

```bash
$ yarn watch
# Launch `Run Extension`
```
