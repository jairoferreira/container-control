import type { Cautela, StatusCautela } from "@/contexts/CautelaContext";

// Converte o Cautela do app para o formato aceito pela API
function toApiPayload(c: Omit<Cautela, "id" | "createdAt" | "status"> & { id?: string }) {
  return {
    id: c.id,
    numeroControle: c.numeroControle,
    dataMov: c.dataMov,
    saidaChegada: c.saidaChegada,
    origem: c.origem,
    destino: c.destino,
    operacao: c.operacao,
    motorista: c.motorista,
    placaCavalo: c.placaCavalo,
    odometro: c.odometro,
    tipo: c.tipo,
    placaCarreta: c.placaCarreta,
    situacao: c.situacao,
    cliente: c.cliente,
    tipoCarreta: c.tipoCarreta,
    conteiner: c.conteiner,
    modeloConteiner: c.modeloConteiner,
    lacre: c.lacre,
    temBitrem: c.temBitrem,
    placaCarretaTraseira: c.placaCarretaTraseira,
    situacaoTraseira: c.situacaoTraseira,
    clienteTraseira: c.clienteTraseira,
    tipoCarretaTraseira: c.tipoCarretaTraseira,
    conteinerTraseiro: c.conteinerTraseiro,
    modeloConteinerTraseiro: c.modeloConteinerTraseiro,
    lacreTraseiro: c.lacreTraseiro,
    obs: c.obs,
  };
}

export class CautelaApi {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string, timeout = 8000) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.timeout = timeout;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}/api${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers ?? {}),
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      if (res.status === 204) return undefined as T;
      return res.json() as Promise<T>;
    } finally {
      clearTimeout(timer);
    }
  }

  async listar(): Promise<Cautela[]> {
    return this.request<Cautela[]>("/cautelas");
  }

  async criar(cautela: Cautela): Promise<Cautela> {
    return this.request<Cautela>("/cautelas", {
      method: "POST",
      body: JSON.stringify(toApiPayload(cautela)),
    });
  }

  async atualizarStatus(id: string, status: StatusCautela): Promise<Cautela> {
    return this.request<Cautela>(`/cautelas/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async sincronizarLote(cautelas: Cautela[]): Promise<{ ok: number; erros: number }> {
    let ok = 0;
    let erros = 0;
    for (const c of cautelas) {
      try {
        await this.criar(c);
        ok++;
      } catch {
        erros++;
      }
    }
    return { ok, erros };
  }

  async testarConexao(): Promise<boolean> {
    try {
      await this.request("/health");
      return true;
    } catch {
      return false;
    }
  }
}

export function createApi(baseUrl: string): CautelaApi {
  return new CautelaApi(baseUrl);
}
