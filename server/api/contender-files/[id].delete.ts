export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid file ID',
    })
  }

  const db = useDrizzle()

  // Get existing file
  const existing = await db
    .select()
    .from(tables.contenderFiles)
    .where(eq(tables.contenderFiles.id, Number(id)))
    .limit(1)

  if (!existing.length) {
    throw createError({
      statusCode: 404,
      message: 'File not found',
    })
  }

  // Get contender
  const contender = await db
    .select()
    .from(tables.contenders)
    .where(eq(tables.contenders.id, existing[0].contenderId))
    .limit(1)

  if (contender.length) {
    // Get procedure to check organization access
    const procedure = await db
      .select()
      .from(tables.procedures)
      .where(eq(tables.procedures.id, contender[0].procedureId))
      .limit(1)

    if (procedure.length) {
      await requireOrganizationAccess(event, procedure[0].organizationId, 'contenders', 'delete')
    }
  }

  // Delete from MinIO if there's a key stored
  if (existing[0].sharepointId) {
    try {
      await deleteFile(existing[0].sharepointId)
    }
    catch (error) {
      console.error('Failed to delete file from MinIO:', error)
      // Continue with database deletion even if MinIO deletion fails
    }
  }

  await db
    .delete(tables.contenderFiles)
    .where(eq(tables.contenderFiles.id, Number(id)))

  return { success: true }
})
