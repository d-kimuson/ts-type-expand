import type { User } from "./types"
import { UserRepository } from "./classes"

export const user: User = {
  id: "xxxxx",
  name: "山田太郎",
  age: 20,
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getUser = (userId: string): User => {
  return user
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getUser2 = function (userId: string): User {
  return user
}

export const userRepository = new UserRepository([user])
