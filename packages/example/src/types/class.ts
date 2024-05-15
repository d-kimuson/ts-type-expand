type User = {
  id: string
  name: string
}

export class UserRepository {
  private users: User[]
  constructor(users: User[]) {
    this.users = users
  }

  getUser(userId: string): User {
    return {
      id: userId,
      name: '山田太郎',
    }
  }

  async asyncF() {}

  async asyncF2() {
    return {
      name: 'taro',
    }
  }
}
