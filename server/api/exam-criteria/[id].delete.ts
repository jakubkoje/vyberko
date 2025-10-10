export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid criteria ID',
    })
  }

  const db = useDrizzle()

  // First, get the criteria to verify it exists
  const existingCriteria = await db
    .select()
    .from(tables.examCriteria)
    .where(eq(tables.examCriteria.id, Number(id)))
    .limit(1)

  if (!existingCriteria.length) {
    throw createError({
      statusCode: 404,
      message: 'Criteria not found',
    })
  }

  // Get the procedure to check organization access
  const procedure = await db
    .select()
    .from(tables.procedures)
    .where(eq(tables.procedures.id, existingCriteria[0].procedureId))
    .limit(1)

  if (!procedure.length) {
    throw createError({
      statusCode: 404,
      message: 'Procedure not found',
    })
  }

  // Check if user has access to this organization
  await requireOrganizationAccess(event, procedure[0].organizationId, 'procedures', 'write')

  // Delete criteria
  await db
    .delete(tables.examCriteria)
    .where(eq(tables.examCriteria.id, Number(id)))

  return { success: true }
})
