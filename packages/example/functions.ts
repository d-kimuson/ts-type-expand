import type { User } from './types'

export function getUser(userId: string): User {
  return {
    id: userId,
    name: '山田太郎',
    age: 20,
  }
}
