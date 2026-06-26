import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createApi } from "@/lib/cautelaApi";

// URL do backend compartilhado entre motoristas e administrador.
// Definida em build/start time via EXPO_PUBLIC_API_URL.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export type StatusCautela = "pendente" | "concluida" | "cancelada";
export type SaidaChegada = "saindo" | "chegando";
export type TipoVeiculo = "CAVALINHO ATRELADO" | "SÓ O CAVALINHO" | "CAMINHÃO" | "CARRO PEQUENO" | "";
export type SituacaoCarreta = "CARREGADO" | "VAZIO" | "";
export type TipoCarreta = "CONTÊINER" | "CARRETA ABERTA" | "";
export type ModeloConteiner = "20 DC" | "20 TK" | "40 FR" | "40 HC" | "";

export interface Cautela {
  id: string;
  numeroControle: string;
  dataMov: string;
  status: StatusCautela;
  createdAt: string;

  // Direção
  saidaChegada: SaidaChegada;

  // Rota
  origem: string;
  destino: string;
  operacao: string;

  // Veículo
  motorista: string;
  placaCavalo: string;
  odometro: string;
  tipo: TipoVeiculo;

  // Carreta Dianteira
  placaCarreta: string;
  situacao: SituacaoCarreta;
  cliente: string;
  tipoCarreta: TipoCarreta;
  conteiner: string;
  modeloConteiner: ModeloConteiner;
  lacre: string;

  // Bitrem
  temBitrem: boolean;
  placaCarretaTraseira: string;
  situacaoTraseira: SituacaoCarreta;
  clienteTraseira: string;
  tipoCarretaTraseira: TipoCarreta;
  conteinerTraseiro: string;
  modeloConteinerTraseiro: ModeloConteiner;
  lacreTraseiro: string;

  // Observações
  obs: string;

  // Finalização (preenchidos na entrega)
  destinoData?: string;     // DD/MM/AAAA
  destinoHorario?: string;  // HH:MM
  recebedor?: string;
  rg?: string;

  // Controle de sync
  _synced?: boolean;
}

interface SyncState {
  status: "idle" | "syncing" | "ok" | "error";
  lastSync: string | null;
  pendentes: number;
}

interface CautelaContextType {
  cauteias: Cautela[];
  addCautela: (data: Omit<Cautela, "id" | "createdAt" | "status" | "_synced">) => void;
  updateStatus: (id: string, status: StatusCautela) => void;
  finalizarCautela: (id: string, dados: { destinoData: string; destinoHorario: string; recebedor: string; rg: string }) => void;
  getCautela: (id: string) => Cautela | undefined;
  sincronizar: (apiUrl: string) => Promise<{ ok: number; erros: number }>;
  syncState: SyncState;
  stats: {
    total: number;
    pendentes: number;
    concluidas: number;
    canceladas: number;
  };
}

const STORAGE_KEY = "@cautelas_v2";

const CautelaContext = createContext<CautelaContextType | null>(null);

export function CautelaProvider({ children }: { children: React.ReactNode }) {
  const [cauteias, setCauteias] = useState<Cautela[]>([]);
  const [syncState, setSyncState] = useState<SyncState>({
    status: "idle",
    lastSync: null,
    pendentes: 0,
  });

  const apiRef = useRef(createApi(API_URL));

  const persist = useCallback((list: Cautela[]) => {
    setCauteias(list);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, []);

  const persistRef = useRef(persist);
  persistRef.current = persist;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      let local: Cautela[] = [];
      if (raw) {
        try {
          local = JSON.parse(raw);
        } catch {
          local = [];
        }
      }
      setCauteias(local);
      syncComServidor(local);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Busca cautelas do servidor (outros dispositivos) e envia as pendentes locais.
  const syncComServidor = useCallback(async (base: Cautela[]) => {
    setSyncState((s) => ({ ...s, status: "syncing" }));
    const api = apiRef.current;
    let working = base;

    const existeNoServidor = new Set<string>();

    try {
      const remotas = await api.listar();
      const remotaMap = new Map(remotas.map((c) => [c.id, c]));

      const merged = working
        .map((local) => {
          if (remotaMap.has(local.id)) {
            existeNoServidor.add(local.id);
            const r = remotaMap.get(local.id)!;
            remotaMap.delete(local.id);
            // Há edição local pendente: mantém o valor local (será reenviado abaixo).
            if (!local._synced) return local;
            return { ...r, _synced: true } as Cautela;
          }
          // Já estava sincronizado antes e não existe mais no servidor: foi
          // removido remotamente (ex: em outro dispositivo) — remove localmente.
          if (local._synced) return null;
          return local;
        })
        .filter((c): c is Cautela => c !== null);
      for (const remota of remotaMap.values()) {
        merged.push({ ...remota, _synced: true });
      }
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      working = merged;
      persistRef.current(merged);
    } catch {
      // Sem conexão com o servidor — segue só com os dados locais.
    }

    const pendentes = working.filter((c) => !c._synced);
    for (const cautela of pendentes) {
      try {
        if (existeNoServidor.has(cautela.id)) {
          const { id, createdAt, _synced, ...fields } = cautela;
          await api.atualizar(id, fields);
        } else {
          await api.criar(cautela);
        }
        working = working.map((c) => (c.id === cautela.id ? { ...c, _synced: true } : c));
      } catch {
        // continua tentando os próximos; este fica pendente
      }
    }
    persistRef.current(working);

    setSyncState({
      status: "ok",
      lastSync: new Date().toLocaleString("pt-BR"),
      pendentes: working.filter((c) => !c._synced).length,
    });
  }, []);

  // Conta pendentes de sync sempre que cauteias mudam
  useEffect(() => {
    const pendentes = cauteias.filter((c) => !c._synced).length;
    setSyncState((s) => ({ ...s, pendentes }));
  }, [cauteias]);

  // Marca um item como sincronizado após confirmação do servidor.
  const marcarSincronizado = useCallback((id: string) => {
    setCauteias((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, _synced: true } : c));
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addCautela = useCallback(
    (data: Omit<Cautela, "id" | "createdAt" | "status" | "_synced">) => {
      const newItem: Cautela = {
        ...data,
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        status: "pendente",
        createdAt: new Date().toISOString(),
        _synced: false,
      };
      persist([newItem, ...cauteias]);
      apiRef.current
        .criar(newItem)
        .then(() => marcarSincronizado(newItem.id))
        .catch(() => {});
    },
    [cauteias, persist, marcarSincronizado]
  );

  const updateStatus = useCallback(
    (id: string, status: StatusCautela) => {
      persist(
        cauteias.map((c) => (c.id === id ? { ...c, status, _synced: false } : c))
      );
      apiRef.current
        .atualizarStatus(id, status)
        .then(() => marcarSincronizado(id))
        .catch(() => {});
    },
    [cauteias, persist, marcarSincronizado]
  );

  const finalizarCautela = useCallback(
    (id: string, dados: { destinoData: string; destinoHorario: string; recebedor: string; rg: string }) => {
      persist(
        cauteias.map((c) =>
          c.id === id
            ? { ...c, status: "concluida" as StatusCautela, ...dados, _synced: false }
            : c
        )
      );
      apiRef.current
        .atualizar(id, { ...dados, status: "concluida" })
        .then(() => marcarSincronizado(id))
        .catch(() => {});
    },
    [cauteias, persist, marcarSincronizado]
  );

  const getCautela = useCallback(
    (id: string) => cauteias.find((c) => c.id === id),
    [cauteias]
  );

  // Sincroniza cautelas não sincronizadas com a API
  const sincronizar = useCallback(
    async (apiUrl: string): Promise<{ ok: number; erros: number }> => {
      setSyncState((s) => ({ ...s, status: "syncing" }));
      const api = createApi(apiUrl);
      let ok = 0;
      let erros = 0;

      // 1. Tenta buscar todas as cautelas do servidor e mescla
      try {
        const remotas = await api.listar();
        const remotaMap = new Map(remotas.map((c) => [c.id, c]));

        // Merge: servidor tem prioridade para itens já sincronizados
        const merged = cauteias.map((local) => {
          if (remotaMap.has(local.id)) {
            remotaMap.delete(local.id); // já existe, não duplica
            return { ...remotaMap.get(local.id)!, _synced: true } as Cautela;
          }
          return local;
        });

        // Adiciona itens que só existem no servidor (de outros dispositivos)
        for (const remota of remotaMap.values()) {
          merged.push({ ...remota, _synced: true });
        }

        // Ordena por data de criação (mais recente primeiro)
        merged.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        persist(merged);
      } catch {
        // Sem conexão — continua tentando só o envio
      }

      // 2. Envia locais não sincronizados
      const naoSincronizadas = cauteias.filter((c) => !c._synced);
      for (const cautela of naoSincronizadas) {
        try {
          await api.criar(cautela);
          ok++;
        } catch {
          erros++;
        }
      }

      // 3. Atualiza status de sincronizadas
      if (ok > 0) {
        const idsSincronizados = new Set(naoSincronizadas.slice(0, ok).map((c) => c.id));
        persist(
          cauteias.map((c) =>
            idsSincronizados.has(c.id) ? { ...c, _synced: true } : c
          )
        );
      }

      const newStatus = erros === 0 ? "ok" : "error";
      setSyncState({
        status: newStatus,
        lastSync: new Date().toLocaleString("pt-BR"),
        pendentes: cauteias.filter((c) => !c._synced).length - ok,
      });

      return { ok, erros };
    },
    [cauteias, persist]
  );

  const stats = {
    total: cauteias.length,
    pendentes: cauteias.filter((c) => c.status === "pendente").length,
    concluidas: cauteias.filter((c) => c.status === "concluida").length,
    canceladas: cauteias.filter((c) => c.status === "cancelada").length,
  };

  return (
    <CautelaContext.Provider
      value={{ cauteias, addCautela, updateStatus, finalizarCautela, getCautela, sincronizar, syncState, stats }}
    >
      {children}
    </CautelaContext.Provider>
  );
}

export function useCautela() {
  const ctx = useContext(CautelaContext);
  if (!ctx) throw new Error("useCautela must be used inside CautelaProvider");
  return ctx;
}
