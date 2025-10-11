export interface ExamCategory {
  value: string
  label: string
  description: string
  order: number
}

export const examCategoriesCodelist: ExamCategory[] = [
  {
    value: 'written_exam',
    label: 'Written Exam',
    description: 'Written tests and assessments',
    order: 1,
  },
  {
    value: 'personality_test',
    label: 'Personality Test',
    description: 'Personality and behavioral assessments',
    order: 2,
  },
  {
    value: 'technical_assessment',
    label: 'Technical Assessment',
    description: 'Technical skills and knowledge tests',
    order: 3,
  },
  {
    value: 'language_test',
    label: 'Language Test',
    description: 'Language proficiency assessments',
    order: 4,
  },
  {
    value: 'aptitude_test',
    label: 'Aptitude Test',
    description: 'General aptitude and cognitive ability tests',
    order: 5,
  },
]
