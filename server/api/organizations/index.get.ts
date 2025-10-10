export default defineEventHandler(async (_event) => {
  // TODO: Get userId from session/auth
  const userId = 1 // Temporary hardcode

  return await getUserOrganizations(userId)
})
