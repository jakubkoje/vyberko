export default defineEventHandler(async (event) => {
  // Clear the user session using nuxt-auth-utils
  await clearUserSession(event)

  return {
    success: true,
  }
})
