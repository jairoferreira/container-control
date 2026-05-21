/**
 * loginSecurity.ts
 * Gerencia tentativas de login e bloqueios temporários.
 * Dados persistem via AsyncStorage para sobreviver ao F5 / reinicialização.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@login_attempts_v1";
const MAX_ATTEMPTS = 3;

export const MOTORISTA_LOCKOUT_MS = 5 * 60 * 1000;   // 5 minutos
export const ADMIN_LOCKOUT_MS     = 10 * 60 * 1000;  // 10 minutos

// Chaves fixas (bloqueio por dispositivo, não por usuário — evita enumeração)
export const MOTORISTA_LOGIN_KEY = "MOTORISTA_LOGIN";
export const ADMIN_LOGIN_KEY     = "ADMIN_LOGIN";

interface AttemptRecord {
  count: number;
  lockedUntil: number | null; // timestamp ms ou null
}

type AttemptsMap = Record<string, AttemptRecord>;

// ── I/O ───────────────────────────────────────────────────────────────────────
async function readMap(): Promise<AttemptsMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AttemptsMap) : {};
  } catch {
    return {};
  }
}

async function writeMap(map: AttemptsMap): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

// ── API pública ───────────────────────────────────────────────────────────────

/** Verifica se a chave está bloqueada. Expira o bloqueio automaticamente. */
export async function checkLockout(
  key: string
): Promise<{ locked: boolean; remainingMs: number }> {
  const map = await readMap();
  const rec = map[key];
  if (!rec?.lockedUntil) return { locked: false, remainingMs: 0 };

  const remaining = rec.lockedUntil - Date.now();
  if (remaining <= 0) {
    // Bloqueio expirou — limpa
    delete map[key];
    await writeMap(map);
    return { locked: false, remainingMs: 0 };
  }
  return { locked: true, remainingMs: remaining };
}

/**
 * Registra uma tentativa falha.
 * Retorna o estado de bloqueio após o registro.
 */
export async function recordFailure(
  key: string,
  lockoutMs: number
): Promise<{ locked: boolean; remainingMs: number; attemptsLeft: number }> {
  const map = await readMap();
  const rec: AttemptRecord = map[key] ?? { count: 0, lockedUntil: null };

  // Se já estiver bloqueado, não incrementa mais
  if (rec.lockedUntil && rec.lockedUntil > Date.now()) {
    return { locked: true, remainingMs: rec.lockedUntil - Date.now(), attemptsLeft: 0 };
  }

  rec.count += 1;

  if (rec.count >= MAX_ATTEMPTS) {
    rec.lockedUntil = Date.now() + lockoutMs;
    rec.count = 0; // reinicia para o próximo ciclo pós-bloqueio
    map[key] = rec;
    await writeMap(map);
    return { locked: true, remainingMs: lockoutMs, attemptsLeft: 0 };
  }

  map[key] = rec;
  await writeMap(map);
  return {
    locked: false,
    remainingMs: 0,
    attemptsLeft: MAX_ATTEMPTS - rec.count,
  };
}

/** Limpa tentativas após login bem-sucedido. */
export async function clearAttempts(key: string): Promise<void> {
  const map = await readMap();
  delete map[key];
  await writeMap(map);
}
