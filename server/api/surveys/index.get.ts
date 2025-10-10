export default defineEventHandler(async (event) => {
  // TODO: Get userId and organizationId from session/auth
  const organizationId = getQuery(event).organizationId
    ? Number(getQuery(event).organizationId)
    : null

  if (!organizationId) {
    throw createError({
      statusCode: 400,
      message: 'Organization ID is required',
    })
  }

  // Check if user has access to this organization
  await requireOrganizationAccess(event, organizationId, 'surveys', 'read')

  const db = useDrizzle()

  const surveys = await db
    .select()
    .from(tables.surveys)
    .where(eq(tables.surveys.organizationId, organizationId))
    .orderBy(desc(tables.surveys.updatedAt))

  return surveys
})
