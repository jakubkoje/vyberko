import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const assignmentId = Number(getRouterParam(event, 'id'))

  if (!assignmentId || Number.isNaN(assignmentId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid assignment ID',
    })
  }

  const db = useDrizzle()

  // Check if assignment exists
  const assignment = await db.query.procedureAssignments.findFirst({
    where: eq(tables.procedureAssignments.id, assignmentId),
  })

  if (!assignment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Assignment not found',
    })
  }

  // Delete the assignment
  await db.delete(tables.procedureAssignments)
    .where(eq(tables.procedureAssignments.id, assignmentId))

  return {
    success: true,
    message: 'Staff assignment removed successfully',
  }
})
