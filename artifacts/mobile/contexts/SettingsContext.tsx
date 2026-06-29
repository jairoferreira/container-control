import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { motoristasApi, placasApi, type MotoristaPublico } from "@/lib/authApi";

// ── Tipo de Motorista (dados públicos — PIN nunca trafega para o cliente) ───
export type Motorista = MotoristaPublico;

// ── Helper: nomes dos motoristas ativos (para dropdowns) ────────────────────
export function motoristaNomes(lista: Motorista[]): string[] {
  return lista.filter((m) => m.ativo).map((m) => m.nome);
}

// ── Settings ─────────────────────────────────────────────────────────────────
export interface Settings {
  motoristas: Motorista[];
  placasCavalo: string[];
}

interface NovoMotoristaInput {
  matricula?: string;
  nome: string;
  cnh?: string;
  telefone?: string;
  placa?: string;
  ativo?: boolean;
  pin: string;
}

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  refresh: () => Promise<void>;
  // Motoristas — todas exigem o PIN do admin (autorizado pelo servidor)
  addMotorista: (adminPin: string, m: NovoMotoristaInput) => Promise<void>;
  updateMotorista: (
    adminPin: string,
    id: string,
    fields: Partial<NovoMotoristaInput>
  ) => Promise<void>;
  removeMotorista: (adminPin: string, id: string) => Promise<void>;
  // Placas
  addPlaca: (adminPin: string, placa: string) => Promise<void>;
  removePlaca: (adminPin: string, placa: string) => Promise<void>;
}

const CACHE_KEY = "@settings_cache_v3";

const EMPTY_SETTINGS: Settings = { motoristas: [], placasCavalo: [] };

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);

  const persistCache = useCallback((next: Settings) => {
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [motoristas, placasCavalo] = await Promise.all([
        motoristasApi.listar(),
        placasApi.listar(),
      ]);
      const next = { motoristas, placasCavalo };
      setSettings(next);
      persistCache(next);
    } catch {
      // Sem conexão — mantém o que já está carregado (cache local).
    }
  }, [persistCache]);

  useEffect(() => {
    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            setSettings(JSON.parse(raw));
          } catch {
            // ignora cache corrompido
          }
        }
      })
      .finally(() => {
        refresh().finally(() => setLoading(false));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Motoristas ─────────────────────────────────────────────────────────
  const addMotorista = useCallback(
    async (adminPin: string, m: NovoMotoristaInput) => {
      await motoristasApi.criar(adminPin, { ...m, nome: m.nome.trim().toUpperCase() });
      await refresh();
    },
    [refresh]
  );

  const updateMotorista = useCallback(
    async (adminPin: string, id: string, fields: Partial<NovoMotoristaInput>) => {
      await motoristasApi.atualizar(adminPin, id, fields);
      await refresh();
    },
    [refresh]
  );

  const removeMotorista = useCallback(
    async (adminPin: string, id: string) => {
      await motoristasApi.remover(adminPin, id);
      await refresh();
    },
    [refresh]
  );

  // ── Placas ──────────────────────────────────────────────────────────────
  const addPlaca = useCallback(
    async (adminPin: string, placa: string) => {
      await placasApi.criar(adminPin, placa.trim().toUpperCase());
      await refresh();
    },
    [refresh]
  );

  const removePlaca = useCallback(
    async (adminPin: string, placa: string) => {
      await placasApi.remover(adminPin, placa);
      await refresh();
    },
    [refresh]
  );

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        refresh,
        addMotorista,
        updateMotorista,
        removeMotorista,
        addPlaca,
        removePlaca,
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
