import { API_URL } from "@/lib/apiConfig";

export class AuthApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = body?.error ?? `Erro inesperado (HTTP ${res.status})`;
    throw new AuthApiError(typeof message === "string" ? message : "Erro inesperado.", res.status);
  }
  return body as T;
}

export interface MotoristaPublico {
  id: string;
  matricula: string;
  nome: string;
  cnh: string;
  telefone: string;
  placa: string;
  ativo: boolean;
  createdAt: string;
}

export const authApi = {
  loginMotorista(matricula: string, pin: string) {
    return request<{ id: string; matricula: string; nome: string; placa: string }>(
      "/auth/motorista",
      { method: "POST", body: JSON.stringify({ matricula, pin }) }
    );
  },

  // Aceita PIN de admin OU de consulta — o servidor devolve qual papel bateu.
  loginRestrito(pin: string) {
    return request<{ ok: true; role: "admin" | "consulta" }>("/auth/admin", {
      method: "POST",
      body: JSON.stringify({ pin }),
    });
  },

  trocarPinAdmin(currentPin: string, newPin: string) {
    return request<{ ok: true }>("/auth/admin/pin", {
      method: "POST",
      body: JSON.stringify({ currentPin, newPin }),
    });
  },

  definirPinConsulta(adminPin: string, newPin: string) {
    return request<{ ok: true }>("/auth/consulta/pin", {
      method: "POST",
      body: JSON.stringify({ adminPin, newPin }),
    });
  },
};

export const motoristasApi = {
  listar() {
    return request<MotoristaPublico[]>("/motoristas");
  },

  criar(
    adminPin: string,
    data: { matricula?: string; nome: string; cnh?: string; telefone?: string; placa?: string; ativo?: boolean; pin: string }
  ) {
    return request<MotoristaPublico>("/motoristas", {
      method: "POST",
      headers: { "x-admin-pin": adminPin },
      body: JSON.stringify(data),
    });
  },

  atualizar(
    adminPin: string,
    id: string,
    data: Partial<{ matricula: string; nome: string; cnh: string; telefone: string; placa: string; ativo: boolean; pin: string }>
  ) {
    return request<MotoristaPublico>(`/motoristas/${id}`, {
      method: "PATCH",
      headers: { "x-admin-pin": adminPin },
      body: JSON.stringify(data),
    });
  },

  remover(adminPin: string, id: string) {
    return request<void>(`/motoristas/${id}`, {
      method: "DELETE",
      headers: { "x-admin-pin": adminPin },
    });
  },
};

export const placasApi = {
  listar() {
    return request<string[]>("/placas");
  },

  criar(adminPin: string, placa: string) {
    return request<string>("/placas", {
      method: "POST",
      headers: { "x-admin-pin": adminPin },
      body: JSON.stringify({ placa }),
    });
  },

  remover(adminPin: string, placa: string) {
    return request<void>(`/placas/${encodeURIComponent(placa)}`, {
      method: "DELETE",
      headers: { "x-admin-pin": adminPin },
    });
  },
};
