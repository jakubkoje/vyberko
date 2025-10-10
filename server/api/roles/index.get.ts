export default defineEventHandler(async (_event) => {
  const db = useDrizzle()

  const roles = await db
    .select({
      id: tables.roles.id,
      name: tables.roles.name,
      description: tables.roles.description,
    })
    .from(tables.roles)

  return roles
})
