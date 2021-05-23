import * as path from "path"

import { CompilerHandler } from "~/CompilerHandler"

const exampleDir = path.resolve(__dirname, "../../../example")
const handler = new CompilerHandler(path.resolve(exampleDir, "tsconfig.json"))
handler.initializeWithoutWatch(exampleDir)

test("example/types", () => {
  const types = handler.getDeclaredTypesFromFile(
    path.resolve(exampleDir, "types.ts")
  )

  // User
  expect(types[0].type).toStrictEqual({
    name: "User",
    typeText: "User",
    props: [
      {
        propName: "id",
        name: undefined,
        typeText: "string",
        props: [],
        union: [],
      },
      {
        propName: "name",
        name: undefined,
        typeText: "string",
        props: [],
        union: [],
      },
      {
        propName: "age",
        name: undefined,
        typeText: "number",
        props: [],
        union: [],
      },
      {
        propName: "directExpanded",
        name: undefined,
        typeText: "{ name: number; age: number; } | undefined",
        props: [],
        union: [
          { name: undefined, typeText: "undefined", props: [], union: [] },
          {
            name: undefined,
            typeText: "{ name: number; age: number; }",
            props: [
              {
                propName: "name",
                name: undefined,
                typeText: "number",
                props: [],
                union: [],
              },
              {
                propName: "age",
                name: undefined,
                typeText: "number",
                props: [],
                union: [],
              },
            ],
            union: [],
          },
        ],
      },
    ],
    union: [],
  })
})

test("example/classes", () => {
  const types = handler.getDeclaredTypesFromFile(
    path.resolve(exampleDir, "classes.ts")
  )

  // UserRepository
  expect(types[1].type).toStrictEqual({
    name: "UserRepository",
    typeText: "UserRepository",
    props: [
      {
        propName: "users",
        name: undefined,
        typeText: "User[]",
        props: [],
        union: [],
      },
      {
        propName: "getUser",
        name: undefined,
        typeText: "(userId: string) => User",
        props: [],
        union: [],
      },
    ],
    union: [],
  })
})
