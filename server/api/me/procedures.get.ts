import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // Require authenticated user
  const session = await requireUserSession(event)
  const db = useDrizzle()

  // Fetch all procedure assignments for this user
  const assignments = await db.query.procedureAssignments.findMany({
    where: eq(tables.procedureAssignments.userId, session.user.id),
    with: {
      procedure: {
        columns: {
          id: true,
          identifier: true,
          title: true,
          status: true,
        },
      },
      role: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: (fields, { desc }) => [desc(fields.assignedAt)],
  })

  // Map role names to display names
  const displayNameMap: Record<string, string> = {
    subject_expert: 'Vecný gestor',
    commission_chair: 'Predseda komisie',
    commission_member: 'Člen komisie',
  }

  return assignments.map(assignment => ({
    id: assignment.id,
    procedureId: assignment.procedure.id,
    procedureIdentifier: assignment.procedure.identifier,
    procedureTitle: assignment.procedure.title,
    procedureStatus: assignment.procedure.status,
    roleId: assignment.role.id,
    roleName: assignment.role.name,
    roleDisplayName: displayNameMap[assignment.role.name] || assignment.role.name,
    status: assignment.status,
    assignedAt: assignment.assignedAt,
    acceptedAt: assignment.acceptedAt,
  }))
})
