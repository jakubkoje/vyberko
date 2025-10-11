import * as cheerio from 'cheerio'

type Value = string | number | string[]

interface Rule {
  label: string
  transform?: (value: string) => Value
}

const rules: Record<string, Rule> = {
  id: {
    label: 'Identifikátor výberového konania',
  },
  type: {
    label: 'Druh výberoveho konania',
  },
  organizationalUnit: {
    label: 'Zaradenie v organizačnej štruktúre',
  },
  civilServiceSector: {
    label: 'Odbor štátnej služby',
  },
  position: {
    label: 'Obsadzované štátnozamestnanecké miesto vo funkcii',
  },
  vacancies: {
    label: 'Počet obsadzovaných miest',
    transform: value => parseInt(value, 10),
  },
  serviceType: {
    label: 'Druh štátnej služby',
  },
  testTypes: {
    label: 'Formy overenia - písomná časť výberového konania',
    transform: value => value.split(',').map(s => s.trim()),
  },
  personalCharacteristics: {
    label: 'Požadované schopnosti a osobnostné vlastnosti',
    transform: value => value.split(',').map(s => s.trim()),
  },
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { url } = body

  if (!url) {
    throw createError({
      statusCode: 400,
      statusMessage: 'URL is required',
    })
  }

  try {
    console.log('Fetching CISSS URL:', url)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const text = await response.text()

    const $ = cheerio.load(text)

    const labelValuePairs: {
      label: string
      value: string
    }[] = []

    // ===== Extractors ======

    // Basic info
    $('.govuk-summary-list')
      .first()
      .children()
      .each((_, el) => {
        const label = $(el).find('.govuk-summary-list__key').text().trim()
        const value = $(el).find('.govuk-summary-list__value').text().trim()
        labelValuePairs.push({ label, value })
      })

    // Contender profile
    $('.govuk-body').each((_, el) => {
      const childs = $(el).children().length

      if (childs === 3) {
        const label = $(el).children().first().text().trim()
        const value = $(el).children().last().text().trim()
        labelValuePairs.push({ label, value })
      }
    })

    // ===== Process ======

    const result: Record<string, Value> = {}

    // Log all found labels for debugging
    console.log('Found labels:', labelValuePairs.map(p => p.label))

    labelValuePairs.forEach(({ label, value }) => {
      Object.keys(rules).forEach((key) => {
        // Case-insensitive and flexible matching
        const ruleLabel = rules[key]!.label.toLowerCase().trim()
        const foundLabel = label.toLowerCase().trim()

        if (foundLabel === ruleLabel || foundLabel.includes(ruleLabel) || ruleLabel.includes(foundLabel)) {
          const transformedValue = rules[key]!.transform
            ? rules[key]!.transform!(value)
            : value

          result[key] = transformedValue
          console.log(`Matched "${label}" to key "${key}":`, transformedValue)
        }
      })
    })

    // Log what was parsed
    console.log('Parsed result:', {
      hasTestTypes: !!result.testTypes,
      testTypesLength: Array.isArray(result.testTypes) ? result.testTypes.length : 0,
      hasPersonalCharacteristics: !!result.personalCharacteristics,
      personalCharacteristicsLength: Array.isArray(result.personalCharacteristics) ? result.personalCharacteristics.length : 0,
    })

    // Validate we got the essential fields
    if (!result.id) {
      console.error('Missing identifier in parsed data!')
    }
    if (!result.position) {
      console.error('Missing position title in parsed data!')
    }
    if (!result.testTypes || (Array.isArray(result.testTypes) && result.testTypes.length === 0)) {
      console.warn('No test types found - check if "Formy overenia - písomná časť výberového konania" label exists on page')
    }
    if (!result.personalCharacteristics || (Array.isArray(result.personalCharacteristics) && result.personalCharacteristics.length === 0)) {
      console.warn('No personal characteristics found - check if "Požadované schopnosti a osobnostné vlastnosti" label exists on page')
    }

    // Map to procedure fields
    const mappedData = {
      identifier: result.id as string,
      title: result.position as string,
      procedureType: result.type as string,
      organizationalUnit: result.organizationalUnit as string,
      civilServiceSector: result.civilServiceSector as string,
      positionTitle: result.position as string,
      serviceType: result.serviceType as string,
      numberOfPositions: result.vacancies as number || 1,
      testTypes: result.testTypes as string[] || [],
      personalCharacteristics: result.personalCharacteristics as string[] || [],
    }

    console.log('Returning mapped data with', mappedData.testTypes.length, 'test types and', mappedData.personalCharacteristics.length, 'characteristics')

    return mappedData
  }
  catch (error) {
    console.error('Error parsing CISSS URL:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to parse CISSS URL',
    })
  }
})
