import { User } from "./types"

// generics
export interface MyStore<T> {
  value: T
  get: (key: string) => T
  set: (key: string, value: T) => void
}
export type UserStore = MyStore<User>

// keyof
export type Point = { x: number; y: number }
export type P = keyof Point

export type Arrayish = { [n: number]: unknown }
export type A = keyof Arrayish

// typeof
const s = "hello"
export type SType = typeof s

// Indexed access
export type Person = { age: number; name: string; alive: boolean }
export type Age = Person["age"]

// mappted type
export type MappedType<T> = {
  [K in keyof T]: number
}
export type UserMappedType = MappedType<{
  key1: string
  key2: number
  key3: boolean
}>

// conditional type
export type Conditional<T> = T extends undefined ? Exclude<T, undefined> : T
export type TreeCond = Conditional<string | undefined>
export type FalseCond = Conditional<string | null>

// template literal types
type World = "world"
type Greeting = `hello ${World}` // eslint-disable-next-line @typescript-eslint/no-unused-vars
let greet: Greeting

// type Pick<T, K extends keyof T> = { [P in K]: T[P]; }
export type Picked = Pick<User, "id"> & User

export type RecursiveType = {
  child: RecursiveType
  children: RecursiveType[]
}

export type RecursiveArrayType = {
  childs: RecursiveType[]
}
