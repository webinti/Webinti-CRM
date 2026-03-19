import {
  pgTable, text, timestamp, boolean, integer,
  numeric, uuid, pgEnum
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Enums ───────────────────────────────────────────────────────────────────
export const currencyEnum = pgEnum('currency', ['EUR', 'USD'])
export const quoteStatusEnum = pgEnum('quote_status', ['draft', 'sent', 'accepted', 'refused', 'expired'])
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue', 'cancelled'])
export const paymentMethodEnum = pgEnum('payment_method', ['stripe', 'bank_transfer', 'cash', 'check'])

export const contactRoleEnum = pgEnum('contact_role', ['billing', 'technical', 'commercial', 'general', 'other'])

// ─── Better-Auth Tables ───────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ─── Companies (Sociétés) ─────────────────────────────────────────────────────
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  siret: text('siret'),
  vatNumber: text('vat_number'),
  email: text('email'),
  phone: text('phone'),
  website: text('website'),
  notes: text('notes'),
  // Adresse de facturation (unique)
  addressStreet: text('address_street'),
  addressCity: text('address_city'),
  addressPostalCode: text('address_postal_code'),
  addressCountry: text('address_country').default('France'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Contacts ─────────────────────────────────────────────────────────────────
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  role: contactRoleEnum('role').default('general'),
  jobTitle: text('job_title'),
  isPrimary: boolean('is_primary').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Leads (Prospection) ──────────────────────────────────────────────────────
export const leadStatusEnum = pgEnum('lead_status', ['new', 'contacted', 'qualified', 'converted', 'rejected'])

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Données entreprise (API gouv)
  siren: text('siren').unique(),
  siret: text('siret'),
  companyName: text('company_name').notNull(),
  legalForm: text('legal_form'),
  nafCode: text('naf_code'),
  nafLabel: text('naf_label'),
  // Adresse
  address: text('address'),
  postalCode: text('postal_code'),
  city: text('city'),
  department: text('department'),
  // Contact
  email: text('email'),
  phone: text('phone'),
  website: text('website'),
  // Analyse site web
  hasWebsite: boolean('has_website').default(false),
  websiteScore: integer('website_score'), // 0-100
  websiteIssues: text('website_issues').array(), // ['no_https', 'not_mobile', 'slow', 'old_design']
  websiteScreenshot: text('website_screenshot'), // URL image
  // Enrichissement
  decisionMaker: text('decision_maker'),
  decisionMakerEmail: text('decision_maker_email'),
  decisionMakerLinkedin: text('decision_maker_linkedin'),
  // Statut
  status: leadStatusEnum('status').notNull().default('new'),
  priority: integer('priority').default(50), // 0-100
  notes: text('notes'),
  // Source
  source: text('source').notNull().default('api_gouv'), // api_gouv, scraping, manual
  sourceDetails: text('source_details'), // JSON avec params de recherche
  // Relations
  convertedToCompanyId: uuid('converted_to_company_id').references(() => companies.id, { onDelete: 'set null' }),
  // Métadonnées
  contactedAt: timestamp('contacted_at'),
  convertedAt: timestamp('converted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Products/Services Catalog ────────────────────────────────────────────────
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  unit: text('unit').default('forfait'),
  currency: currencyEnum('currency').notNull().default('EUR'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Quotes (Devis) ───────────────────────────────────────────────────────────
export const quotes = pgTable('quotes', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: text('number').notNull().unique(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  status: quoteStatusEnum('status').notNull().default('draft'),
  currency: currencyEnum('currency').notNull().default('EUR'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull().default('0'),
  validUntil: timestamp('valid_until'),
  subject: text('subject'),
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  signedAt: timestamp('signed_at'),
  signatureData: text('signature_data'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const quoteItems = pgTable('quote_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  quoteId: uuid('quote_id').notNull().references(() => quotes.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  unit: text('unit').default('forfait'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

// ─── Invoices (Factures) ──────────────────────────────────────────────────────
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: text('number').notNull().unique(),
  quoteId: uuid('quote_id').references(() => quotes.id, { onDelete: 'set null' }),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  status: invoiceStatusEnum('status').notNull().default('draft'),
  currency: currencyEnum('currency').notNull().default('EUR'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull().default('0'),
  dueDate: timestamp('due_date'),
  subject: text('subject'),
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  stripePaymentLinkId: text('stripe_payment_link_id'),
  stripePaymentLinkUrl: text('stripe_payment_link_url'),
  paidAt: timestamp('paid_at'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  unit: text('unit').default('forfait'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

// ─── Deposit Invoices (Factures d'acompte) ────────────────────────────────────
export const depositInvoices = pgTable('deposit_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: text('number').notNull().unique(),
  quoteId: uuid('quote_id').references(() => quotes.id, { onDelete: 'set null' }),
  invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'set null' }),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  status: invoiceStatusEnum('status').notNull().default('draft'),
  currency: currencyEnum('currency').notNull().default('EUR'),
  percentage: numeric('percentage', { precision: 5, scale: 2 }).notNull().default('30'),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp('due_date'),
  notes: text('notes'),
  stripePaymentLinkId: text('stripe_payment_link_id'),
  stripePaymentLinkUrl: text('stripe_payment_link_url'),
  paidAt: timestamp('paid_at'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Payments ─────────────────────────────────────────────────────────────────
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'set null' }),
  depositInvoiceId: uuid('deposit_invoice_id').references(() => depositInvoices.id, { onDelete: 'set null' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum('currency').notNull().default('EUR'),
  method: paymentMethodEnum('method').notNull(),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  reference: text('reference'),
  paidAt: timestamp('paid_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── AI Agents ────────────────────────────────────────────────────────────────
export const agentStatusEnum = pgEnum('agent_status', ['active', 'idle', 'offline', 'error'])

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  role: text('role').notNull(), // 'developer', 'designer', 'analyst', etc.
  avatar: text('avatar'),
  status: agentStatusEnum('status').notNull().default('idle'),
  description: text('description'),
  capabilities: text('capabilities').array(), // ['code', 'design', 'data', 'writing']
  lastSeenAt: timestamp('last_seen_at'),
  totalTasks: integer('total_tasks').notNull().default(0),
  successfulTasks: integer('successful_tasks').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Activity Log ─────────────────────────────────────────────────────────────
export const activityTypeEnum = pgEnum('activity_type', [
  'code_change', 'deploy', 'review', 'bug_fix', 'feature_add', 
  'data_update', 'config_change', 'test_run', 'merge', 'comment'
])

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'set null' }),
  type: activityTypeEnum('type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  entityType: text('entity_type'), // 'company', 'contact', 'quote', 'invoice', 'lead', etc.
  entityId: text('entity_id'),
  metadata: text('metadata'), // JSON string for extra data
  status: text('status').default('success'), // success, failed, pending
  duration: integer('duration'), // in seconds
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── App Settings ─────────────────────────────────────────────────────────────
export const settings = pgTable('settings', {
  id: text('id').primaryKey().default('default'),
  companyName: text('company_name').notNull().default('Webinti'),
  ownerName: text('owner_name').notNull().default(''),
  email: text('email').notNull().default(''),
  phone: text('phone'),
  address: text('address'),
  siret: text('siret'),
  // Banking
  iban: text('iban'),
  bic: text('bic'),
  bankName: text('bank_name'),
  // Numbering
  quotePrefix: text('quote_prefix').notNull().default('DEV'),
  invoicePrefix: text('invoice_prefix').notNull().default('FAC'),
  depositPrefix: text('deposit_prefix').notNull().default('ACP'),
  quoteCounter: integer('quote_counter').notNull().default(1),
  invoiceCounter: integer('invoice_counter').notNull().default(1),
  depositCounter: integer('deposit_counter').notNull().default(1),
  // Legal
  legalMention: text('legal_mention').notNull().default('TVA non applicable, art. 293 B du CGI'),
  paymentTermsDays: integer('payment_terms_days').notNull().default(30),
  // Logo
  logoUrl: text('logo_url'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Relations ────────────────────────────────────────────────────────────────
export const companiesRelations = relations(companies, ({ many }) => ({
  contacts: many(contacts),
  quotes: many(quotes),
  invoices: many(invoices),
}))

export const contactsRelations = relations(contacts, ({ one }) => ({
  company: one(companies, { fields: [contacts.companyId], references: [companies.id] }),
}))

export const leadsRelations = relations(leads, ({ one }) => ({
  convertedToCompany: one(companies, { fields: [leads.convertedToCompanyId], references: [companies.id] }),
}))

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  company: one(companies, { fields: [quotes.companyId], references: [companies.id] }),
  contact: one(contacts, { fields: [quotes.contactId], references: [contacts.id] }),
  items: many(quoteItems),
  invoices: many(invoices),
  depositInvoices: many(depositInvoices),
}))

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, { fields: [quoteItems.quoteId], references: [quotes.id] }),
  product: one(products, { fields: [quoteItems.productId], references: [products.id] }),
}))

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  company: one(companies, { fields: [invoices.companyId], references: [companies.id] }),
  contact: one(contacts, { fields: [invoices.contactId], references: [contacts.id] }),
  quote: one(quotes, { fields: [invoices.quoteId], references: [quotes.id] }),
  items: many(invoiceItems),
  payments: many(payments),
}))

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceItems.invoiceId], references: [invoices.id] }),
  product: one(products, { fields: [invoiceItems.productId], references: [products.id] }),
}))

export const depositInvoicesRelations = relations(depositInvoices, ({ one }) => ({
  company: one(companies, { fields: [depositInvoices.companyId], references: [companies.id] }),
  contact: one(contacts, { fields: [depositInvoices.contactId], references: [contacts.id] }),
  quote: one(quotes, { fields: [depositInvoices.quoteId], references: [quotes.id] }),
  invoice: one(invoices, { fields: [depositInvoices.invoiceId], references: [invoices.id] }),
}))

export const agentsRelations = relations(agents, ({ many }) => ({
  activities: many(activities),
}))

export const activitiesRelations = relations(activities, ({ one }) => ({
  agent: one(agents, { fields: [activities.agentId], references: [agents.id] }),
}))
