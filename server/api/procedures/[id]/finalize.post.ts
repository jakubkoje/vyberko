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
  const procedure = await db.query.procedures.findFirst({
    where: eq(tables.procedures.id, Number(id)),
  })

  if (!procedure) {
    throw createError({
      statusCode: 404,
      message: 'Procedure not found',
    })
  }

  // Check if user has permission to finalize procedures
  await requireOrganizationAccess(event, procedure.organizationId, 'procedures', 'finalize')

  // Check if procedure is already completed
  if (procedure.status === 'completed') {
    throw createError({
      statusCode: 400,
      message: 'Procedure is already completed',
    })
  }

  try {
    // Update procedure status to completed
    await db
      .update(tables.procedures)
      .set({
        status: 'completed',
      })
      .where(eq(tables.procedures.id, Number(id)))

    // TODO: In the future, we can add logic here to:
    // - Calculate final scores for each contender
    // - Generate final reports
    // - Send notifications to contenders
    // - Export data to external systems

    return {
      success: true,
      message: 'Procedure finalized successfully',
    }
  }
  catch (error) {
    console.error('Error finalizing procedure:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to finalize procedure',
    })
  }
})
