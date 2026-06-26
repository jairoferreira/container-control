import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db, cautelasTable, insertCautelaSchema, updateStatusSchema } from "@workspace/db";

const router = Router();

router.get("/cautelas", async (_req, res, next) => {
  try {
    const cautelas = await db
      .select()
      .from(cautelasTable)
      .orderBy(desc(cautelasTable.createdAt));
    res.json(cautelas);
  } catch (err) {
    next(err);
  }
});

router.get("/cautelas/:id", async (req, res, next) => {
  try {
    const [cautela] = await db
      .select()
      .from(cautelasTable)
      .where(eq(cautelasTable.id, req.params.id));
    if (!cautela) {
      res.status(404).json({ error: "Cautela não encontrada" });
      return;
    }
    res.json(cautela);
  } catch (err) {
    next(err);
  }
});

router.post("/cautelas", async (req, res, next) => {
  try {
    const parsed = insertCautelaSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const [cautela] = await db
      .insert(cautelasTable)
      .values({ ...parsed.data, id: parsed.data.id ?? randomUUID() })
      .onConflictDoNothing()
      .returning();
    res.status(201).json(cautela ?? parsed.data);
  } catch (err) {
    next(err);
  }
});

router.patch("/cautelas/:id/status", async (req, res, next) => {
  try {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const [cautela] = await db
      .update(cautelasTable)
      .set({ status: parsed.data.status })
      .where(eq(cautelasTable.id, req.params.id))
      .returning();
    if (!cautela) {
      res.status(404).json({ error: "Cautela não encontrada" });
      return;
    }
    res.json(cautela);
  } catch (err) {
    next(err);
  }
});

router.patch("/cautelas/:id", async (req, res, next) => {
  try {
    const parsed = insertCautelaSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { id: _ignored, ...fields } = parsed.data;
    const [cautela] = await db
      .update(cautelasTable)
      .set(fields)
      .where(eq(cautelasTable.id, req.params.id))
      .returning();
    if (!cautela) {
      res.status(404).json({ error: "Cautela não encontrada" });
      return;
    }
    res.json(cautela);
  } catch (err) {
    next(err);
  }
});

router.delete("/cautelas/:id", async (req, res, next) => {
  try {
    const [cautela] = await db
      .delete(cautelasTable)
      .where(eq(cautelasTable.id, req.params.id))
      .returning();
    if (!cautela) {
      res.status(404).json({ error: "Cautela não encontrada" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
