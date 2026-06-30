import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type AuthRole = "motorista" | "admin" | "consulta";

export interface AuthUser {
  nome: string;
  role: AuthRole;
  /** @deprecated use `role === "admin"` — mantido pra não quebrar telas existentes */
  isAdmin: boolean;
  loginAt: number; // timestamp ms — usado para expirar sessão em 12 h
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  /** PIN do admin guardado só em memória (nunca persistido) — usado para
   *  autorizar ações administrativas no servidor (cabeçalho x-admin-pin).
   *  Fica null após reabrir o app — nesse caso, ações administrativas
   *  exigem confirmar o PIN novamente. */
  adminPin: string | null;
  /** Chama após validação bem-sucedida na LoginScreen */
  loginMotorista: (nome: string) => void;
  /** Chama após o servidor confirmar o PIN restrito (admin ou consulta) */
  loginRestrito: (role: "admin" | "consulta", pin: string) => void;
  logout: () => void;
}

const SESSION_KEY      = "@auth_session_v1";
const SESSION_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 horas

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [adminPin, setAdminPin] = useState<string | null>(null);
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
    setAdminPin(null);
    AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
  }, []);

  // ── Login motorista ───────────────────────────────────────────────────────
  // A validação (matrícula + PIN) ocorre no servidor antes de chamar isto.
  const loginMotorista = useCallback(
    (nome: string) => {
      saveSession({ nome, role: "motorista", isAdmin: false, loginAt: Date.now() });
    },
    [saveSession]
  );

  // ── Login admin / consulta ──────────────────────────────────────────────
  // O PIN já foi validado pelo servidor; só guardamos em memória (nunca em
  // disco) quando é admin, pra autorizar próximas chamadas administrativas —
  // consulta não tem nenhuma ação que precise do PIN depois do login.
  const loginRestrito = useCallback(
    (role: "admin" | "consulta", pin: string) => {
      setAdminPin(role === "admin" ? pin : null);
      saveSession({
        nome: role === "admin" ? "Administrador" : "Consulta",
        role,
        isAdmin: role === "admin",
        loginAt: Date.now(),
      });
    },
    [saveSession]
  );

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => clearSession(), [clearSession]);

  return (
    <AuthContext.Provider
      value={{ user, loading, adminPin, loginMotorista, loginRestrito, logout }}
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
