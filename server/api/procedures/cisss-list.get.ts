import * as cheerio from 'cheerio'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const organizationGuid = query.organizationGuid as string

  if (!organizationGuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Organization GUID is required',
    })
  }

  const url = `https://cisss.gov.sk/vyberove-konania/zoznam?Search.SearchWhat=&Search.SearchWhere=&Search.Page=1&Search.Sort=PublicationDate&Search.CompanyGuid=${organizationGuid}&Search.Status=published&Search.PageSize=100`

  try {
    const response = await fetch(url)
    const html = await response.text()
    const $ = cheerio.load(html)

    const procedures: Array<{
      guid: string
      identifier: string
      title: string
      status: string
      type: string
      organizationalUnit: string
      publicationDate: string
      url: string
    }> = []

    // Find all procedure cards
    $('.idsk-card').each((_, card) => {
      const $card = $(card)

      // Extract link and GUID
      const link = $card.find('.idsk-card-title').attr('href') || ''
      const guid = link.split('/').pop() || ''
      const fullTitle = $card.find('.idsk-card-title').text().trim()

      // Parse identifier from title (e.g., "VK/2024/0512 - title")
      const match = fullTitle.match(/^(VK\/\d{4}\/\d+)\s*-\s*(.+)$/)
      const identifier = match ? match[1] : ''
      const title = match ? match[2] : fullTitle

      // Extract metadata
      const status = $card.find('.hr_EmployeeSelectionStatus').text().trim()
      const type = $card.find('p:contains("Druh:")').find('span:last').text().trim()
      const organizationalUnit = $card.find('p:contains("Zaradenie v organizačnej štruktúre:")').find('span:last').text().trim()
      const publicationDate = $card.find('p:contains("Dátum vyhlásenia:")').find('span:last').text().trim()

      // Build detail URL - this is the page with full information
      const detailUrl = link.startsWith('http') ? link : `https://cisss.gov.sk${link}`

      console.log(`Found procedure ${identifier}: ${detailUrl}`)

      if (guid && identifier) {
        procedures.push({
          guid,
          identifier,
          title,
          status,
          type,
          organizationalUnit,
          publicationDate,
          url: detailUrl,
        })
      }
    })

    // Get existing procedures from DB to compare
    const db = useDrizzle()
    const existingProcedures = await db.query.procedures.findMany({
      columns: {
        identifier: true,
      },
    })

    const existingIdentifiers = new Set(existingProcedures.map(p => p.identifier))

    // Mark which procedures are missing
    const proceduresWithStatus = procedures.map(p => ({
      ...p,
      existsInSystem: existingIdentifiers.has(p.identifier),
    }))

    // Separate into existing and missing
    const missing = proceduresWithStatus.filter(p => !p.existsInSystem)
    const existing = proceduresWithStatus.filter(p => p.existsInSystem)

    return {
      total: procedures.length,
      missing: missing.length,
      existing: existing.length,
      procedures: proceduresWithStatus,
      missingProcedures: missing,
    }
  }
  catch (error) {
    console.error('Error fetching CISSS list:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch CISSS procedure list',
    })
  }
})
