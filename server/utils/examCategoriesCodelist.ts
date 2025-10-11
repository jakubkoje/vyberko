export interface ExamCategoryConstraints {
  minQuestions?: number
  maxQuestions?: number
  timeLimit?: number // in minutes
  pointsPerQuestion?: number
  passingScore?: number
  positionLevel?: 'employee' | 'leading_employee' // zamestnanec vs vedúci zamestnanec
  languageLevel?: string // For foreign language tests (A1, A2, B1, B2, C1, C2)
}

export interface ExamCategory {
  value: string
  label: string
  description: string
  order: number
  constraints?: ExamCategoryConstraints[]
}

export const examCategoriesCodelist: ExamCategory[] = [
  {
    value: 'professional_knowledge',
    label: 'Odborný test',
    description: 'Test odborných znalostí pre výberové konanie',
    order: 1,
    constraints: [
      {
        positionLevel: 'employee',
        minQuestions: 10,
        maxQuestions: 20,
        timeLimit: 20,
        pointsPerQuestion: 1,
        passingScore: 12,
      },
      {
        positionLevel: 'leading_employee',
        minQuestions: 15,
        maxQuestions: 30,
        timeLimit: 30,
        pointsPerQuestion: 1,
        passingScore: 18,
      },
    ],
  },
  {
    value: 'general_knowledge',
    label: 'Všeobecný test',
    description: 'Test všeobecných znalostí',
    order: 2,
    constraints: [
      {
        positionLevel: 'employee',
        minQuestions: 20,
        maxQuestions: 20,
        timeLimit: 20,
        pointsPerQuestion: 0.5,
        passingScore: 6,
      },
      {
        positionLevel: 'leading_employee',
        minQuestions: 30,
        maxQuestions: 30,
        timeLimit: 30,
        pointsPerQuestion: 0.5,
        passingScore: 9,
      },
    ],
  },
  {
    value: 'state_language',
    label: 'Test zo štátneho jazyka',
    description: 'Test znalosti štátneho jazyka',
    order: 3,
    constraints: [
      {
        minQuestions: 5,
        maxQuestions: 5,
        timeLimit: 5,
        pointsPerQuestion: 1,
        passingScore: 3,
      },
    ],
  },
  {
    value: 'foreign_language',
    label: 'Test z cudzieho jazyka',
    description: 'Test znalosti cudzieho jazyka podľa úrovne',
    order: 4,
    constraints: [
      {
        languageLevel: 'A1',
        minQuestions: 30,
        maxQuestions: 30,
        timeLimit: 30,
        pointsPerQuestion: 0.5,
        passingScore: 9,
      },
      {
        languageLevel: 'A2',
        minQuestions: 30,
        maxQuestions: 30,
        timeLimit: 30,
        pointsPerQuestion: 0.5,
        passingScore: 9,
      },
      {
        languageLevel: 'B1',
        minQuestions: 40,
        maxQuestions: 40,
        timeLimit: 40,
        pointsPerQuestion: 0.5,
        passingScore: 12,
      },
      {
        languageLevel: 'B2',
        minQuestions: 40,
        maxQuestions: 40,
        timeLimit: 40,
        pointsPerQuestion: 0.5,
        passingScore: 14,
      },
      {
        languageLevel: 'C1',
        minQuestions: 40,
        maxQuestions: 40,
        timeLimit: 40,
        pointsPerQuestion: 0.5,
        passingScore: 14,
      },
      {
        languageLevel: 'C2',
        minQuestions: 40,
        maxQuestions: 40,
        timeLimit: 40,
        pointsPerQuestion: 0.5,
        passingScore: 14,
      },
    ],
  },
  {
    value: 'it_skills',
    label: 'Test z práce s informačnými technológiami',
    description: 'Test znalostí práce s IT',
    order: 5,
    constraints: [
      {
        minQuestions: 5,
        maxQuestions: 10,
        // No fixed time limit specified in requirements
        passingScore: 6,
      },
    ],
  },
]
