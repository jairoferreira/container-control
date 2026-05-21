import React, { createContext, useCallback, useContext, useState } from "react";

export interface AuthUser {
  nome: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loginMotorista: (nome: string, pin: string, pins: Record<string, string>) => boolean;
  loginAdmin: (pin: string, adminPin: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const loginMotorista = useCallback(
    (nome: string, pin: string, pins: Record<string, string>): boolean => {
      // PIN padrão "0000" para motoristas sem PIN cadastrado
      const stored = pins[nome] ?? "0000";
      if (pin === stored) {
        setUser({ nome, isAdmin: false });
        return true;
      }
      return false;
    },
    []
  );

  const loginAdmin = useCallback(
    (pin: string, adminPin: string): boolean => {
      if (pin === adminPin) {
        setUser({ nome: "Administrador", isAdmin: true });
        return true;
      }
      return false;
    },
    []
  );

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, loginMotorista, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
