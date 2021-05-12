export type User = {
  id: string
  name: string
  age: number
  directExpanded?: {
    name: number
    age: number
  }
}

export type PartialUser = Partial<User>

export type Foo = {
  id: string
  name: string
  age: number
  expanded?: PartialUser
}

export type GetUser = (userId: string) => User

export interface Article {
  user: User
  title: string
  body: string
}
