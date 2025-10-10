export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid contender ID',
    })
  }

  const db = useDrizzle()

  // Get contender with procedure info
  const contender = await db
    .select()
    .from(tables.contenders)
    .where(eq(tables.contenders.id, Number(id)))
    .limit(1)

  if (!contender.length) {
    throw createError({
      statusCode: 404,
      message: 'Contender not found',
    })
  }

  // Get procedure to check organization access
  const procedure = await db
    .select()
    .from(tables.procedures)
    .where(eq(tables.procedures.id, contender[0].procedureId))
    .limit(1)

  if (procedure.length) {
    await requireOrganizationAccess(event, procedure[0].organizationId, 'contenders', 'read')
  }

  return contender[0]
})
