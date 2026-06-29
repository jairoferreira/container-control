import { Router } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db, placasTable, insertPlacaSchema } from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

router.get("/placas", async (_req, res, next) => {
  try {
    const placas = await db.select().from(placasTable).orderBy(placasTable.placa);
    res.json(placas.map((p) => p.placa));
  } catch (err) {
    next(err);
  }
});

router.post("/placas", requireAdmin, async (req, res, next) => {
  try {
    const parsed = insertPlacaSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const placa = parsed.data.placa.toUpperCase().trim();
    const [created] = await db
      .insert(placasTable)
      .values({ id: randomUUID(), placa })
      .returning();
    res.status(201).json(created.placa);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "Placa já cadastrada." });
      return;
    }
    next(err);
  }
});

router.delete("/placas/:placa", requireAdmin, async (req, res, next) => {
  try {
    const [removed] = await db
      .delete(placasTable)
      .where(eq(placasTable.placa, String(req.params.placa).toUpperCase()))
      .returning();
    if (!removed) {
      res.status(404).json({ error: "Placa não encontrada." });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
