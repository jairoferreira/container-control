import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cautelasTable = pgTable("cautelas", {
  id: text("id").primaryKey(),
  numeroControle: text("numero_controle").notNull(),
  dataMov: text("data_mov").notNull().default(""),
  status: text("status", { enum: ["pendente", "concluida", "cancelada"] }).notNull().default("pendente"),
  createdAt: timestamp("created_at").defaultNow().notNull(),

  // Direção
  saidaChegada: text("saida_chegada", { enum: ["saindo", "chegando"] }).notNull().default("saindo"),

  // Rota
  origem: text("origem").notNull().default(""),
  destino: text("destino").notNull().default(""),
  operacao: text("operacao").notNull().default(""),

  // Veículo
  motorista: text("motorista").notNull().default(""),
  placaCavalo: text("placa_cavalo").notNull().default(""),
  odometro: text("odometro").notNull().default(""),
  tipo: text("tipo").notNull().default(""),

  // Carreta Dianteira
  placaCarreta: text("placa_carreta").notNull().default(""),
  situacao: text("situacao").notNull().default(""),
  cliente: text("cliente").notNull().default(""),
  tipoCarreta: text("tipo_carreta").notNull().default(""),
  conteiner: text("conteiner").notNull().default(""),
  modeloConteiner: text("modelo_conteiner").notNull().default(""),
  lacre: text("lacre").notNull().default(""),

  // Bitrem
  temBitrem: boolean("tem_bitrem").notNull().default(false),
  placaCarretaTraseira: text("placa_carreta_traseira").notNull().default(""),
  situacaoTraseira: text("situacao_traseira").notNull().default(""),
  clienteTraseira: text("cliente_traseira").notNull().default(""),
  tipoCarretaTraseira: text("tipo_carreta_traseira").notNull().default(""),
  conteinerTraseiro: text("conteiner_traseiro").notNull().default(""),
  modeloConteinerTraseiro: text("modelo_conteiner_traseiro").notNull().default(""),
  lacreTraseiro: text("lacre_traseiro").notNull().default(""),

  // Observações
  obs: text("obs").notNull().default(""),

  // Finalização (preenchidos na entrega)
  destinoData: text("destino_data").notNull().default(""),
  destinoHorario: text("destino_horario").notNull().default(""),
  recebedor: text("recebedor").notNull().default(""),
  rg: text("rg").notNull().default(""),
});

export const insertCautelaSchema = createInsertSchema(cautelasTable).extend({
  id: z.string().optional(),
});

export const selectCautelaSchema = createSelectSchema(cautelasTable);

export const updateStatusSchema = z.object({
  status: z.enum(["pendente", "concluida", "cancelada"]),
});

export type InsertCautela = z.infer<typeof insertCautelaSchema>;
export type Cautela = typeof cautelasTable.$inferSelect;
