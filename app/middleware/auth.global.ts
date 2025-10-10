export default defineNuxtRouteMiddleware(async (to, from) => {
  const { loggedIn, user } = useUserSession()

  // /auth pages are always public - no auth checks needed
  if (to.path.startsWith('/auth')) {
    return
  }

  // Protect /admin routes - require staff authentication
  if (to.path.startsWith('/admin')) {
    if (!loggedIn.value) {
      return navigateTo('/auth/staff-login')
    }

    const allowedRoles = ['admin', 'subject_expert', 'commission_chair', 'commission_member']
    if (!user.value || !allowedRoles.includes(user.value.role)) {
      return navigateTo('/auth/staff-login')
    }
  }

  // Protect /procedure routes - require candidate authentication
  if (to.path.startsWith('/procedure')) {
    if (!loggedIn.value) {
      return navigateTo('/auth/candidate-login')
    }

    // Candidates can only access their own procedure test
    if (user.value?.role === 'candidate') {
      const procedureId = to.params.id
      if (procedureId && Number(procedureId) !== user.value.procedureId) {
        return navigateTo(`/procedure/${user.value.procedureId}/test`)
      }
    }
  }
})
