import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const motoristasTable = pgTable("motoristas", {
  id: text("id").primaryKey(),
  matricula: text("matricula").notNull().unique(),
  nome: text("nome").notNull(),
  cnh: text("cnh").notNull().default(""),
  telefone: text("telefone").notNull().default(""),
  placa: text("placa").notNull().default(""),
  ativo: boolean("ativo").notNull().default(true),

  // Nunca expor pinHash para o cliente — só usado para comparação no servidor.
  pinHash: text("pin_hash").notNull(),

  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema de leitura pública: nunca inclui pinHash/lockout (uso interno do servidor).
export const motoristaPublicSchema = createSelectSchema(motoristasTable).omit({
  pinHash: true,
  failedAttempts: true,
  lockedUntil: true,
});

export const insertMotoristaSchema = createInsertSchema(motoristasTable)
  .omit({ id: true, pinHash: true, failedAttempts: true, lockedUntil: true, createdAt: true })
  .extend({
    matricula: z.string().optional(),
    pin: z.string().regex(/^\d{4}$/, "PIN deve ter exatamente 4 dígitos"),
  });

export const updateMotoristaSchema = insertMotoristaSchema.partial();

export const loginMotoristaSchema = z.object({
  matricula: z.string().min(1),
  pin: z.string().regex(/^\d{4}$/),
});

export type Motorista = typeof motoristasTable.$inferSelect;
export type MotoristaPublic = z.infer<typeof motoristaPublicSchema>;
