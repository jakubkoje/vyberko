import { drizzle } from 'drizzle-orm/node-postgres'

import * as schema from '../database/schema'

export { sql, eq, and, or, asc, desc } from 'drizzle-orm'

export const tables = schema

export function useDrizzle() {
  return drizzle(process.env.DATABASE_URL!, { schema })
}

export type User = typeof schema.users.$inferSelect
