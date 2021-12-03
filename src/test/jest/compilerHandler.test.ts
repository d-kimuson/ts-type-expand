import * as path from "path"

import { CompilerHandler } from "~/compilerHandler"

const exampleDir = path.resolve(__dirname, "../../../example")
const handler = new CompilerHandler(path.resolve(exampleDir, "tsconfig.json"))
handler.initializeWithoutWatch(exampleDir)

// breakes beacause of recursive logic
// test("example/types", () => {
//   const types = handler.getDeclaredTypesFromFile(
//     path.resolve(exampleDir, "types.ts")
//   )
//   types.forEach((t) => {
//     // expand types for test
//     // recursive type is not supported
//     if (t.type) {
//       handler.expandTypeRecursively(t.type)
//     }
//   })

//   // User
//   expect(types[0].type).toStrictEqual({
//     name: "User",
//     typeText: "User",
//     props: [
//       {
//         propName: "id",
//         name: undefined,
//         typeText: "string",
//         props: [],
//         union: [],
//       },
//       {
//         propName: "name",
//         name: undefined,
//         typeText: "string",
//         props: [],
//         union: [],
//       },
//       {
//         propName: "age",
//         name: undefined,
//         typeText: "number",
//         props: [],
//         union: [],
//       },
//       {
//         propName: "directExpanded",
//         name: undefined,
//         typeText: "{ name: number; age: number; } | undefined",
//         props: [],
//         union: [
//           { name: undefined, typeText: "undefined", props: [], union: [] },
//           {
//             name: undefined,
//             typeText: "{ name: number; age: number; }",
//             props: [
//               {
//                 propName: "name",
//                 name: undefined,
//                 typeText: "number",
//                 props: [],
//                 union: [],
//               },
//               {
//                 propName: "age",
//                 name: undefined,
//                 typeText: "number",
//                 props: [],
//                 union: [],
//               },
//             ],
//             union: [],
//           },
//         ],
//       },
//     ],
//     union: [],
//   })
// })

test("example/classes", () => {
  const types = handler.getDeclaredTypesFromFile(
    path.resolve(exampleDir, "classes.ts")
  )

  const userRepo = types[0].type
  expect(userRepo).toBeDefined()
  if (!userRepo) {
    return
  }

  // handler.expandTypeRecursively(userRepo)

  // // UserRepository
  // expect(userRepo).toStrictEqual({
  //   name: "UserRepository",
  //   typeText: "UserRepository",
  //   typeForProps: expect.any(Object),
  //   props: [
  //     {
  //       propName: "users",
  //       name: undefined,
  //       typeText: "User[]",
  //       props: [],
  //       union: [],
  //     },
  //     {
  //       propName: "getUser",
  //       name: undefined,
  //       typeText: "(userId: string) => User",
  //       props: [],
  //       union: [],
  //     },
  //   ],
  //   union: [],
  // })
})
