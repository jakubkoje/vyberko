export default defineEventHandler(async (event) => {
  // Get current organization from user context
  const organizationId = await getCurrentOrganizationId(event)

  // Check if user has access to this organization
  await requireOrganizationAccess(event, organizationId, 'surveys', 'read')

  const db = useDrizzle()

  const surveys = await db.query.surveys.findMany({
    where: eq(tables.surveys.organizationId, organizationId),
    orderBy: [desc(tables.surveys.updatedAt)],
    with: {
      procedureSurvey: {
        with: {
          procedure: true,
        },
      },
    },
  })

  return surveys
})
