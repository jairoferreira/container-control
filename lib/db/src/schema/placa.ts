import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const placasTable = pgTable("placas", {
  id: text("id").primaryKey(),
  placa: text("placa").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPlacaSchema = createInsertSchema(placasTable).omit({
  id: true,
  createdAt: true,
});

export type Placa = typeof placasTable.$inferSelect;
