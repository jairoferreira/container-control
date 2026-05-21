import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

// ── Tipo rico de Motorista (inspirado no projeto Vue Operação Logística) ────
export interface Motorista {
  id: string;
  nome: string;
  cnh: string;
  telefone: string;
  placa: string;    // placa do cavalo habitual (opcional)
  ativo: boolean;
  pin: string;      // PIN de 4 dígitos para login (padrão "0000")
}

// ── Helper: nomes dos motoristas ativos (para dropdowns) ────────────────────
export function motoristaNomes(lista: Motorista[]): string[] {
  return lista.filter((m) => m.ativo).map((m) => m.nome);
}

// ── Seed: 17 motoristas do Google Form ──────────────────────────────────────
const DEFAULT_MOTORISTAS: Motorista[] = [
  "ALEKSANDRO FERREIRA DE OLIVEIRA",
  "AMIRALDO BRANCHES OLIVEIRA",
  "ARGEMIRO SAMPAIO XAVIER",
  "CLAUDEMIR SANTOS DA SILVA",
  "DEMACI DIAS DOS SANTOS",
  "EDILSON DE LUCENA CORREIA",
  "FRANCISCO DAS CHAGAS NEVES",
  "JOSE EVERARDO NOBRE",
  "JOSE HUMBERTO DE OLIVEIRA",
  "JOSÉ UBIRATAN RODRIGUES",
  "JÚLIO CESAR SILVA OLIVEIRA",
  "MAURÍCIO MIRANDA DA SILVA",
  "PAULO ALVES SILVA",
  "PAULO LONGEN",
  "PEDRO DA SILVA DAMASCENO",
  "RONALD DOS ANJOS SOUZA",
  "SANDRO LUIZ DA SILVA OLIVEIRA",
].map((nome, i) => ({
  id: `seed_${i}`,
  nome,
  cnh: "",
  telefone: "",
  placa: "",
  ativo: true,
  pin: "0000",
}));

const DEFAULT_PLACAS = [
  "FYS1140", "IIT5F54", "JXG4463", "JXM7918", "JXO7053",
  "NOJ2358", "NOJ4403", "NOP0408", "NOU4153", "NOW3D40",
  "NOX0579", "OAJ1855", "OAM1512", "OAM1522", "OCD0744",
  "PHF6227", "PHU3G94", "PHY4A96",
];

// ── Settings ─────────────────────────────────────────────────────────────────
export interface Settings {
  motoristas: Motorista[];
  placasCavalo: string[];
  apiUrl: string;
  syncEnabled: boolean;
  adminPin: string;
}

interface SettingsContextType {
  settings: Settings;
  // Motoristas (CRUD rico)
  addMotorista: (m: Omit<Motorista, "id">) => void;
  updateMotorista: (id: string, fields: Partial<Omit<Motorista, "id">>) => void;
  removeMotorista: (id: string) => void;
  // Placas
  addPlaca: (placa: string) => void;
  removePlaca: (placa: string) => void;
  // API / Sync
  setApiUrl: (url: string) => void;
  setSyncEnabled: (enabled: boolean) => void;
  // Admin PIN
  setAdminPin: (pin: string) => void;
  // Reset
  resetToDefaults: () => void;
}

// Bump para v2: estrutura de motoristas mudou de string[] para Motorista[]
const STORAGE_KEY = "@settings_v2";

const DEFAULT_SETTINGS: Settings = {
  motoristas: DEFAULT_MOTORISTAS,
  placasCavalo: DEFAULT_PLACAS,
  apiUrl: "http://localhost:3000",
  syncEnabled: false,
  adminPin: "123456",
};

// ── Migração: converte formato antigo (string[]) se necessário ───────────────
function migrate(raw: any): Settings {
  const base = { ...DEFAULT_SETTINGS, ...raw };

  // Se motoristas ainda é array de strings (formato v1), converte
  if (
    Array.isArray(base.motoristas) &&
    base.motoristas.length > 0 &&
    typeof base.motoristas[0] === "string"
  ) {
    const oldPins: Record<string, string> = raw.motoristaPins ?? {};
    base.motoristas = (base.motoristas as string[]).map((nome, i) => ({
      id: `migrated_${i}`,
      nome,
      cnh: "",
      telefone: "",
      placa: "",
      ativo: true,
      pin: oldPins[nome] ?? "0000",
    }));
  }

  return base as Settings;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setSettings(migrate(JSON.parse(raw)));
        } catch {
          setSettings(DEFAULT_SETTINGS);
        }
      }
    });
  }, []);

  const save = useCallback((next: Settings) => {
    setSettings(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  // ── Motoristas ─────────────────────────────────────────────────────────
  const addMotorista = useCallback(
    (m: Omit<Motorista, "id">) => {
      const nome = m.nome.trim().toUpperCase();
      if (!nome) return;
      if (settings.motoristas.some((x) => x.nome.toUpperCase() === nome)) return;
      const novo: Motorista = {
        ...m,
        nome,
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        pin: m.pin || "0000",
      };
      const lista = [...settings.motoristas, novo].sort((a, b) =>
        a.nome.localeCompare(b.nome)
      );
      save({ ...settings, motoristas: lista });
    },
    [settings, save]
  );

  const updateMotorista = useCallback(
    (id: string, fields: Partial<Omit<Motorista, "id">>) => {
      save({
        ...settings,
        motoristas: settings.motoristas.map((m) =>
          m.id === id ? { ...m, ...fields } : m
        ),
      });
    },
    [settings, save]
  );

  const removeMotorista = useCallback(
    (id: string) => {
      save({
        ...settings,
        motoristas: settings.motoristas.filter((m) => m.id !== id),
      });
    },
    [settings, save]
  );

  // ── Placas ──────────────────────────────────────────────────────────────
  const addPlaca = useCallback(
    (placa: string) => {
      const p = placa.trim().toUpperCase();
      if (!p || settings.placasCavalo.includes(p)) return;
      save({ ...settings, placasCavalo: [...settings.placasCavalo, p].sort() });
    },
    [settings, save]
  );

  const removePlaca = useCallback(
    (placa: string) => {
      save({ ...settings, placasCavalo: settings.placasCavalo.filter((pl) => pl !== placa) });
    },
    [settings, save]
  );

  // ── API ──────────────────────────────────────────────────────────────────
  const setApiUrl = useCallback(
    (url: string) => save({ ...settings, apiUrl: url.trim() }),
    [settings, save]
  );

  const setSyncEnabled = useCallback(
    (enabled: boolean) => save({ ...settings, syncEnabled: enabled }),
    [settings, save]
  );

  // ── Admin PIN ────────────────────────────────────────────────────────────
  const setAdminPin = useCallback(
    (pin: string) => save({ ...settings, adminPin: pin }),
    [settings, save]
  );

  const resetToDefaults = useCallback(() => save(DEFAULT_SETTINGS), [save]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        addMotorista,
        updateMotorista,
        removeMotorista,
        addPlaca,
        removePlaca,
        setApiUrl,
        setSyncEnabled,
        setAdminPin,
        resetToDefaults,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}
