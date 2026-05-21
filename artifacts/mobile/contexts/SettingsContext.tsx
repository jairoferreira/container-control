import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

// Listas padrão vindas do Google Form do gestor
const DEFAULT_MOTORISTAS = [
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
];

const DEFAULT_PLACAS = [
  "FYS1140", "IIT5F54", "JXG4463", "JXM7918", "JXO7053",
  "NOJ2358", "NOJ4403", "NOP0408", "NOU4153", "NOW3D40",
  "NOX0579", "OAJ1855", "OAM1512", "OAM1522", "OCD0744",
  "PHF6227", "PHU3G94", "PHY4A96",
];

export interface Settings {
  motoristas: string[];
  placasCavalo: string[];
  apiUrl: string;
  syncEnabled: boolean;
}

interface SettingsContextType {
  settings: Settings;
  // Motoristas
  addMotorista: (nome: string) => void;
  removeMotorista: (nome: string) => void;
  // Placas
  addPlaca: (placa: string) => void;
  removePlaca: (placa: string) => void;
  // API
  setApiUrl: (url: string) => void;
  setSyncEnabled: (enabled: boolean) => void;
  // Reset
  resetToDefaults: () => void;
}

const STORAGE_KEY = "@settings_v1";

const DEFAULT_SETTINGS: Settings = {
  motoristas: DEFAULT_MOTORISTAS,
  placasCavalo: DEFAULT_PLACAS,
  apiUrl: "http://localhost:3000",
  syncEnabled: false,
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as Partial<Settings>;
          setSettings({ ...DEFAULT_SETTINGS, ...saved });
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

  const addMotorista = useCallback(
    (nome: string) => {
      const n = nome.trim().toUpperCase();
      if (!n || settings.motoristas.includes(n)) return;
      save({ ...settings, motoristas: [...settings.motoristas, n].sort() });
    },
    [settings, save]
  );

  const removeMotorista = useCallback(
    (nome: string) => {
      save({ ...settings, motoristas: settings.motoristas.filter((m) => m !== nome) });
    },
    [settings, save]
  );

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

  const setApiUrl = useCallback(
    (url: string) => save({ ...settings, apiUrl: url.trim() }),
    [settings, save]
  );

  const setSyncEnabled = useCallback(
    (enabled: boolean) => save({ ...settings, syncEnabled: enabled }),
    [settings, save]
  );

  const resetToDefaults = useCallback(() => save(DEFAULT_SETTINGS), [save]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        addMotorista,
        removeMotorista,
        addPlaca,
        removePlaca,
        setApiUrl,
        setSyncEnabled,
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
