import * as cheerio from 'cheerio'

type Value = string | number | string[]

interface Rule {
  label: string
  transform?: (value: string) => Value
}

const PAGE_URL
  = 'https://cisss.gov.sk/vyberove-konania/detail/3ed5892c-8bfc-421c-b714-9b27249e2465'

const rules: Record<string, Rule> = {
  id: {
    label: 'Identifikátor výberového konania',
  },
  type: {
    label: 'Druh výberoveho konania',
  },
  department: {
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

const response = await fetch(PAGE_URL)
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

labelValuePairs.forEach(({ label, value }, _) => {
  Object.keys(rules).forEach((key) => {
    if (rules[key]!.label === label) {
      const transformedValue = rules[key]!.transform
        ? rules[key]!.transform!(value)
        : value

      result[key] = transformedValue
    }
  })
})

console.log({ result })
