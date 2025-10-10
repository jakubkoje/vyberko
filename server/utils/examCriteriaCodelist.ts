// Predefined exam criteria categories
export const EXAM_CRITERIA_CODELIST = [
  {
    value: 'technical_skills',
    label: 'Technical Skills',
    exampleQuestions: [
      'Can you explain your experience with [specific technology relevant to the role]?',
      'Walk me through how you would architect a solution for [technical challenge].',
      'Describe a complex technical problem you solved recently.',
      'How do you stay updated with the latest technologies in your field?',
    ],
  },
  {
    value: 'communication',
    label: 'Communication',
    exampleQuestions: [
      'How do you explain technical concepts to non-technical stakeholders?',
      'Describe a situation where you had to deliver difficult feedback.',
      'How do you handle disagreements with team members?',
      'Can you give an example of when you had to present a complex idea?',
    ],
  },
  {
    value: 'problem_solving',
    label: 'Problem Solving',
    exampleQuestions: [
      'Describe your approach to tackling a problem you\'ve never encountered before.',
      'Tell me about a time when you had to solve a problem with limited resources.',
      'How do you prioritize when faced with multiple urgent issues?',
      'Walk me through your debugging process when something goes wrong.',
    ],
  },
  {
    value: 'teamwork',
    label: 'Teamwork',
    exampleQuestions: [
      'Describe your ideal team environment.',
      'How do you contribute to team success beyond your individual tasks?',
      'Tell me about a time when you helped a struggling team member.',
      'How do you handle conflicting opinions within a team?',
    ],
  },
  {
    value: 'flexibility',
    label: 'Flexibility',
    exampleQuestions: [
      'Tell me about a time when priorities changed suddenly. How did you adapt?',
      'How do you handle working on tasks outside your comfort zone?',
      'Describe a situation where you had to learn something completely new.',
      'How do you manage multiple projects with competing deadlines?',
    ],
  },
  {
    value: 'leadership',
    label: 'Leadership',
    exampleQuestions: [
      'Describe your leadership style.',
      'Tell me about a time when you had to motivate a demotivated team.',
      'How do you handle delegation?',
      'Give an example of a difficult decision you had to make as a leader.',
    ],
  },
  {
    value: 'creativity',
    label: 'Creativity',
    exampleQuestions: [
      'Describe the most innovative solution you\'ve developed.',
      'How do you approach brainstorming and idea generation?',
      'Tell me about a time when you had to think outside the box.',
      'How do you balance creativity with practical constraints?',
    ],
  },
  {
    value: 'time_management',
    label: 'Time Management',
    exampleQuestions: [
      'How do you prioritize your daily tasks?',
      'Describe a time when you had to meet a tight deadline.',
      'What tools or techniques do you use to stay organized?',
      'How do you handle interruptions during focused work?',
    ],
  },
  {
    value: 'adaptability',
    label: 'Adaptability',
    exampleQuestions: [
      'Tell me about the biggest change you\'ve had to adapt to in your career.',
      'How do you respond to constructive criticism?',
      'Describe a situation where your initial approach didn\'t work. What did you do?',
      'How comfortable are you with ambiguity and uncertainty?',
    ],
  },
  {
    value: 'critical_thinking',
    label: 'Critical Thinking',
    exampleQuestions: [
      'How do you evaluate the validity of information or data?',
      'Describe a time when you had to make a decision with incomplete information.',
      'How do you identify assumptions in your work?',
      'Walk me through how you would analyze [specific scenario].',
    ],
  },
  {
    value: 'attention_to_detail',
    label: 'Attention to Detail',
    exampleQuestions: [
      'How do you ensure accuracy in your work?',
      'Describe a time when attention to detail was critical.',
      'What\'s your process for reviewing and quality-checking your work?',
      'Tell me about a mistake you caught before it became a problem.',
    ],
  },
  {
    value: 'work_ethic',
    label: 'Work Ethic',
    exampleQuestions: [
      'How do you maintain high standards in your work?',
      'Tell me about a time when you went above and beyond.',
      'How do you stay motivated during repetitive tasks?',
      'Describe your approach to meeting commitments.',
    ],
  },
  {
    value: 'professionalism',
    label: 'Professionalism',
    exampleQuestions: [
      'How do you handle confidential information?',
      'Describe a time when you had to maintain professionalism in a difficult situation.',
      'How do you represent your organization to external parties?',
      'What does professionalism mean to you?',
    ],
  },
  {
    value: 'motivation',
    label: 'Motivation',
    exampleQuestions: [
      'What drives you in your career?',
      'How do you stay motivated during challenging projects?',
      'What are your long-term career goals?',
      'Tell me about a project you were particularly passionate about.',
    ],
  },
  {
    value: 'learning_ability',
    label: 'Learning Ability',
    exampleQuestions: [
      'Describe the last new skill you learned. What was your approach?',
      'How do you prefer to learn new things?',
      'Tell me about a time when you had to quickly learn something unfamiliar.',
      'How do you apply what you learn to your work?',
    ],
  },
] as const

export type ExamCriteriaValue = typeof EXAM_CRITERIA_CODELIST[number]['value']

// Default rating range for all criteria
export const DEFAULT_MIN_RATING = 1
export const DEFAULT_MAX_RATING = 5

export function isValidCriteriaName(name: string): boolean {
  return EXAM_CRITERIA_CODELIST.some(c => c.value === name)
}

export function getCriteriaLabel(value: string): string | undefined {
  return EXAM_CRITERIA_CODELIST.find(c => c.value === value)?.label
}
