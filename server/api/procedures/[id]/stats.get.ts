export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
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
    .where(eq(tables.procedures.id, Number(id)))
    .limit(1)

  if (!procedure.length) {
    throw createError({
      statusCode: 404,
      message: 'Procedure not found',
    })
  }

  await requireOrganizationAccess(event, procedure[0].organizationId, 'procedures', 'read')

  // Get total contenders count
  const contendersResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(tables.contenders)
    .where(eq(tables.contenders.procedureId, Number(id)))

  const totalContenders = Number(contendersResult[0]?.count || 0)

  // Get contenders by status
  const contendersByStatus = await db
    .select({
      status: tables.contenders.status,
      count: sql<number>`count(*)`,
    })
    .from(tables.contenders)
    .where(eq(tables.contenders.procedureId, Number(id)))
    .groupBy(tables.contenders.status)

  // Get total surveys/tests count
  const surveysResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(tables.procedureSurveys)
    .where(eq(tables.procedureSurveys.procedureId, Number(id)))

  const totalTests = Number(surveysResult[0]?.count || 0)

  // Get surveys by category
  const testsByCategory = await db
    .select({
      category: tables.surveys.category,
      count: sql<number>`count(*)`,
    })
    .from(tables.procedureSurveys)
    .innerJoin(tables.surveys, eq(tables.procedureSurveys.surveyId, tables.surveys.id))
    .where(eq(tables.procedureSurveys.procedureId, Number(id)))
    .groupBy(tables.surveys.category)

  // Get staff assignments count
  const staffResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(tables.procedureAssignments)
    .where(eq(tables.procedureAssignments.procedureId, Number(id)))

  const totalStaff = Number(staffResult[0]?.count || 0)

  // Get active staff count (status = 'accepted')
  const activeStaffResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(tables.procedureAssignments)
    .where(and(
      eq(tables.procedureAssignments.procedureId, Number(id)),
      eq(tables.procedureAssignments.status, 'accepted'),
    ))

  const activeStaff = Number(activeStaffResult[0]?.count || 0)

  // Get exam criteria count
  const criteriaResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(tables.examCriteria)
    .where(eq(tables.examCriteria.procedureId, Number(id)))

  const totalCriteria = Number(criteriaResult[0]?.count || 0)

  // Return statistics
  return {
    procedure: {
      id: procedure[0].id,
      title: procedure[0].title,
      status: procedure[0].status,
      identifier: procedure[0].identifier,
    },
    contenders: {
      total: totalContenders,
      byStatus: contendersByStatus.map(row => ({
        status: row.status,
        count: Number(row.count),
      })),
    },
    tests: {
      total: totalTests,
      byCategory: testsByCategory.map(row => ({
        category: row.category,
        count: Number(row.count),
      })),
    },
    staff: {
      total: totalStaff,
      active: activeStaff,
      pending: totalStaff - activeStaff,
    },
    evaluation: {
      criteriaCount: totalCriteria,
    },
  }
})
