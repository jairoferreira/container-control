import { Router } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import {
  db,
  motoristasTable,
  appSettingsTable,
  loginMotoristaSchema,
} from "@workspace/db";

const router = Router();

const LOCK_AFTER_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

// Limita tentativas de login por IP, independente do resultado (defesa contra força bruta distribuída).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
});

function isLocked(lockedUntil: Date | null): boolean {
  return !!lockedUntil && lockedUntil.getTime() > Date.now();
}

router.post("/auth/motorista", loginLimiter, async (req, res, next) => {
  try {
    const parsed = loginMotoristaSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Matrícula e PIN (4 dígitos) são obrigatórios." });
      return;
    }
    const { matricula, pin } = parsed.data;

    const [motorista] = await db
      .select()
      .from(motoristasTable)
      .where(eq(motoristasTable.matricula, matricula.toUpperCase().trim()));

    // Resposta genérica em todos os casos de falha — não revela se a matrícula existe.
    const invalido = () => res.status(401).json({ error: "Matrícula ou PIN inválidos." });

    if (!motorista || !motorista.ativo) {
      invalido();
      return;
    }

    if (isLocked(motorista.lockedUntil)) {
      const minutos = Math.ceil((motorista.lockedUntil!.getTime() - Date.now()) / 60000);
      res.status(423).json({ error: `Conta temporariamente bloqueada. Tente novamente em ${minutos} min.` });
      return;
    }

    const ok = await bcrypt.compare(pin, motorista.pinHash);

    if (!ok) {
      const attempts = motorista.failedAttempts + 1;
      const lockedUntil =
        attempts >= LOCK_AFTER_ATTEMPTS
          ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
          : null;
      await db
        .update(motoristasTable)
        .set({ failedAttempts: attempts, lockedUntil })
        .where(eq(motoristasTable.id, motorista.id));
      invalido();
      return;
    }

    // Sucesso: zera tentativas e devolve só os dados públicos do motorista.
    await db
      .update(motoristasTable)
      .set({ failedAttempts: 0, lockedUntil: null })
      .where(eq(motoristasTable.id, motorista.id));

    res.json({
      id: motorista.id,
      matricula: motorista.matricula,
      nome: motorista.nome,
      placa: motorista.placa,
    });
  } catch (err) {
    next(err);
  }
});

// Acesso restrito (gesto secreto no app): aceita o PIN do admin OU o PIN de
// consulta (perfil só-leitura, ex: secretária) — o servidor identifica qual
// é qual e devolve o papel correspondente. Tentativas erradas de ambos
// compartilham o mesmo bloqueio (não dá pra distinguir intenção do atacante).
router.post("/auth/admin", loginLimiter, async (req, res, next) => {
  try {
    const pin = typeof req.body?.pin === "string" ? req.body.pin : "";
    if (!/^\d{4,6}$/.test(pin)) {
      res.status(400).json({ error: "PIN inválido." });
      return;
    }

    const [settings] = await db.select().from(appSettingsTable).where(eq(appSettingsTable.id, "main"));
    if (!settings) {
      res.status(500).json({ error: "Configuração do sistema não encontrada." });
      return;
    }

    const invalido = () => res.status(401).json({ error: "PIN inválido." });

    if (isLocked(settings.adminLockedUntil)) {
      const minutos = Math.ceil((settings.adminLockedUntil!.getTime() - Date.now()) / 60000);
      res.status(423).json({ error: `Bloqueado temporariamente. Tente novamente em ${minutos} min.` });
      return;
    }

    const okAdmin = await bcrypt.compare(pin, settings.adminPinHash);
    const okConsulta =
      !okAdmin && settings.consultaPinHash ? await bcrypt.compare(pin, settings.consultaPinHash) : false;

    if (!okAdmin && !okConsulta) {
      const attempts = settings.adminFailedAttempts + 1;
      const lockedUntil =
        attempts >= LOCK_AFTER_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null;
      await db
        .update(appSettingsTable)
        .set({ adminFailedAttempts: attempts, adminLockedUntil: lockedUntil })
        .where(eq(appSettingsTable.id, "main"));
      invalido();
      return;
    }

    await db
      .update(appSettingsTable)
      .set({ adminFailedAttempts: 0, adminLockedUntil: null })
      .where(eq(appSettingsTable.id, "main"));

    res.json({ ok: true, role: okAdmin ? "admin" : "consulta" });
  } catch (err) {
    next(err);
  }
});

// Permite ao admin (já autenticado no app) trocar o próprio PIN.
router.post("/auth/admin/pin", async (req, res, next) => {
  try {
    const currentPin = typeof req.body?.currentPin === "string" ? req.body.currentPin : "";
    const newPin = typeof req.body?.newPin === "string" ? req.body.newPin : "";
    if (!/^\d{6}$/.test(currentPin) || !/^\d{6}$/.test(newPin)) {
      res.status(400).json({ error: "PIN deve ter 6 dígitos." });
      return;
    }

    const [settings] = await db.select().from(appSettingsTable).where(eq(appSettingsTable.id, "main"));
    if (!settings || !(await bcrypt.compare(currentPin, settings.adminPinHash))) {
      res.status(401).json({ error: "PIN atual incorreto." });
      return;
    }

    const newHash = await bcrypt.hash(newPin, 10);
    await db
      .update(appSettingsTable)
      .set({ adminPinHash: newHash })
      .where(eq(appSettingsTable.id, "main"));

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Admin define/troca o PIN de consulta (perfil só-leitura). Não exige o PIN
// de consulta atual — o admin tem autoridade pra redefini-lo livremente.
router.post("/auth/consulta/pin", async (req, res, next) => {
  try {
    const adminPin = typeof req.body?.adminPin === "string" ? req.body.adminPin : "";
    const newPin = typeof req.body?.newPin === "string" ? req.body.newPin : "";
    if (!/^\d{6}$/.test(adminPin) || !/^\d{4,6}$/.test(newPin)) {
      res.status(400).json({ error: "PIN inválido." });
      return;
    }

    const [settings] = await db.select().from(appSettingsTable).where(eq(appSettingsTable.id, "main"));
    if (!settings || !(await bcrypt.compare(adminPin, settings.adminPinHash))) {
      res.status(401).json({ error: "PIN do administrador incorreto." });
      return;
    }

    const newHash = await bcrypt.hash(newPin, 10);
    await db
      .update(appSettingsTable)
      .set({ consultaPinHash: newHash, consultaFailedAttempts: 0, consultaLockedUntil: null })
      .where(eq(appSettingsTable.id, "main"));

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
