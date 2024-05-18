import { resolve } from 'node:path'
import type { TypeObject } from '.'
import { CompilerApiHelper } from '~/compiler-api-helper'
import { isOk } from '~/util'
import { createProgram } from './test-helpers/program'
import { describe, it, expect } from 'vitest'

const absolutePath = (path: string) => resolve(__dirname, '../../example', path)

const program = createProgram(absolutePath('./tsconfig.json'))
const helper = new CompilerApiHelper(program)

describe('convertType', () => {
  describe('patterns', () => {
    describe('variable', () => {
      const getTypes = () => {
        const typesResult = helper.extractTypes(
          absolutePath('./src/patterns/variable.ts'),
        )
        if (!isOk(typesResult)) {
          throw new TypeError(
            `TypeResult is ng, reason: ${typesResult.ng.reason}`,
          )
        }

        const [literalValue, functionValue] = typesResult.ok
        if (literalValue === undefined || functionValue === undefined) {
          throw new TypeError(`unexpectedly file value`)
        }

        return { literalValue, functionValue }
      }

      it('value declaration for literal should be resolved.', () => {
        const { literalValue } = getTypes()

        expect<{ typeName: string | undefined; type: TypeObject }>(
          literalValue,
        ).toStrictEqual({
          type: {
            __type: 'LiteralTO',
            value: 'hello',
          },
          typeName: 'value',
        })
      })

      it('value declaration for function should be resolved.', () => {
        const { functionValue } = getTypes()

        expect<{ typeName: string | undefined; type: TypeObject }>(
          functionValue,
        ).toStrictEqual({
          typeName: 'asyncFunc',
          type: {
            __type: 'CallableTO',
            argTypes: [],
            returnType: {
              __type: 'PromiseTO',
              child: {
                __type: 'SpecialTO',
                kind: 'void',
              },
            },
          },
        })
      })
    })

    it('type which re-exports should be resolved.', () => {
      const typesResult = helper.extractTypes(
        absolutePath('./src/patterns/re-export/index.ts'),
      )
      if (!isOk(typesResult)) {
        throw new TypeError('Unexpected file')
      }

      const [reExportedValue] = typesResult.ok
      if (reExportedValue === undefined) {
        throw new TypeError('Unexpected file')
      }

      expect(reExportedValue.type.__type).toStrictEqual('ObjectTO')
      if (reExportedValue.type.__type !== 'ObjectTO') {
        return
      }

      expect(
        helper.getObjectProps(reExportedValue.type.storeKey),
      ).toStrictEqual([
        {
          propName: 'name',
          type: {
            __type: 'PrimitiveTO',
            kind: 'string',
          },
        },
      ])
    })
  })

  describe('types', () => {
    it('primitive type should be resolved.', () => {
      const typesResult = helper.extractTypes(
        absolutePath('./src/types/primitive.ts'),
      )
      expect(isOk(typesResult)).toBe(true)
      if (!isOk(typesResult)) {
        return
      }

      const types = typesResult.ok
      expect(types.length).toStrictEqual(2)

      expect(types[0]?.type).toStrictEqual({
        __type: 'PrimitiveTO',
        kind: 'string',
      })

      expect(types[1]?.type).toStrictEqual({
        __type: 'PrimitiveTO',
        kind: 'number',
      })
    })

    describe('special', () => {
      const getTypes = () => {
        const typesResult = helper.extractTypes(
          absolutePath('./src/types/special.ts'),
        )
        expect(isOk(typesResult)).toBe(true)
        if (!isOk(typesResult)) {
          throw new TypeError('Unexpected file')
        }

        const [undefinedType, nullType] = typesResult.ok
        if (undefinedType === undefined || nullType === undefined) {
          throw new TypeError('Unexpected file')
        }

        return {
          undefinedType,
          nullType,
        }
      }

      it('undefined should be resolved', () => {
        const { undefinedType } = getTypes()
        expect(undefinedType.type).toStrictEqual({
          __type: 'SpecialTO',
          kind: 'undefined',
        })
      })

      it('undefined should be resolved', () => {
        const { nullType } = getTypes()
        expect(nullType.type).toStrictEqual({
          __type: 'SpecialTO',
          kind: 'null',
        })
      })
    })

    it('literal type should be resolved.', () => {
      const typesResult = helper.extractTypes(
        absolutePath('./src/types/literal.ts'),
      )
      expect(isOk(typesResult)).toBe(true)
      if (!isOk(typesResult)) {
        return
      }

      const types = typesResult.ok
      expect(types.length).toStrictEqual(3)

      expect(types[0]?.type).toStrictEqual({
        __type: 'LiteralTO',
        value: 'hello',
      })

      expect(types[1]?.type).toStrictEqual({
        __type: 'LiteralTO',
        value: 20,
      })

      expect(types[2]?.type).toStrictEqual({
        __type: 'LiteralTO',
        value: true,
      })
    })

    it('union type should be resolved.', () => {
      const typesResult = helper.extractTypes(
        absolutePath('./src/types/union.ts'),
      )
      expect(isOk(typesResult)).toBe(true)
      if (!isOk(typesResult)) {
        return
      }

      const types = typesResult.ok
      const [type0, type1] = types
      expect(type0).toBeDefined()
      expect(type1).not.toBeDefined()
      if (!type0) {
        return
      }

      expect(type0.type).toStrictEqual({
        __type: 'UnionTO',
        typeName: 'StrOrNumber',
        unions: [
          {
            __type: 'PrimitiveTO',
            kind: 'string',
          },
          {
            __type: 'PrimitiveTO',
            kind: 'number',
          },
        ],
      })
    })

    describe('enum', () => {
      const getTypes = () => {
        const typesResult = helper.extractTypes(
          absolutePath('./src/types/enum.ts'),
        )
        expect(isOk(typesResult)).toBe(true)
        if (!isOk(typesResult)) {
          throw new TypeError('Unexpected file')
        }

        const types = typesResult.ok
        const [basicEnum, enumWithValue, valueOfEnum] = types
        if (
          basicEnum === undefined ||
          enumWithValue === undefined ||
          valueOfEnum === undefined
        ) {
          throw new TypeError('Unexpected file')
        }

        return {
          basicEnum,
          enumWithValue,
          valueOfEnum,
        }
      }

      it('basic enum should be resolved.', () => {
        const { basicEnum } = getTypes()
        expect(basicEnum.type).toStrictEqual({
          __type: 'EnumTO',
          typeName: 'BasicEnum',
          enums: [
            {
              name: 'Red',
              type: {
                __type: 'LiteralTO',
                value: 0,
              },
            },
            {
              name: 'Blue',
              type: {
                __type: 'LiteralTO',
                value: 1,
              },
            },
            {
              name: 'Green',
              type: {
                __type: 'LiteralTO',
                value: 2,
              },
            },
          ],
        })
      })

      it('enum with value should be resolved.', () => {
        const { enumWithValue } = getTypes()
        expect(enumWithValue.type).toStrictEqual({
          __type: 'EnumTO',
          typeName: 'EnumWithValue',
          enums: [
            {
              name: 'Red',
              type: {
                __type: 'LiteralTO',
                value: 'red',
              },
            },
            {
              name: 'Blue',
              type: {
                __type: 'LiteralTO',
                value: 'blue',
              },
            },
            {
              name: 'Green',
              type: {
                __type: 'LiteralTO',
                value: 'green',
              },
            },
          ],
        })
      })

      it('value of enum type should be resolved.', () => {
        const { valueOfEnum } = getTypes()
        expect(valueOfEnum.type).toStrictEqual({
          __type: 'LiteralTO',
          value: 0,
        })
      })
    })

    describe('array', () => {
      const getTypes = () => {
        const typesResult = helper.extractTypes(
          absolutePath('./src/types/array.ts'),
        )
        if (!isOk(typesResult)) {
          throw new TypeError('Unexpected file')
        }

        const [arrayLiteral, arrayGenerics, arrayInProp] = typesResult.ok
        if (
          arrayLiteral === undefined ||
          arrayGenerics === undefined ||
          arrayInProp === undefined
        ) {
          throw new TypeError('Unexpected file')
        }

        return {
          arrayLiteral,
          arrayGenerics,
          arrayInProp,
        }
      }

      it('array literal should be resolved.', () => {
        const { arrayLiteral } = getTypes()
        expect(arrayLiteral.type).toStrictEqual({
          __type: 'ArrayTO',
          typeName: 'ArrStr',
          child: {
            __type: 'PrimitiveTO',
            kind: 'string',
          },
        })
      })
      it('array generics should be resolved.', () => {
        const { arrayGenerics } = getTypes()
        expect(arrayGenerics.type).toStrictEqual({
          __type: 'ArrayTO',
          typeName: 'ArrStr2',
          child: {
            __type: 'PrimitiveTO',
            kind: 'string',
          },
        })
      })
      it('array in property should be resolved.', () => {
        const { arrayInProp } = getTypes()
        expect(arrayInProp.type.__type).toBe('ObjectTO')
        if (arrayInProp.type.__type !== 'ObjectTO') {
          return
        }

        expect(
          helper.getObjectProps(arrayInProp.type.storeKey)[0],
        ).toStrictEqual({
          propName: 'arr',
          type: {
            __type: 'ArrayTO',
            typeName: 'string[]',
            child: {
              __type: 'PrimitiveTO',
              kind: 'string',
            },
          },
        })
      })
    })

    describe('object', () => {
      const getTypes = () => {
        const typesResult = helper.extractTypes(
          absolutePath('./src/types/object.ts'),
        )

        if (!isOk(typesResult)) {
          throw new TypeError('Unexpected file')
        }

        const [obj, recursiveObj] = typesResult.ok
        if (obj === undefined || recursiveObj === undefined) {
          throw new TypeError('Unexpected file')
        }
        return { obj, recursiveObj }
      }

      it('object should be resolved.', () => {
        const { obj } = getTypes()
        expect(obj.type.__type).toStrictEqual('ObjectTO')
        if (obj.type.__type !== 'ObjectTO') {
          return
        }
        expect(helper.getObjectProps(obj.type.storeKey)).toStrictEqual([
          {
            propName: 'name',
            type: {
              __type: 'PrimitiveTO',
              kind: 'string',
            },
          },
          {
            propName: 'names',
            type: {
              __type: 'ArrayTO',
              typeName: 'string[]',
              child: {
                __type: 'PrimitiveTO',
                kind: 'string',
              },
            },
          },
          {
            propName: 'maybeName',
            type: {
              __type: 'UnionTO',
              typeName: 'string | undefined',
              unions: [
                {
                  __type: 'SpecialTO',
                  kind: 'undefined',
                },
                {
                  __type: 'PrimitiveTO',
                  kind: 'string',
                },
              ],
            },
          },
          {
            propName: 'time',
            type: {
              __type: 'SpecialTO',
              kind: 'Date',
            },
          },
        ])
      })

      it('recursive object should be resolved.', () => {
        const { recursiveObj } = getTypes()
        expect(recursiveObj.type.__type).toStrictEqual('ObjectTO')
        if (recursiveObj.type.__type !== 'ObjectTO') {
          return
        }

        const propsOneRecursive = helper.getObjectProps(
          recursiveObj.type.storeKey,
        )
        expect(propsOneRecursive[0]).toStrictEqual({
          propName: 'name',
          type: {
            __type: 'PrimitiveTO',
            kind: 'string',
          },
        })

        const recursiveProp = propsOneRecursive[1]?.type
        if (recursiveProp === undefined) {
          throw new TypeError('Unexpected undefined')
        }
        if (recursiveProp.__type !== 'ObjectTO') {
          throw new Error('Error')
        }
        expect(helper.getObjectProps(recursiveProp.storeKey)[0]).toStrictEqual({
          propName: 'name',
          type: {
            __type: 'PrimitiveTO',
            kind: 'string',
          },
        })
      })
    })

    describe('generics', () => {
      const getTypes = () => {
        const typesResult = helper.extractTypes(
          absolutePath('./src/types/generics.ts'),
        )

        if (!isOk(typesResult)) {
          throw new TypeError('Unexpected file')
        }

        const [resolvedGenerics] = typesResult.ok
        if (resolvedGenerics === undefined) {
          throw new TypeError('Unexpected file')
        }

        return {
          genericsWithDefault: undefined,
          genericsWithNoDefault: undefined,
          resolvedGenerics,
        }
      }

      it('generics with default type should be skipped.', () => {
        const { genericsWithDefault } = getTypes()
        expect(genericsWithDefault).toBeUndefined()
      })

      it('generics with no default type should be skipped.', () => {
        const { genericsWithNoDefault } = getTypes()
        expect(genericsWithNoDefault).toBeUndefined()
      })

      it('resolved generics should be resolved.', () => {
        const { resolvedGenerics } = getTypes()

        expect(resolvedGenerics.typeName).toBe('ResolvedGenerics')
        expect(resolvedGenerics.type.__type).toBe('ObjectTO')
        if (resolvedGenerics.type.__type !== 'ObjectTO') {
          return
        }
        expect(
          helper.getObjectProps(resolvedGenerics.type.storeKey),
        ).toStrictEqual([
          {
            propName: 'id',
            type: {
              __type: 'UnionTO',
              typeName: 'number | undefined',
              unions: [
                {
                  __type: 'SpecialTO',
                  kind: 'undefined',
                },
                {
                  __type: 'PrimitiveTO',
                  kind: 'number',
                },
              ],
            },
          },
          {
            propName: 'time',
            type: {
              __type: 'UnionTO',
              typeName: 'Date | undefined',
              unions: [
                {
                  __type: 'SpecialTO',
                  kind: 'undefined',
                },
                {
                  __type: 'SpecialTO',
                  kind: 'Date',
                },
              ],
            },
          },
        ])
      })
    })

    it('intersection type should be defined.', () => {
      const typesResult = helper.extractTypes(
        absolutePath('./src/types/intersection.ts'),
      )
      if (!isOk(typesResult)) {
        throw new TypeError('Unexpected file')
      }

      const [intersectionType] = typesResult.ok
      if (intersectionType === undefined) {
        throw new TypeError('Unexpected file')
      }

      // intersection
      expect(intersectionType).toBeDefined()
      expect(intersectionType.type.__type).toBe('ObjectTO')
      if (intersectionType.type.__type !== 'ObjectTO') {
        return
      }
      expect(
        helper.getObjectProps(intersectionType.type.storeKey),
      ).toStrictEqual([
        {
          propName: 'hoge',
          type: {
            __type: 'PrimitiveTO',
            kind: 'string',
          },
        },
        {
          propName: 'foo',
          type: {
            __type: 'PrimitiveTO',
            kind: 'string',
          },
        },
      ])
    })

    it('mapped type should be resolved.', () => {
      const typesResult = helper.extractTypes(
        absolutePath('./src/types/mapped_type.ts'),
      )
      expect(isOk(typesResult)).toBe(true)
      if (!isOk(typesResult)) {
        return
      }

      const [mappedType] = typesResult.ok
      expect(mappedType).toBeDefined()

      expect(mappedType?.type.__type).toBe('ObjectTO')
      if (!mappedType || mappedType.type.__type !== 'ObjectTO') {
        return
      }

      expect(helper.getObjectProps(mappedType.type.storeKey)).toStrictEqual([
        {
          propName: '1',
          type: {
            __type: 'PrimitiveTO',
            kind: 'string',
          },
        },
        {
          propName: '2',
          type: {
            __type: 'PrimitiveTO',
            kind: 'string',
          },
        },
        {
          propName: '3',
          type: {
            __type: 'PrimitiveTO',
            kind: 'string',
          },
        },
      ])
    })

    it('function', () => {
      const typesResult = helper.extractTypes(
        absolutePath('./src/types/function.ts'),
      )
      expect(isOk(typesResult)).toBe(true)
      if (!isOk(typesResult)) {
        return
      }

      const [type0, type1, type2, type3] = typesResult.ok
      expect(type0).toBeDefined()

      expect(type0?.type).toStrictEqual({
        __type: 'CallableTO',
        argTypes: [
          {
            name: 'arg',
            type: {
              __type: 'PrimitiveTO',
              kind: 'string',
            },
          },
        ],
        returnType: {
          __type: 'PrimitiveTO',
          kind: 'number',
        },
      })

      expect(type1?.type.__type).toBe('ObjectTO')
      const typeObj = type1?.type
      if (!typeObj || typeObj.__type !== 'ObjectTO') {
        return
      }

      expect(helper.getObjectProps(typeObj.storeKey)).toStrictEqual([
        {
          propName: 'method',
          type: {
            __type: 'CallableTO',
            argTypes: [
              {
                name: 'arg',
                type: {
                  __type: 'PrimitiveTO',
                  kind: 'string',
                },
              },
            ],
            returnType: {
              __type: 'PrimitiveTO',
              kind: 'number',
            },
          },
        },
      ])

      expect(type2?.type).toStrictEqual({
        __type: 'CallableTO',
        argTypes: [],
        returnType: {
          __type: 'ArrayTO',
          typeName: 'string[]',
          child: {
            __type: 'PrimitiveTO',
            kind: 'string',
          },
        },
      })
      expect(type3).not.toBeDefined()
    })

    describe('promise', () => {
      const getTypes = () => {
        const typesResult = helper.extractTypes(
          absolutePath('./src/types/promise.ts'),
        )

        if (!isOk(typesResult)) {
          throw new TypeError('Unexpected file')
        }

        const [promise, promiseLike] = typesResult.ok
        if (promise === undefined || promiseLike === undefined) {
          throw new TypeError('Unexpected file')
        }

        return { promise, promiseLike }
      }

      it('promise type should be resolved.', () => {
        const { promise } = getTypes()

        expect(promise.type.__type).toBe('PromiseTO')
        if (promise.type.__type !== 'PromiseTO') {
          return
        }

        const childType = promise.type.child
        expect(childType.__type).toBe('ObjectTO')
        if (childType.__type !== 'ObjectTO') {
          return
        }
        expect(helper.getObjectProps(childType.storeKey)).toStrictEqual([
          {
            propName: 'name',
            type: {
              __type: 'PrimitiveTO',
              kind: 'string',
            },
          },
        ])
      })

      it('promise-like type should be resolved.', () => {
        const { promiseLike } = getTypes()

        expect(promiseLike.type.__type).toBe('PromiseLikeTO')
        if (promiseLike.type.__type !== 'PromiseLikeTO') {
          return
        }

        const childType = promiseLike.type.child
        expect(childType.__type).toBe('ObjectTO')
        if (childType.__type !== 'ObjectTO') {
          return
        }
        expect(helper.getObjectProps(childType.storeKey)).toStrictEqual([
          {
            propName: 'name',
            type: {
              __type: 'PrimitiveTO',
              kind: 'string',
            },
          },
        ])
      })
    })

    it('symbol', () => {
      const typesResult = helper.extractTypes(
        absolutePath('./src/types/symbol.ts'),
      )
      expect(isOk(typesResult)).toBe(true)
      if (!isOk(typesResult)) {
        return
      }

      const types = typesResult.ok

      const [type0, type1] = types
      expect(type1).toBeDefined()

      expect(type0?.type.__type).toBe('SpecialTO')
      if (!type0 || type0.type.__type !== 'SpecialTO') {
        return
      }
      expect(type0.type.kind).toBe('unique symbol')

      expect(type1?.type.__type).toBe('SpecialTO')
      if (!type1 || type1.type.__type !== 'SpecialTO') {
        return
      }
      expect(type1.type.kind).toBe('Symbol')
    })
  })
})
