async function generateProcedureIdentifier(db: ReturnType<typeof useDrizzle>, year: number): Promise<string> {
  // Find all procedures created this year to determine next sequential number
  const yearPrefix = `VK/${year}/%`
  const existingProcedures = await db
    .select({ identifier: tables.procedures.identifier })
    .from(tables.procedures)
    .where(like(tables.procedures.identifier, yearPrefix))
    .orderBy(desc(tables.procedures.identifier))
    .limit(1)

  let nextNumber = 1
  if (existingProcedures.length > 0) {
    // Extract the sequential number from identifier like "VK/2025/0001"
    const lastIdentifier = existingProcedures[0].identifier
    const match = lastIdentifier.match(/VK\/\d{4}\/(\d+)$/)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  // Format as VK/YYYY/NNNN with zero-padding
  return `VK/${year}/${nextNumber.toString().padStart(4, '0')}`
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.title) {
    throw createError({
      statusCode: 400,
      message: 'Title is required',
    })
  }

  // Validate required header fields
  const requiredFields = ['procedureType', 'organizationalUnit', 'civilServiceSector', 'positionTitle', 'serviceType']
  for (const field of requiredFields) {
    if (!body[field]) {
      throw createError({
        statusCode: 400,
        message: `${field} is required`,
      })
    }
  }

  if (body.numberOfPositions && body.numberOfPositions < 1) {
    throw createError({
      statusCode: 400,
      message: 'Number of positions must be at least 1',
    })
  }

  // Get current organization and user from context
  const organizationId = await getCurrentOrganizationId(event)
  const user = await getCurrentUser(event)

  // Check if user has access to create procedures
  await requireOrganizationAccess(event, organizationId, 'procedures', 'create')

  const db = useDrizzle()

  // Generate unique identifier in format VK/YYYY/NNNN
  const currentYear = new Date().getFullYear()
  const identifier = await generateProcedureIdentifier(db, currentYear)

  try {
    const newProcedure = await db
      .insert(tables.procedures)
      .values({
        identifier,
        title: body.title,
        description: body.description || null,
        status: body.status || 'draft',
        procedureType: body.procedureType,
        organizationalUnit: body.organizationalUnit,
        civilServiceSector: body.civilServiceSector,
        positionTitle: body.positionTitle,
        serviceType: body.serviceType,
        procedureDate: body.procedureDate ? new Date(body.procedureDate) : null,
        numberOfPositions: body.numberOfPositions || 1,
        organizationId,
        createdById: user.id,
      })
      .returning()

    const procedure = newProcedure[0]

    // Create exam criteria for oral exam categories (personal characteristics)
    if (body.personalCharacteristics && Array.isArray(body.personalCharacteristics) && body.personalCharacteristics.length > 0) {
      const criteriaToInsert = body.personalCharacteristics.map((characteristic: string) => ({
        procedureId: procedure.id,
        name: characteristic,
        minRating: 1,
        maxRating: 5,
      }))

      await db
        .insert(tables.examCriteria)
        .values(criteriaToInsert)
    }

    // Create surveys for written exam test types
    if (body.testTypes && Array.isArray(body.testTypes) && body.testTypes.length > 0) {
      const { examCategoriesCodelist } = await import('../../utils/examCategoriesCodelist')

      // Map CISSS test type labels to category values
      const testTypeLabelMap: Record<string, string> = {
        'Odborný test': 'professional_knowledge',
        'Všeobecný test': 'general_knowledge',
        'Test zo štátneho jazyka': 'state_language',
        'Test z cudzieho jazyka': 'foreign_language',
        'Test z práce s informačnými technológiami': 'it_skills',
      }

      for (let i = 0; i < body.testTypes.length; i++) {
        const testTypeLabel = body.testTypes[i].trim()
        const categoryValue = testTypeLabelMap[testTypeLabel]

        if (categoryValue) {
          const category = examCategoriesCodelist.find(cat => cat.value === categoryValue)

          if (category) {
            // Create empty survey with just title and category
            const newSurvey = await db
              .insert(tables.surveys)
              .values({
                title: category.label,
                jsonData: { title: category.label, pages: [] }, // Empty survey template
                category: categoryValue,
                status: 'draft',
                organizationId,
                createdById: user.id,
              })
              .returning()

            // Link survey to procedure
            await db
              .insert(tables.procedureSurveys)
              .values({
                procedureId: procedure.id,
                surveyId: newSurvey[0].id,
                order: i,
              })
          }
        }
      }
    }

    return procedure
  }
  catch (error) {
    console.error('Database error:', error)
    throw createError({
      statusCode: 500,
      message: `Failed to create procedure: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }
})
