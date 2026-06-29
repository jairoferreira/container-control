import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, appSettingsTable } from "@workspace/db";

// Protege rotas administrativas (cadastro de motoristas, placas, etc.).
// Exige o header x-admin-pin com o PIN de 6 dígitos do gestor, comparado
// via hash — o PIN nunca é armazenado nem comparado em texto puro.
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const pin = req.header("x-admin-pin") ?? "";
    if (!/^\d{6}$/.test(pin)) {
      res.status(401).json({ error: "Acesso administrativo requerido." });
      return;
    }

    const [settings] = await db.select().from(appSettingsTable).where(eq(appSettingsTable.id, "main"));
    if (!settings) {
      res.status(500).json({ error: "Configuração do sistema não encontrada." });
      return;
    }

    if (settings.adminLockedUntil && settings.adminLockedUntil.getTime() > Date.now()) {
      res.status(423).json({ error: "Acesso administrativo temporariamente bloqueado." });
      return;
    }

    const ok = await bcrypt.compare(pin, settings.adminPinHash);
    if (!ok) {
      res.status(401).json({ error: "Acesso administrativo requerido." });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}
