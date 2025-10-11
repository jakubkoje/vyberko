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
    const response = await fetch(url)
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

    labelValuePairs.forEach(({ label, value }) => {
      Object.keys(rules).forEach((key) => {
        if (rules[key]!.label === label) {
          const transformedValue = rules[key]!.transform
            ? rules[key]!.transform!(value)
            : value

          result[key] = transformedValue
        }
      })
    })

    // Map to procedure fields
    return {
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
  }
  catch (error) {
    console.error('Error parsing CISSS URL:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to parse CISSS URL',
    })
  }
})
