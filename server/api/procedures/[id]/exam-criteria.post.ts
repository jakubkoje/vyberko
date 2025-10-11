export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid procedure ID',
    })
  }

  const body = await readBody(event)

  // Accept either single name or array of names
  const names = Array.isArray(body.names) ? body.names : (body.name ? [body.name] : [])

  if (names.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'At least one criteria name is required',
    })
  }

  // Validate all names against codelist
  const invalidNames = names.filter((name: string) => !isValidCriteriaName(name))
  if (invalidNames.length > 0) {
    throw createError({
      statusCode: 400,
      message: `Invalid criteria names: ${invalidNames.join(', ')}`,
    })
  }

  const db = useDrizzle()

  // First, get the procedure to verify it exists and get its organizationId
  const procedure = await db
    .select()
    .from(tables.procedures)
    .where(eq(tables.procedures.id, Number(id)))
    .limit(1)

  if (!procedure.length) {
    throw createError({
      statusCode: 404,
      message: 'Procedure not found',
    })
  }

  // Check if user has access to this organization
  await requireOrganizationAccess(event, procedure[0].organizationId, 'procedures', 'write')

  // Get existing criteria to avoid duplicates
  const existingCriteria = await db
    .select()
    .from(tables.examCriteria)
    .where(eq(tables.examCriteria.procedureId, Number(id)))

  const existingNames = new Set(existingCriteria.map(c => c.name))

  // Filter out names that already exist
  const newNames = names.filter((name: string) => !existingNames.has(name))

  if (newNames.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'All provided criteria already exist for this procedure',
    })
  }

  // Create exam criteria (always use 1-5 rating scale)
  const criteria = await db
    .insert(tables.examCriteria)
    .values(newNames.map((name: string) => ({
      procedureId: Number(id),
      name,
      minRating: DEFAULT_MIN_RATING,
      maxRating: DEFAULT_MAX_RATING,
    })))
    .returning()

  return criteria
})
