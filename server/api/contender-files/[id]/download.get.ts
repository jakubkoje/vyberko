export default defineEventHandler(async (event) => {
  const fileId = getRouterParam(event, 'id')

  if (!fileId || isNaN(Number(fileId))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid file ID',
    })
  }

  const db = useDrizzle()

  // Get file record
  const file = await db
    .select()
    .from(tables.contenderFiles)
    .where(eq(tables.contenderFiles.id, Number(fileId)))
    .limit(1)

  if (!file.length) {
    throw createError({
      statusCode: 404,
      message: 'File not found',
    })
  }

  // Get contender to check access
  const contender = await db
    .select()
    .from(tables.contenders)
    .where(eq(tables.contenders.id, file[0].contenderId))
    .limit(1)

  if (!contender.length) {
    throw createError({
      statusCode: 404,
      message: 'Contender not found',
    })
  }

  // Get procedure to check organization access
  const procedure = await db
    .select()
    .from(tables.procedures)
    .where(eq(tables.procedures.id, contender[0].procedureId))
    .limit(1)

  if (procedure.length) {
    await requireOrganizationAccess(event, procedure[0].organizationId, 'contenders', 'read')
  }

  // Generate presigned URL (using the MinIO key stored in sharepointId)
  const presignedUrl = await generatePresignedUrl(file[0].sharepointId || '')

  return {
    url: presignedUrl,
    fileName: file[0].fileName,
    fileType: file[0].fileType,
  }
})
