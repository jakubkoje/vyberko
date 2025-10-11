export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid procedure ID',
    })
  }

  // Check procedure-specific access using user's role in THIS procedure
  await requireProcedureAccess(event, Number(id), 'procedures', 'update')

  const db = useDrizzle()

  const updated = await db
    .update(tables.procedures)
    .set({
      title: body.title,
      description: body.description,
      status: body.status,
    })
    .where(eq(tables.procedures.id, Number(id)))
    .returning()

  return updated[0]
})
