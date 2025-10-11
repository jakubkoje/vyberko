export default defineEventHandler(async (event) => {
  const procedureId = Number(getRouterParam(event, 'id'))

  if (!procedureId || Number.isNaN(procedureId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid procedure ID',
    })
  }

  const db = useDrizzle()

  // Fetch all staff assignments for this procedure with user and role details
  const assignments = await db.query.procedureAssignments.findMany({
    where: (fields, { eq }) => eq(fields.procedureId, procedureId),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      role: {
        columns: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  })

  // Add display names for roles
  const displayNameMap: Record<string, string> = {
    subject_expert: 'Vecný gestor',
    commission_chair: 'Predseda komisie',
    commission_member: 'Člen komisie',
  }

  return assignments.map(assignment => ({
    id: assignment.id,
    procedureId: assignment.procedureId,
    userId: assignment.userId,
    userName: assignment.user.name,
    userEmail: assignment.user.email,
    userAvatar: assignment.user.avatar,
    roleId: assignment.role.id,
    roleName: assignment.role.name,
    roleDisplayName: displayNameMap[assignment.role.name] || assignment.role.name,
    roleDescription: assignment.role.description,
    status: assignment.status,
    assignedAt: assignment.assignedAt,
    acceptedAt: assignment.acceptedAt,
  }))
})
