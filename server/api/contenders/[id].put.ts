export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid contender ID',
    })
  }

  const db = useDrizzle()

  // Get existing contender
  const existing = await db
    .select()
    .from(tables.contenders)
    .where(eq(tables.contenders.id, Number(id)))
    .limit(1)

  if (!existing.length) {
    throw createError({
      statusCode: 404,
      message: 'Contender not found',
    })
  }

  // Get procedure to check organization access
  const procedure = await db
    .select()
    .from(tables.procedures)
    .where(eq(tables.procedures.id, existing[0].procedureId))
    .limit(1)

  if (procedure.length) {
    await requireOrganizationAccess(event, procedure[0].organizationId, 'contenders', 'update')
  }

  const updated = await db
    .update(tables.contenders)
    .set({
      name: body.name,
      email: body.email,
      phone: body.phone,
      status: body.status,
      notes: body.notes,
    })
    .where(eq(tables.contenders.id, Number(id)))
    .returning()

  return updated[0]
})
