export type Obj = {
  name: string
  names: string[]
  maybeName?: string
  time: Date
}

export type RecursiveObj = {
  name: string
  child: RecursiveObj
}
