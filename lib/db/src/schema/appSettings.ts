import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Tabela de uma única linha (id fixo "main") para configurações globais do app.
export const appSettingsTable = pgTable("app_settings", {
  id: text("id").primaryKey().default("main"),
  adminPinHash: text("admin_pin_hash").notNull(),
  adminFailedAttempts: integer("admin_failed_attempts").notNull().default(0),
  adminLockedUntil: timestamp("admin_locked_until"),
  matriculaSeq: integer("matricula_seq").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AppSettings = typeof appSettingsTable.$inferSelect;
