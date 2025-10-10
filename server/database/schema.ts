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

// Roles table (predefined: owner, admin, member, viewer)
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  permissions: jsonb('permissions').notNull().default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  avatar: text('avatar').notNull(),
  currentOrganizationId: integer('current_organization_id').references(() => organizations.id),
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
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  createdById: integer('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => DateTime.now().toJSDate()),
})

// Procedures table (scoped to organization)
export const procedures = pgTable('procedures', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('active'), // active, closed, draft
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  createdById: integer('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => DateTime.now().toJSDate()),
})

// Contenders table (scoped to procedure)
export const contenders = pgTable('contenders', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  status: text('status').notNull().default('pending'), // pending, approved, rejected, interviewing
  notes: text('notes'),
  procedureId: integer('procedure_id').notNull().references(() => procedures.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => DateTime.now().toJSDate()),
})

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
}))

export const rolesRelations = relations(roles, ({ many }) => ({
  userOrganizations: many(userOrganizations),
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
}))

export const contendersRelations = relations(contenders, ({ one, many }) => ({
  procedure: one(procedures, {
    fields: [contenders.procedureId],
    references: [procedures.id],
  }),
  files: many(contenderFiles),
  examScores: many(examScores),
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
