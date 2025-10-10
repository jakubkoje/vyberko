export default defineEventHandler(async (event) => {
  const contenderId = getRouterParam(event, 'id')

  if (!contenderId || isNaN(Number(contenderId))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid contender ID',
    })
  }

  const db = useDrizzle()

  // Get contender to check access
  const contender = await db
    .select()
    .from(tables.contenders)
    .where(eq(tables.contenders.id, Number(contenderId)))
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

  // Get all files for this contender
  const files = await db
    .select()
    .from(tables.contenderFiles)
    .where(eq(tables.contenderFiles.contenderId, Number(contenderId)))
    .orderBy(desc(tables.contenderFiles.uploadedAt))

  return files
})
