export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id

  // Get current organization from user context
  const organizationId = await getCurrentOrganizationId(event)

  // Check if user has access to this organization
  const userOrg = await requireOrganizationAccess(event, organizationId, 'surveys', 'read')

  const db = useDrizzle()

  // Admins see all surveys in their organization
  if (userOrg.roleName === 'admin') {
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
  }

  // Non-admins (gestor, commission) see only surveys from procedures they're assigned to
  const surveys = await db
    .select({
      id: tables.surveys.id,
      title: tables.surveys.title,
      category: tables.surveys.category,
      jsonData: tables.surveys.jsonData,
      organizationId: tables.surveys.organizationId,
      createdById: tables.surveys.createdById,
      createdAt: tables.surveys.createdAt,
      updatedAt: tables.surveys.updatedAt,
    })
    .from(tables.surveys)
    .innerJoin(
      tables.procedureSurveys,
      eq(tables.procedureSurveys.surveyId, tables.surveys.id),
    )
    .innerJoin(
      tables.procedures,
      eq(tables.procedures.id, tables.procedureSurveys.procedureId),
    )
    .innerJoin(
      tables.procedureAssignments,
      eq(tables.procedureAssignments.procedureId, tables.procedures.id),
    )
    .where(
      and(
        eq(tables.surveys.organizationId, organizationId),
        eq(tables.procedureAssignments.userId, userId),
      ),
    )
    .orderBy(desc(tables.surveys.updatedAt))

  // Fetch procedure survey relations separately for the filtered surveys
  const surveyIds = surveys.map(s => s.id)
  const procedureSurveys = surveyIds.length > 0
    ? await db.query.procedureSurveys.findMany({
      where: inArray(tables.procedureSurveys.surveyId, surveyIds),
      with: {
        procedure: true,
      },
    })
    : []

  // Map procedure surveys to their surveys
  return surveys.map(survey => ({
    ...survey,
    procedureSurvey: procedureSurveys.find(ps => ps.surveyId === survey.id) || null,
  }))
})
