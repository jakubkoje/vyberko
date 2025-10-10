export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid procedure ID',
    })
  }

  const db = useDrizzle()
  const procedure = await db
    .select()
    .from(tables.procedures)
    .where(eq(tables.procedures.id, Number(id)))
    .limit(1)

  if (!procedure.length) {
    throw createError({
      statusCode: 404,
      message: 'Procedure not found',
    })
  }

  // Check if user has access to this organization
  await requireOrganizationAccess(event, procedure[0].organizationId, 'procedures', 'read')

  return procedure[0]
})
