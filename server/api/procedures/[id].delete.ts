export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid procedure ID',
    })
  }

  const db = useDrizzle()

  // Get existing procedure to check organization
  const existing = await db
    .select()
    .from(tables.procedures)
    .where(eq(tables.procedures.id, Number(id)))
    .limit(1)

  if (!existing.length) {
    throw createError({
      statusCode: 404,
      message: 'Procedure not found',
    })
  }

  // Check if user has access to delete this procedure
  await requireOrganizationAccess(event, existing[0].organizationId, 'procedures', 'delete')

  await db
    .delete(tables.procedures)
    .where(eq(tables.procedures.id, Number(id)))

  return { success: true }
})
