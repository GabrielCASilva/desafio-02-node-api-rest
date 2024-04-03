// eslint-disable-next-line
import { Knex } from 'knex';

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      name: string
      email: string
      password: string
      created_at: string
      session_id?: string
    }
    meals: {
      id: string
      name: string
      description: string
      on_diet: boolean
      date?: string
      created_at: string
      user_id: string
    }
  }
}
