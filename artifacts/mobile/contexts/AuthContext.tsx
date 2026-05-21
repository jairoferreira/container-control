import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface AuthUser {
  nome: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  loginMotorista: (
    nome: string,
    pin: string,
    pins: Record<string, string>
  ) => boolean;
  loginAdmin: (pin: string, adminPin: string) => boolean;
  logout: () => void;
}

const SESSION_KEY = "@auth_session_v1";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // true enquanto carregamos a sessão salva do AsyncStorage
  const [loading, setLoading] = useState(true);

  // ── Restaurar sessão ao iniciar / recarregar ─────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw) as AuthUser;
          setUser(saved);
        }
      })
      .catch(() => {
        // sessão corrompida — ignora, exige login
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Helpers internos ─────────────────────────────────────────────────
  const saveSession = useCallback((u: AuthUser) => {
    setUser(u);
    AsyncStorage.setItem(SESSION_KEY, JSON.stringify(u)).catch(() => {});
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
  }, []);

  // ── Login motorista ──────────────────────────────────────────────────
  const loginMotorista = useCallback(
    (nome: string, pin: string, pins: Record<string, string>): boolean => {
      const stored = pins[nome] ?? "0000"; // padrão "0000" sem PIN cadastrado
      if (pin === stored) {
        saveSession({ nome, isAdmin: false });
        return true;
      }
      return false;
    },
    [saveSession]
  );

  // ── Login admin ──────────────────────────────────────────────────────
  const loginAdmin = useCallback(
    (pin: string, adminPin: string): boolean => {
      if (pin === adminPin) {
        saveSession({ nome: "Administrador", isAdmin: true });
        return true;
      }
      return false;
    },
    [saveSession]
  );

  // ── Logout ───────────────────────────────────────────────────────────
  const logout = useCallback(() => clearSession(), [clearSession]);

  return (
    <AuthContext.Provider
      value={{ user, loading, loginMotorista, loginAdmin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
