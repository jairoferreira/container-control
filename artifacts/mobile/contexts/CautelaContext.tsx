import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

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
}

interface CautelaContextType {
  cauteias: Cautela[];
  addCautela: (data: Omit<Cautela, "id" | "createdAt" | "status">) => void;
  updateStatus: (id: string, status: StatusCautela) => void;
  getCautela: (id: string) => Cautela | undefined;
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

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setCauteias(JSON.parse(raw));
        } catch {
          setCauteias([]);
        }
      }
    });
  }, []);

  const persist = useCallback((list: Cautela[]) => {
    setCauteias(list);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, []);

  const addCautela = useCallback(
    (data: Omit<Cautela, "id" | "createdAt" | "status">) => {
      const newItem: Cautela = {
        ...data,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
        status: "pendente",
        createdAt: new Date().toISOString(),
      };
      persist([newItem, ...cauteias]);
    },
    [cauteias, persist]
  );

  const updateStatus = useCallback(
    (id: string, status: StatusCautela) => {
      persist(cauteias.map((c) => (c.id === id ? { ...c, status } : c)));
    },
    [cauteias, persist]
  );

  const getCautela = useCallback(
    (id: string) => cauteias.find((c) => c.id === id),
    [cauteias]
  );

  const stats = {
    total: cauteias.length,
    pendentes: cauteias.filter((c) => c.status === "pendente").length,
    concluidas: cauteias.filter((c) => c.status === "concluida").length,
    canceladas: cauteias.filter((c) => c.status === "cancelada").length,
  };

  return (
    <CautelaContext.Provider value={{ cauteias, addCautela, updateStatus, getCautela, stats }}>
      {children}
    </CautelaContext.Provider>
  );
}

export function useCautela() {
  const ctx = useContext(CautelaContext);
  if (!ctx) throw new Error("useCautela must be used inside CautelaProvider");
  return ctx;
}
