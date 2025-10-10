export default defineEventHandler(async (event) => {
  const procedureId = getRouterParam(event, 'id')

  if (!procedureId || isNaN(Number(procedureId))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid procedure ID',
    })
  }

  const db = useDrizzle()

  // Get procedure to check organization access
  const procedure = await db
    .select()
    .from(tables.procedures)
    .where(eq(tables.procedures.id, Number(procedureId)))
    .limit(1)

  if (!procedure.length) {
    throw createError({
      statusCode: 404,
      message: 'Procedure not found',
    })
  }

  // Check if user has access to this organization
  await requireOrganizationAccess(event, procedure[0].organizationId, 'contenders', 'read')

  const contenders = await db
    .select()
    .from(tables.contenders)
    .where(eq(tables.contenders.procedureId, Number(procedureId)))
    .orderBy(desc(tables.contenders.createdAt))

  return contenders
})
