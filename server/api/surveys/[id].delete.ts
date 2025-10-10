export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid survey ID',
    })
  }

  const db = useDrizzle()

  // Get the survey first to check organization
  const existing = await db
    .select()
    .from(tables.surveys)
    .where(eq(tables.surveys.id, Number(id)))
    .limit(1)

  if (!existing.length) {
    throw createError({
      statusCode: 404,
      message: 'Survey not found',
    })
  }

  // Check if user has access to delete surveys
  await requireOrganizationAccess(event, existing[0].organizationId, 'surveys', 'delete')

  const deleted = await db
    .delete(tables.surveys)
    .where(eq(tables.surveys.id, Number(id)))
    .returning()

  return { success: true, deleted: deleted[0] }
})
