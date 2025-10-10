export default defineEventHandler(async (event) => {
  const contenderId = getRouterParam(event, 'id')

  if (!contenderId || isNaN(Number(contenderId))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid contender ID',
    })
  }

  const db = useDrizzle()

  // Get contender to check access
  const contender = await db
    .select()
    .from(tables.contenders)
    .where(eq(tables.contenders.id, Number(contenderId)))
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
    await requireOrganizationAccess(event, procedure[0].organizationId, 'contenders', 'create')
  }

  // Parse multipart form data
  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No file uploaded',
    })
  }

  const fileData = formData.find(item => item.name === 'file')

  if (!fileData || !fileData.data || !fileData.filename) {
    throw createError({
      statusCode: 400,
      message: 'File data is required',
    })
  }

  // Generate unique file key
  const fileExtension = fileData.filename.split('.').pop()
  const uniqueKey = `contenders/${contenderId}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`

  // Upload to MinIO
  const { url } = await uploadFile(uniqueKey, fileData.data, fileData.type)

  // Create file record
  const newFile = await db
    .insert(tables.contenderFiles)
    .values({
      contenderId: Number(contenderId),
      fileName: fileData.filename,
      fileType: fileData.type || 'application/octet-stream',
      fileSize: fileData.data.length,
      fileUrl: url,
      sharepointId: uniqueKey, // Store MinIO key in sharepointId for now
      uploadedAt: new Date(),
    })
    .returning()

  return newFile[0]
})
