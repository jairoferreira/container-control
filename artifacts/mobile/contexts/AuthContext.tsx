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
  loginAt: number; // timestamp ms — usado para expirar sessão em 12 h
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  /** Chama após validação bem-sucedida na LoginScreen */
  loginMotorista: (nome: string) => void;
  /** Chama após validação bem-sucedida na LoginScreen */
  loginAdmin: () => void;
  logout: () => void;
}

const SESSION_KEY      = "@auth_session_v1";
const SESSION_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 horas

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Restaurar sessão ao iniciar / F5 ────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then(async (raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as AuthUser;

        // Expirar sessões com mais de 12 horas
        if (saved.loginAt && Date.now() - saved.loginAt > SESSION_EXPIRY_MS) {
          await AsyncStorage.removeItem(SESSION_KEY);
          return; // não restaura — força novo login
        }

        setUser(saved);
      })
      .catch(() => {
        // Sessão corrompida — ignora, exige novo login
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Helpers internos ─────────────────────────────────────────────────────
  const saveSession = useCallback((u: AuthUser) => {
    setUser(u);
    AsyncStorage.setItem(SESSION_KEY, JSON.stringify(u)).catch(() => {});
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
  }, []);

  // ── Login motorista ───────────────────────────────────────────────────────
  // A validação (matrícula + PIN) ocorre na LoginScreen antes de chamar isto.
  const loginMotorista = useCallback(
    (nome: string) => {
      saveSession({ nome, isAdmin: false, loginAt: Date.now() });
    },
    [saveSession]
  );

  // ── Login admin ───────────────────────────────────────────────────────────
  const loginAdmin = useCallback(() => {
    saveSession({ nome: "Administrador", isAdmin: true, loginAt: Date.now() });
  }, [saveSession]);

  // ── Logout ────────────────────────────────────────────────────────────────
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
