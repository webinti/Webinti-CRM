import {
  pgTable, text, timestamp, boolean, integer,
  numeric, uuid, pgEnum, serial
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Enums ───────────────────────────────────────────────────────────────────
export const currencyEnum = pgEnum('currency', ['EUR', 'USD'])
export const quoteStatusEnum = pgEnum('quote_status', ['draft', 'sent', 'accepted', 'refused', 'expired'])
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue', 'cancelled'])
export const paymentMethodEnum = pgEnum('payment_method', ['stripe', 'bank_transfer', 'cash', 'check'])
export const addressTypeEnum = pgEnum('address_type', ['billing', 'shipping', 'headquarters'])
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
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Addresses ────────────────────────────────────────────────────────────────
export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  type: addressTypeEnum('type').notNull().default('billing'),
  label: text('label'), // ex: "Siège social", "Entrepôt Lyon"
  street: text('street').notNull(),
  city: text('city').notNull(),
  postalCode: text('postal_code').notNull(),
  country: text('country').notNull().default('France'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
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
  addresses: many(addresses),
  quotes: many(quotes),
  invoices: many(invoices),
}))

export const contactsRelations = relations(contacts, ({ one }) => ({
  company: one(companies, { fields: [contacts.companyId], references: [companies.id] }),
}))

export const addressesRelations = relations(addresses, ({ one }) => ({
  company: one(companies, { fields: [addresses.companyId], references: [companies.id] }),
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
