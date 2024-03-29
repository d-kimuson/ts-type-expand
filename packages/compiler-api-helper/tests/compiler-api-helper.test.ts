import { resolve } from "path"
import type { TypeObject } from "dist/src"
import { CompilerApiHelper } from "~/compiler-api-helper"
import { isOk } from "~/util"
import { createProgram } from "./helpers/program"

const absolutePath = (path: string) =>
  resolve(__dirname, "./test-project", path)

const program = createProgram(absolutePath("./tsconfig.json"))
const helper = new CompilerApiHelper(program)

describe("convertType", () => {
  it("primitive", () => {
    const typesResult = helper.extractTypes(
      absolutePath("./types/primitive.ts")
    )
    expect(isOk(typesResult)).toBe(true)
    if (!isOk(typesResult)) {
      return
    }

    const types = typesResult.ok
    expect(types.length).toStrictEqual(2)

    expect(types[0]?.type).toStrictEqual({
      __type: "PrimitiveTO",
      kind: "string",
    })

    expect(types[1]?.type).toStrictEqual({
      __type: "PrimitiveTO",
      kind: "number",
    })
  })

  it("special", () => {
    const typesResult = helper.extractTypes(absolutePath("./types/special.ts"))
    expect(isOk(typesResult)).toBe(true)
    if (!isOk(typesResult)) {
      return
    }

    const types = typesResult.ok
    expect(types.length).toStrictEqual(2)

    expect(types[0]?.type).toStrictEqual({
      __type: "SpecialTO",
      kind: "undefined",
    })

    expect(types[1]?.type).toStrictEqual({
      __type: "SpecialTO",
      kind: "null",
    })
  })

  it("literal", () => {
    const typesResult = helper.extractTypes(absolutePath("./types/literal.ts"))
    expect(isOk(typesResult)).toBe(true)
    if (!isOk(typesResult)) {
      return
    }

    const types = typesResult.ok
    expect(types.length).toStrictEqual(3)

    expect(types[0]?.type).toStrictEqual({
      __type: "LiteralTO",
      value: "hello",
    })

    expect(types[1]?.type).toStrictEqual({
      __type: "LiteralTO",
      value: 20,
    })

    expect(types[2]?.type).toStrictEqual({
      __type: "LiteralTO",
      value: true,
    })
  })

  it("union", () => {
    const typesResult = helper.extractTypes(absolutePath("./types/union.ts"))
    expect(isOk(typesResult)).toBe(true)
    if (!isOk(typesResult)) {
      return
    }

    const types = typesResult.ok
    const [type0, type1] = types
    expect(type0).toBeDefined()
    expect(type1).not.toBeDefined()
    if (!type0) {return}

    expect(type0.type).toStrictEqual({
      __type: "UnionTO",
      typeName: "StrOrNumber",
      unions: [
        {
          __type: "PrimitiveTO",
          kind: "string",
        },
        {
          __type: "PrimitiveTO",
          kind: "number",
        },
      ],
    })
  })

  it("enum", () => {
    const typesResult = helper.extractTypes(absolutePath("./types/enum.ts"))
    expect(isOk(typesResult)).toBe(true)
    if (!isOk(typesResult)) {
      return
    }

    const types = typesResult.ok
    const [type0, type1, type2] = types
    expect(type0).toBeDefined()
    expect(type1).toBeDefined()
    expect(type2).not.toBeDefined()
    if (!type0 || !type1) {return}

    expect(type0.type).toStrictEqual({
      __type: "EnumTO",
      typeName: "BasicEnum",
      enums: [
        {
          name: "Red",
          type: {
            __type: "LiteralTO",
            value: 0,
          },
        },
        {
          name: "Blue",
          type: {
            __type: "LiteralTO",
            value: 1,
          },
        },
        {
          name: "Green",
          type: {
            __type: "LiteralTO",
            value: 2,
          },
        },
      ],
    })

    expect(type1.type).toStrictEqual({
      __type: "EnumTO",
      typeName: "EnumWithValue",
      enums: [
        {
          name: "Red",
          type: {
            __type: "LiteralTO",
            value: "red",
          },
        },
        {
          name: "Blue",
          type: {
            __type: "LiteralTO",
            value: "blue",
          },
        },
        {
          name: "Green",
          type: {
            __type: "LiteralTO",
            value: "green",
          },
        },
      ],
    })
  })

  it("array", () => {
    const typesResult = helper.extractTypes(absolutePath("./types/array.ts"))
    expect(isOk(typesResult)).toBe(true)
    if (isOk(typesResult)) {
      const types = typesResult.ok
      expect(types.length).toStrictEqual(3)

      expect(types[0]?.type).toStrictEqual({
        __type: "ArrayTO",
        typeName: "ArrStr",
        child: {
          __type: "PrimitiveTO",
          kind: "string",
        },
      })

      expect(types[1]?.type).toStrictEqual({
        __type: "ArrayTO",
        typeName: "ArrStr2",
        child: {
          __type: "PrimitiveTO",
          kind: "string",
        },
      })

      // array in property
      const arrInProp = types[2]?.type
      expect(arrInProp?.__type).toBe("ObjectTO")
      if (arrInProp?.__type !== "ObjectTO") {return}
      expect(helper.getObjectProps(arrInProp.storeKey)[0]).toStrictEqual({
        propName: "arr",
        type: {
          __type: "ArrayTO",
          typeName: "string[]",
          child: {
            __type: "PrimitiveTO",
            kind: "string",
          },
        },
      })
    }
  })

  it("object", () => {
    const typesResult = helper.extractTypes(absolutePath("./types/object.ts"))
    expect(isOk(typesResult)).toBe(true)
    if (!isOk(typesResult)) {
      return
    }

    const types = typesResult.ok
    expect(types.length).toStrictEqual(2)

    const [type1, type2] = types
    if (type1 === undefined || type2 === undefined) {
      throw new TypeError("Unexpected undefined")
    }

    expect(type1.type.__type).toStrictEqual("ObjectTO")
    if (type1.type.__type !== "ObjectTO") {
      return
    }
    expect(helper.getObjectProps(type1.type.storeKey)).toStrictEqual([
      {
        propName: "name",
        type: {
          __type: "PrimitiveTO",
          kind: "string",
        },
      },
      {
        propName: "names",
        type: {
          __type: "ArrayTO",
          typeName: "string[]",
          child: {
            __type: "PrimitiveTO",
            kind: "string",
          },
        },
      },
      {
        propName: "maybeName",
        type: {
          __type: "UnionTO",
          typeName: "string | undefined",
          unions: [
            {
              __type: "SpecialTO",
              kind: "undefined",
            },
            {
              __type: "PrimitiveTO",
              kind: "string",
            },
          ],
        },
      },
      {
        propName: "time",
        type: {
          __type: "SpecialTO",
          kind: "Date",
        },
      },
    ])

    if (type2.type.__type !== "ObjectTO")
      {throw new TypeError("expected ObjectTO")}
    const propsOneRecursive = helper.getObjectProps(type2.type.storeKey)
    expect(propsOneRecursive[0]).toStrictEqual({
      propName: "name",
      type: {
        __type: "PrimitiveTO",
        kind: "string",
      },
    })
    const recursiveProp = propsOneRecursive[1]?.type
    if (recursiveProp === undefined) {throw new TypeError("Unexpected undefined")}
    if (recursiveProp.__type !== "ObjectTO") {
      throw new Error("Error")
    }
    //   throw new TypeError("expected ObjectTO")
    expect(helper.getObjectProps(recursiveProp.storeKey)[0]).toStrictEqual({
      propName: "name",
      type: {
        __type: "PrimitiveTO",
        kind: "string",
      },
    })
  })

  it("generics", () => {
    const typesResult = helper.extractTypes(absolutePath("./types/generics.ts"))
    expect(isOk(typesResult)).toBe(true)
    if (isOk(typesResult)) {
      const [type_0, type_1] = typesResult.ok
      expect(type_0).toBeDefined()
      expect(type_1).not.toBeDefined()
      if (!type_0) {return}

      expect(type_0.typeName).toBe("ResultOfGenerics")
      expect(type_0.type.__type).toBe("ObjectTO")

      if (type_0.type.__type !== "ObjectTO") {
        return
      }

      expect(helper.getObjectProps(type_0.type.storeKey)).toStrictEqual([
        {
          propName: "id",
          type: {
            __type: "UnionTO",
            typeName: "number | undefined",
            unions: [
              {
                __type: "SpecialTO",
                kind: "undefined",
              },
              {
                __type: "PrimitiveTO",
                kind: "number",
              },
            ],
          },
        },
        {
          propName: "time",
          type: {
            __type: "UnionTO",
            typeName: "Date | undefined",
            unions: [
              {
                __type: "SpecialTO",
                kind: "undefined",
              },
              {
                __type: "SpecialTO",
                kind: "Date",
              },
            ],
          },
        },
      ])
    }
  })

  it("complex types", () => {
    const typesResult = helper.extractTypes(absolutePath("./types/complex.ts"))
    expect(isOk(typesResult)).toBe(true)
    if (!isOk(typesResult)) {
      return
    }

    const types = typesResult.ok
    const [type0, type1] = types
    expect(type0).toBeDefined()
    if (typeof type0 === "undefined") {return}

    expect(type0.type.__type).toBe("ObjectTO")
    if (type0.type.__type !== "ObjectTO") {return}

    expect(helper.getObjectProps(type0.type.storeKey)).toStrictEqual([
      {
        propName: "name",
        type: {
          __type: "UnionTO",
          typeName: "string | undefined",
          unions: [
            {
              __type: "SpecialTO",
              kind: "undefined",
            },
            {
              __type: "PrimitiveTO",
              kind: "string",
            },
          ],
        },
      },
      {
        propName: "password",
        type: {
          __type: "UnionTO",
          typeName: "string | undefined",
          unions: [
            {
              __type: "SpecialTO",
              kind: "undefined",
            },
            {
              __type: "PrimitiveTO",
              kind: "string",
            },
          ],
        },
      },
    ])

    // intersection
    expect(type1).toBeDefined()
    expect(type1?.type.__type).toBe("ObjectTO")
    if (!type1 || type1.type.__type !== "ObjectTO") {return}
    expect(helper.getObjectProps(type1.type.storeKey)).toStrictEqual([
      {
        propName: "hoge",
        type: {
          __type: "PrimitiveTO",
          kind: "string",
        },
      },
      {
        propName: "foo",
        type: {
          __type: "PrimitiveTO",
          kind: "string",
        },
      },
    ])
  })

  it("object", () => {
    const typesResult = helper.extractTypes(
      absolutePath("./types/re-export/index.ts")
    )
    expect(isOk(typesResult)).toBe(true)
    if (!isOk(typesResult)) {
      return
    }

    const types = typesResult.ok

    const [type0, type1] = types
    expect(type0).toBeDefined()
    expect(type1).not.toBeDefined()

    expect(type0?.type.__type).toStrictEqual("ObjectTO")
    if (type0?.type.__type !== "ObjectTO") {
      return
    }
    expect(helper.getObjectProps(type0.type.storeKey)).toStrictEqual([
      {
        propName: "name",
        type: {
          __type: "PrimitiveTO",
          kind: "string",
        },
      },
    ])
  })

  it("function", () => {
    const typesResult = helper.extractTypes(absolutePath("./types/function.ts"))
    expect(isOk(typesResult)).toBe(true)
    if (!isOk(typesResult)) {
      return
    }

    const [type0, type1, type2] = typesResult.ok
    expect(type0).toBeDefined()

    expect(type0?.type).toStrictEqual({
      __type: "CallableTO",
      argTypes: [
        {
          name: "arg",
          type: {
            __type: "PrimitiveTO",
            kind: "string",
          },
        },
      ],
      returnType: {
        __type: "PrimitiveTO",
        kind: "number",
      },
    })

    expect(type1?.type.__type).toBe("ObjectTO")
    const typeObj = type1?.type
    if (!typeObj || typeObj.__type !== "ObjectTO") {return}

    expect(helper.getObjectProps(typeObj.storeKey)).toStrictEqual([
      {
        propName: "method",
        type: {
          __type: "CallableTO",
          argTypes: [
            {
              name: "arg",
              type: {
                __type: "PrimitiveTO",
                kind: "string",
              },
            },
          ],
          returnType: {
            __type: "PrimitiveTO",
            kind: "number",
          },
        },
      },
    ])

    expect(type2).not.toBeDefined()
  })

  it("promise", () => {
    const typesResult = helper.extractTypes(absolutePath("./types/promise.ts"))
    expect(isOk(typesResult)).toBe(true)
    if (!isOk(typesResult)) {
      return
    }

    const types = typesResult.ok

    const [type0, type1] = types
    expect(type0).toBeDefined()
    expect(type0?.type.__type).toBe("PromiseTO")
    if (!type0 || type0.type.__type !== "PromiseTO") {return}

    const childType = type0.type.child
    expect(childType.__type).toBe("ObjectTO")
    if (childType.__type !== "ObjectTO") {return}
    expect(helper.getObjectProps(childType.storeKey)).toStrictEqual([
      {
        propName: "name",
        type: {
          __type: "PrimitiveTO",
          kind: "string",
        },
      },
    ])

    expect(type1).not.toBeDefined()
  })

  it("promise-like", () => {
    const typesResult = helper.extractTypes(
      absolutePath("./types/promise-like.ts")
    )
    expect(isOk(typesResult)).toBe(true)
    if (!isOk(typesResult)) {
      return
    }

    const types = typesResult.ok

    const [type0, type1] = types
    expect(type0).toBeDefined()
    expect(type0?.type.__type).toBe("PromiseLikeTO")
    if (!type0 || type0.type.__type !== "PromiseLikeTO") {return}

    const childType = type0.type.child
    expect(childType.__type).toBe("ObjectTO")
    if (childType.__type !== "ObjectTO") {return}
    expect(helper.getObjectProps(childType.storeKey)).toStrictEqual([
      {
        propName: "name",
        type: {
          __type: "PrimitiveTO",
          kind: "string",
        },
      },
    ])

    expect(type1).not.toBeDefined()
  })

  it("symbol", () => {
    const typesResult = helper.extractTypes(absolutePath("./types/symbol.ts"))
    expect(isOk(typesResult)).toBe(true)
    if (!isOk(typesResult)) {
      return
    }

    const types = typesResult.ok

    const [type0, type1] = types
    expect(type1).toBeDefined()

    expect(type0?.type.__type).toBe("SpecialTO")
    if (!type0 || type0.type.__type !== "SpecialTO") {return}
    expect(type0.type.kind).toBe("unique symbol")

    expect(type1?.type.__type).toBe("SpecialTO")
    if (!type1 || type1.type.__type !== "SpecialTO") {return}
    expect(type1.type.kind).toBe("Symbol")
  })

  it("variable", () => {
    const typesResult = helper.extractTypes(absolutePath("./types/variable.ts"))
    if (!isOk(typesResult))
      {throw new TypeError(`TypeResult is ng, reason: ${typesResult.ng.reason}`)}

    const [var0] = typesResult.ok
    if (var0 === undefined)
      {throw new TypeError(`var0 is unexpectedly undefined`)}

    expect<{ typeName: string | undefined; type: TypeObject }>(
      var0
    ).toStrictEqual({
      typeName: "asyncFunc",
      type: {
        __type: "CallableTO",
        argTypes: [],
        returnType: {
          __type: "PromiseTO",
          child: {
            __type: "SpecialTO",
            kind: "void",
          },
        },
      },
    })
  })
})
