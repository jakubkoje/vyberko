export default defineEventHandler(async (event) => {
  const db = useDrizzle()

  // Fetch all roles except 'candidate' (candidates are not invited to Keycloak)
  const allRoles = await db.query.roles.findMany({
    columns: {
      id: true,
      name: true,
      description: true,
    },
  })

  // Filter to only include staff roles that can be invited (exclude 'admin' and 'candidate')
  // Admin users can invite: subject_expert, commission_chair, commission_member
  const invitableRoleNames = ['subject_expert', 'commission_chair', 'commission_member']
  const staffRoles = allRoles.filter(role => invitableRoleNames.includes(role.name))

  // Add Slovak display names for UI (matching VK documentation)
  const rolesWithDisplayNames = staffRoles.map((role) => {
    const displayNameMap: Record<string, string> = {
      subject_expert: 'Vecný gestor',
      commission_chair: 'Predseda komisie',
      commission_member: 'Člen komisie',
    }

    return {
      id: role.id,
      name: role.name,
      displayName: displayNameMap[role.name] || role.name,
      description: role.description,
    }
  })

  return rolesWithDisplayNames
})
