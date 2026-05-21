import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";
import type { Cautela } from "@/contexts/CautelaContext";

// Cabeçalhos idênticos à planilha do gestor
const HEADERS = [
  "Carimbo de data/hora",
  "Saindo ou Chegando",
  "Origem",
  "Destino",
  "Motorista",
  "Placa do Cavalo",
  "Odômetro",
  "Operação",
  "Tipo",
  "Placa da Carreta",
  "Situação",
  "Cliente",
  "Carreta Aberta ou Contêiner?",
  "Número do Contêiner",
  "Modelo do Contêiner",
  "Lacre",
  "Inserir dados de bitrem?",
  "Placa da Carreta Traseira",
  "Situação (Traseira)",
  "Cliente (Traseira)",
  "Carreta Aberta ou Contêiner? (Traseira)",
  "Contêiner da Traseira",
  "Modelo do Contêiner Traseira",
  "Lacre (Traseira)",
  "Observações",
  "Nº de Controle",
  "Status",
];

function esc(v: string | undefined | null): string {
  const s = (v ?? "").toString().trim();
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function cautelaToRow(c: Cautela): string {
  const ts = new Date(c.createdAt).toLocaleString("pt-BR");
  const dir = c.saidaChegada === "saindo" ? "Saindo" : "Chegando";
  const bitrem = c.temBitrem ? "SIM" : "NÃO";

  const cols = [
    ts,
    dir,
    c.origem,
    c.destino,
    c.motorista,
    c.placaCavalo,
    c.odometro,
    c.operacao,
    c.tipo,
    c.placaCarreta,
    c.situacao,
    c.cliente,
    c.tipoCarreta,
    c.conteiner,
    c.modeloConteiner,
    c.lacre,
    bitrem,
    c.placaCarretaTraseira,
    c.situacaoTraseira,
    c.clienteTraseira,
    c.tipoCarretaTraseira,
    c.conteinerTraseiro,
    c.modeloConteinerTraseiro,
    c.lacreTraseiro,
    c.obs,
    c.numeroControle,
    c.status,
  ];

  return cols.map(esc).join(",");
}

function buildCSV(cautelas: Cautela[]): string {
  const rows = [HEADERS.join(","), ...cautelas.map(cautelaToRow)];
  return rows.join("\r\n");
}

export async function exportarCSV(cautelas: Cautela[]): Promise<void> {
  if (cautelas.length === 0) {
    Alert.alert("Aviso", "Nenhuma cautela para exportar.");
    return;
  }

  const csv = buildCSV(cautelas);
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const fileName = `cautelas_${stamp}.csv`;

  // ── Web: download direto via link ─────────────────────────────────────
  if (Platform.OS === "web") {
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  // ── Native: escreve arquivo e compartilha ─────────────────────────────
  try {
    const path = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(path, "﻿" + csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert("Erro", "Compartilhamento não disponível neste dispositivo.");
      return;
    }

    await Sharing.shareAsync(path, {
      mimeType: "text/csv",
      dialogTitle: "Exportar Cautelas",
      UTI: "public.comma-separated-values-text",
    });
  } catch (err) {
    Alert.alert("Erro", "Não foi possível exportar o arquivo. Tente novamente.");
    console.error("CSV export error:", err);
  }
}
