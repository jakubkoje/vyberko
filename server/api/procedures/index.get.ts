export default defineEventHandler(async (event) => {
  // Get current organization from user context
  const organizationId = await getCurrentOrganizationId(event)

  // Check if user has access to this organization
  await requireOrganizationAccess(event, organizationId, 'procedures', 'read')

  const db = useDrizzle()

  const procedures = await db
    .select()
    .from(tables.procedures)
    .where(eq(tables.procedures.organizationId, organizationId))
    .orderBy(desc(tables.procedures.updatedAt))

  return procedures
})
