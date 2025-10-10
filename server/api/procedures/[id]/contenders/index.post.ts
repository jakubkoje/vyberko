export default defineEventHandler(async (event) => {
  const procedureId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!procedureId || isNaN(Number(procedureId))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid procedure ID',
    })
  }

  if (!body.name || !body.email) {
    throw createError({
      statusCode: 400,
      message: 'Name and email are required',
    })
  }

  const db = useDrizzle()

  // Get procedure to check organization access
  const procedure = await db
    .select()
    .from(tables.procedures)
    .where(eq(tables.procedures.id, Number(procedureId)))
    .limit(1)

  if (!procedure.length) {
    throw createError({
      statusCode: 404,
      message: 'Procedure not found',
    })
  }

  // Check if user has access to create contenders
  await requireOrganizationAccess(event, procedure[0].organizationId, 'contenders', 'create')

  const newContender = await db
    .insert(tables.contenders)
    .values({
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      status: body.status || 'pending',
      notes: body.notes || null,
      procedureId: Number(procedureId),
    })
    .returning()

  return newContender[0]
})
