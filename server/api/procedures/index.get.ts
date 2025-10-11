export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const db = useDrizzle()

  // Get current organization from user context
  const organizationId = await getCurrentOrganizationId(event)

  // Check if user has access to this organization
  await requireOrganizationAccess(event, organizationId, 'procedures', 'read')

  // Admins see all procedures in their organization
  if (session.user.role === 'admin') {
    const procedures = await db
      .select()
      .from(tables.procedures)
      .where(eq(tables.procedures.organizationId, organizationId))
      .orderBy(desc(tables.procedures.updatedAt))

    return procedures
  }

  // Non-admins (subject_expert, commission_member) see only assigned procedures
  const assignedProcedures = await db
    .select({
      id: tables.procedures.id,
      identifier: tables.procedures.identifier,
      title: tables.procedures.title,
      description: tables.procedures.description,
      status: tables.procedures.status,
      procedureType: tables.procedures.procedureType,
      organizationalUnit: tables.procedures.organizationalUnit,
      civilServiceSector: tables.procedures.civilServiceSector,
      positionTitle: tables.procedures.positionTitle,
      serviceType: tables.procedures.serviceType,
      procedureDate: tables.procedures.procedureDate,
      numberOfPositions: tables.procedures.numberOfPositions,
      organizationId: tables.procedures.organizationId,
      createdById: tables.procedures.createdById,
      createdAt: tables.procedures.createdAt,
      updatedAt: tables.procedures.updatedAt,
    })
    .from(tables.procedures)
    .innerJoin(
      tables.procedureAssignments,
      eq(tables.procedureAssignments.procedureId, tables.procedures.id),
    )
    .where(
      and(
        eq(tables.procedures.organizationId, organizationId),
        eq(tables.procedureAssignments.userId, session.user.id),
      ),
    )
    .orderBy(desc(tables.procedures.updatedAt))

  return assignedProcedures
})
