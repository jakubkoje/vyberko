export default defineEventHandler(async (_event) => {
  const drizzle = useDrizzle()
  await drizzle.insert(tables.users).values({
    name: 'John Doe',
    email: `${crypto.randomUUID()}@example.com`,
    password: 'password',
    avatar: 'avatar',
  })
  const users = await drizzle.select().from(tables.users)
  return {
    users,
  }
})
