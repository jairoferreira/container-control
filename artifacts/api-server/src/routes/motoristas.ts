import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import {
  db,
  motoristasTable,
  appSettingsTable,
  insertMotoristaSchema,
  updateMotoristaSchema,
} from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

function toPublic(m: typeof motoristasTable.$inferSelect) {
  const { pinHash, failedAttempts, lockedUntil, ...pub } = m;
  return pub;
}

// Gera a próxima matrícula sequencial no formato THB001, THB002, ...
async function gerarMatricula(): Promise<string> {
  const [updated] = await db
    .update(appSettingsTable)
    .set({ matriculaSeq: sql`${appSettingsTable.matriculaSeq} + 1` })
    .where(eq(appSettingsTable.id, "main"))
    .returning({ seq: appSettingsTable.matriculaSeq });
  return `THB${String(updated.seq).padStart(3, "0")}`;
}

router.get("/motoristas", async (_req, res, next) => {
  try {
    const motoristas = await db.select().from(motoristasTable).orderBy(motoristasTable.nome);
    res.json(motoristas.map(toPublic));
  } catch (err) {
    next(err);
  }
});

router.post("/motoristas", requireAdmin, async (req, res, next) => {
  try {
    const parsed = insertMotoristaSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { pin, ...fields } = parsed.data;
    const matricula = fields.matricula?.trim() || (await gerarMatricula());
    const pinHash = await bcrypt.hash(pin, 10);

    const [motorista] = await db
      .insert(motoristasTable)
      .values({ ...fields, matricula: matricula.toUpperCase(), id: randomUUID(), pinHash })
      .returning();

    res.status(201).json(toPublic(motorista));
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "Matrícula já cadastrada." });
      return;
    }
    next(err);
  }
});

router.patch("/motoristas/:id", requireAdmin, async (req, res, next) => {
  try {
    const parsed = updateMotoristaSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { pin, ...fields } = parsed.data;
    const updateValues: Record<string, unknown> = { ...fields };
    if (fields.matricula) updateValues.matricula = fields.matricula.toUpperCase();
    if (pin) updateValues.pinHash = await bcrypt.hash(pin, 10);

    const [motorista] = await db
      .update(motoristasTable)
      .set(updateValues)
      .where(eq(motoristasTable.id, String(req.params.id)))
      .returning();

    if (!motorista) {
      res.status(404).json({ error: "Motorista não encontrado." });
      return;
    }
    res.json(toPublic(motorista));
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "Matrícula já cadastrada." });
      return;
    }
    next(err);
  }
});

router.delete("/motoristas/:id", requireAdmin, async (req, res, next) => {
  try {
    const [motorista] = await db
      .delete(motoristasTable)
      .where(eq(motoristasTable.id, String(req.params.id)))
      .returning();
    if (!motorista) {
      res.status(404).json({ error: "Motorista não encontrado." });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
