import { pgTable, text, timestamp, serial, jsonb, integer, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { DateTime } from 'luxon'

// Organizations table
export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => DateTime.now().toJSDate()),
})

// Roles table for VK system (admin, subject_expert, commission_member, commission_chair, candidate)
// Permissions are inferred from the role name at runtime, not stored in database
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // admin, subject_expert, commission_member, commission_chair, candidate
  description: text('description'),
  requires2FA: integer('requires_2fa').notNull().default(0), // 1 for admin, 0 for others
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Written Exam Categories (6 types as per VK requirements)
export const writtenExamCategories = pgTable('written_exam_categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(), // professional_knowledge, general_knowledge, state_language, foreign_language, it_skills, abilities_personality
  nameSk: text('name_sk').notNull(), // Slovak name
  nameEn: text('name_en').notNull(), // English name
  description: text('description'),
  isActive: integer('is_active').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Oral Exam Categories (10 personality traits as per VK requirements)
export const oralExamCategories = pgTable('oral_exam_categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(), // self_confidence, conscientiousness_reliability, independence, etc.
  nameSk: text('name_sk').notNull(), // Slovak name
  nameEn: text('name_en').notNull(), // English name
  description: text('description'),
  minRating: integer('min_rating').notNull().default(1),
  maxRating: integer('max_rating').notNull().default(5),
  isActive: integer('is_active').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Question Battery (predefined questions for oral exams)
export const questionBattery = pgTable('question_battery', {
  id: serial('id').primaryKey(),
  categorySlug: text('category_slug').notNull(), // References oralExamCategories.slug
  questionSk: text('question_sk').notNull(), // Question in Slovak
  questionEn: text('question_en').notNull(), // Question in English
  order: integer('order').notNull().default(0),
  isActive: integer('is_active').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Survey Responses (test attempts and answers)
export const surveyResponses = pgTable('survey_responses', {
  id: serial('id').primaryKey(),
  contenderId: integer('contender_id').notNull().references(() => contenders.id, { onDelete: 'cascade' }),
  surveyId: integer('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
  procedureId: integer('procedure_id').notNull().references(() => procedures.id, { onDelete: 'cascade' }),
  responseData: jsonb('response_data').notNull(), // SurveyJS result data with answers
  score: integer('score'), // Calculated score if applicable
  isPassed: integer('is_passed'), // 1 = passed, 0 = failed, null = not graded
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }), // When the test was submitted
  timeSpentSeconds: integer('time_spent_seconds'), // How long they took
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => DateTime.now().toJSDate()),
})

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password'), // Nullable for Keycloak users
  avatar: text('avatar').notNull(),
  currentOrganizationId: integer('current_organization_id').references(() => organizations.id),

  // Keycloak integration fields
  keycloakId: text('keycloak_id').unique(), // Keycloak user ID (sub claim)
  authProvider: text('auth_provider').notNull().default('local'), // 'keycloak' or 'local'

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => DateTime.now().toJSDate()),
})

// User-Organization relationship with roles (many-to-many)
export const userOrganizations = pgTable('user_organizations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  roleId: integer('role_id').notNull().references(() => roles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  userOrgIdx: uniqueIndex('user_org_idx').on(table.userId, table.organizationId),
}))

// Surveys table (scoped to organization)
export const surveys = pgTable('surveys', {
  id: serial('id').primaryKey(),
  title: text('title').notNull().default('Untitled Survey'),
  jsonData: jsonb('json_data').notNull(),
  category: text('category').notNull(), // e.g., 'written_exam', 'personality_test', 'technical_assessment'
  status: text('status').notNull().default('draft'), // draft, pending_approval, approved, rejected
  rejectionReason: text('rejection_reason'), // Reason for rejection (if status is rejected)
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  createdById: integer('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => DateTime.now().toJSDate()),
})

// Procedures table (VK - Výberové konanie, scoped to organization)
export const procedures = pgTable('procedures', {
  id: serial('id').primaryKey(),
  identifier: text('identifier').notNull().unique(), // e.g., VK/2025/1234
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('draft'), // draft, active, testing, evaluating, completed, cancelled

  // VK Header fields
  procedureType: text('procedure_type'), // e.g., 'širšie vnútorné výberové konanie'
  organizationalUnit: text('organizational_unit'), // e.g., 'odbor implementácie OKP'
  civilServiceSector: text('civil_service_sector'), // e.g., '1.03 – Medzinárodná spolupráca'
  positionTitle: text('position_title'), // e.g., 'hlavný štátny radca'
  serviceType: text('service_type'), // e.g., 'stála štátna služba'
  procedureDate: timestamp('procedure_date', { withTimezone: true }),
  numberOfPositions: integer('number_of_positions').notNull().default(1),

  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  createdById: integer('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => DateTime.now().toJSDate()),
})

// Procedure Assignments table (links staff to procedures they can work on)
export const procedureAssignments = pgTable('procedure_assignments', {
  id: serial('id').primaryKey(),
  procedureId: integer('procedure_id').notNull().references(() => procedures.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: integer('role_id').notNull().references(() => roles.id), // subject_expert, commission_member, etc.
  status: text('status').notNull().default('pending'), // pending (invited, not logged in), accepted (logged in and active)
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }), // When user first logged in after assignment
}, table => ({
  procedureUserIdx: uniqueIndex('procedure_user_idx').on(table.procedureId, table.userId),
}))

// Contenders table (Uchádzači - candidates in procedure)
export const contenders = pgTable('contenders', {
  id: serial('id').primaryKey(),
  cisIdentifier: text('cis_identifier').notNull(), // Identifier from CIS ŠS system (used as login)
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  status: text('status').notNull().default('registered'), // registered, testing, passed_written, failed_written, evaluating, passed, failed, selected
  notes: text('notes'),
  userId: integer('user_id').references(() => users.id), // Link to user account (temporary credentials)
  procedureId: integer('procedure_id').notNull().references(() => procedures.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => DateTime.now().toJSDate()),
}, table => ({
  contenderCisIdx: uniqueIndex('contender_cis_procedure_idx').on(table.cisIdentifier, table.procedureId),
}))

// Contender Files table (documents submitted by contenders)
export const contenderFiles = pgTable('contender_files', {
  id: serial('id').primaryKey(),
  contenderId: integer('contender_id').notNull().references(() => contenders.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(), // e.g., 'application/pdf', 'image/jpeg'
  fileSize: integer('file_size').notNull(), // in bytes
  fileUrl: text('file_url').notNull(), // Will be SharePoint URL in future
  sharepointId: text('sharepoint_id'), // For future SharePoint integration
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => DateTime.now().toJSDate()),
})

// Exam Criteria table (rating categories for oral exams, scoped to procedure)
export const examCriteria = pgTable('exam_criteria', {
  id: serial('id').primaryKey(),
  procedureId: integer('procedure_id').notNull().references(() => procedures.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // e.g., 'flexibility', 'communication'
  minRating: integer('min_rating').notNull().default(1),
  maxRating: integer('max_rating').notNull().default(5),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => DateTime.now().toJSDate()),
})

// Exam Scores table (stores ratings for each contender-criteria pair)
export const examScores = pgTable('exam_scores', {
  id: serial('id').primaryKey(),
  contenderId: integer('contender_id').notNull().references(() => contenders.id, { onDelete: 'cascade' }),
  criteriaId: integer('criteria_id').notNull().references(() => examCriteria.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(),
  evaluatedById: integer('evaluated_by_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => DateTime.now().toJSDate()),
}, table => ({
  contenderCriteriaIdx: uniqueIndex('contender_criteria_idx').on(table.contenderId, table.criteriaId),
}))

// Procedure Surveys table (links procedures to surveys with ordering)
// Each survey can only be assigned to one procedure (unique constraint on surveyId)
// Category is inherited from the survey itself
export const procedureSurveys = pgTable('procedure_surveys', {
  id: serial('id').primaryKey(),
  procedureId: integer('procedure_id').notNull().references(() => procedures.id, { onDelete: 'cascade' }),
  surveyId: integer('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
  order: integer('order').notNull().default(0), // Order within category

  // Test conditions/configuration
  timeLimit: integer('time_limit'), // Time limit in minutes
  totalPoints: integer('total_points'), // Total points for the test
  passingScore: integer('passing_score'), // Minimum score to pass

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => DateTime.now().toJSDate()),
}, table => ({
  surveyIdx: uniqueIndex('procedure_survey_idx').on(table.surveyId), // Each survey can only be in one procedure
}))

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  userOrganizations: many(userOrganizations),
  surveys: many(surveys),
  procedures: many(procedures),
}))

export const usersRelations = relations(users, ({ many, one }) => ({
  userOrganizations: many(userOrganizations),
  currentOrganization: one(organizations, {
    fields: [users.currentOrganizationId],
    references: [organizations.id],
  }),
  procedureAssignments: many(procedureAssignments),
}))

export const rolesRelations = relations(roles, ({ many }) => ({
  userOrganizations: many(userOrganizations),
  procedureAssignments: many(procedureAssignments),
}))

export const userOrganizationsRelations = relations(userOrganizations, ({ one }) => ({
  user: one(users, {
    fields: [userOrganizations.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [userOrganizations.organizationId],
    references: [organizations.id],
  }),
  role: one(roles, {
    fields: [userOrganizations.roleId],
    references: [roles.id],
  }),
}))

export const surveysRelations = relations(surveys, ({ one }) => ({
  organization: one(organizations, {
    fields: [surveys.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [surveys.createdById],
    references: [users.id],
  }),
  procedureSurvey: one(procedureSurveys, {
    fields: [surveys.id],
    references: [procedureSurveys.surveyId],
  }),
}))

export const proceduresRelations = relations(procedures, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [procedures.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [procedures.createdById],
    references: [users.id],
  }),
  contenders: many(contenders),
  examCriteria: many(examCriteria),
  procedureSurveys: many(procedureSurveys),
  procedureAssignments: many(procedureAssignments),
}))

export const procedureAssignmentsRelations = relations(procedureAssignments, ({ one }) => ({
  procedure: one(procedures, {
    fields: [procedureAssignments.procedureId],
    references: [procedures.id],
  }),
  user: one(users, {
    fields: [procedureAssignments.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [procedureAssignments.roleId],
    references: [roles.id],
  }),
}))

export const contendersRelations = relations(contenders, ({ one, many }) => ({
  procedure: one(procedures, {
    fields: [contenders.procedureId],
    references: [procedures.id],
  }),
  files: many(contenderFiles),
  examScores: many(examScores),
  surveyResponses: many(surveyResponses),
}))

export const contenderFilesRelations = relations(contenderFiles, ({ one }) => ({
  contender: one(contenders, {
    fields: [contenderFiles.contenderId],
    references: [contenders.id],
  }),
}))

export const examCriteriaRelations = relations(examCriteria, ({ one, many }) => ({
  procedure: one(procedures, {
    fields: [examCriteria.procedureId],
    references: [procedures.id],
  }),
  examScores: many(examScores),
}))

export const examScoresRelations = relations(examScores, ({ one }) => ({
  contender: one(contenders, {
    fields: [examScores.contenderId],
    references: [contenders.id],
  }),
  criteria: one(examCriteria, {
    fields: [examScores.criteriaId],
    references: [examCriteria.id],
  }),
  evaluatedBy: one(users, {
    fields: [examScores.evaluatedById],
    references: [users.id],
  }),
}))

export const procedureSurveysRelations = relations(procedureSurveys, ({ one }) => ({
  procedure: one(procedures, {
    fields: [procedureSurveys.procedureId],
    references: [procedures.id],
  }),
  survey: one(surveys, {
    fields: [procedureSurveys.surveyId],
    references: [surveys.id],
  }),
}))

export const writtenExamCategoriesRelations = relations(writtenExamCategories, ({ many }) => ({
  // Can be extended with relations to tests/surveys if needed
}))

export const oralExamCategoriesRelations = relations(oralExamCategories, ({ many }) => ({
  // Can be extended with relations to exam criteria if needed
  questions: many(questionBattery),
}))

export const questionBatteryRelations = relations(questionBattery, ({ one }) => ({
  // No direct relation needed, categorySlug is just a reference
}))

export const surveyResponsesRelations = relations(surveyResponses, ({ one }) => ({
  contender: one(contenders, {
    fields: [surveyResponses.contenderId],
    references: [contenders.id],
  }),
  survey: one(surveys, {
    fields: [surveyResponses.surveyId],
    references: [surveys.id],
  }),
  procedure: one(procedures, {
    fields: [surveyResponses.procedureId],
    references: [procedures.id],
  }),
}))
