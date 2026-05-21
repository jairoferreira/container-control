/**
 * exportCautelasXLSX.ts
 * Gera um arquivo .xlsx idêntico ao exportado pelo Google Forms
 * e aciona o download no browser (web) ou o compartilhamento nativo (mobile).
 */

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";
import * as XLSX from "xlsx";
import type { Cautela } from "@/contexts/CautelaContext";

// ── Cabeçalhos (mesma ordem do Google Forms) ──────────────────────────────────
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

function cautelaToRow(c: Cautela): (string | number | null)[] {
  const ts = new Date(c.createdAt).toLocaleString("pt-BR");
  const dir = c.saidaChegada === "saindo" ? "Saindo" : "Chegando";
  const bitrem = c.temBitrem ? "SIM" : "NÃO";
  const odometro = c.odometro ? Number(c.odometro) || c.odometro : "";
  const statusPtBr =
    c.status === "pendente"
      ? "Pendente"
      : c.status === "concluida"
      ? "Concluída"
      : "Cancelada";

  return [
    ts,
    dir,
    c.origem || "",
    c.destino || "",
    c.motorista || "",
    c.placaCavalo || "",
    odometro,
    c.operacao || "",
    c.tipo || "",
    c.placaCarreta || "",
    c.situacao || "",
    c.cliente || "",
    c.tipoCarreta || "",
    c.conteiner || "",
    c.modeloConteiner || "",
    c.lacre || "",
    bitrem,
    c.placaCarretaTraseira || "",
    c.situacaoTraseira || "",
    c.clienteTraseira || "",
    c.tipoCarretaTraseira || "",
    c.conteinerTraseiro || "",
    c.modeloConteinerTraseiro || "",
    c.lacreTraseiro || "",
    c.obs || "",
    c.numeroControle || "",
    statusPtBr,
  ];
}

// ── Estilo de cabeçalho ───────────────────────────────────────────────────────
function applyHeaderStyle(ws: XLSX.WorkSheet, numCols: number) {
  for (let col = 0; col < numCols; col++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddr]) continue;
    ws[cellAddr].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1E3A8A" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
      },
    };
  }
}

// ── Exportação principal ──────────────────────────────────────────────────────
export async function exportarXLSX(
  cautelas: Cautela[],
  opcoes?: { dataInicio?: string; dataFim?: string; status?: string }
): Promise<void> {
  if (cautelas.length === 0) {
    if (Platform.OS === "web") {
      window.alert("Nenhuma cautela encontrada para o período/filtro selecionado.");
    } else {
      Alert.alert("Aviso", "Nenhuma cautela encontrada para o período/filtro selecionado.");
    }
    return;
  }

  // Monta os dados: cabeçalho + linhas
  const rows = [HEADERS, ...cautelas.map(cautelaToRow)];

  // Cria worksheet e aplica larguras de coluna automaticamente
  const ws = XLSX.utils.aoa_to_sheet(rows);
  applyHeaderStyle(ws, HEADERS.length);

  // Larguras manuais (em caracteres)
  ws["!cols"] = [
    { wch: 20 }, // data/hora
    { wch: 14 }, // saindo/chegando
    { wch: 16 }, // origem
    { wch: 16 }, // destino
    { wch: 32 }, // motorista
    { wch: 14 }, // placa cavalo
    { wch: 12 }, // odômetro
    { wch: 14 }, // operação
    { wch: 22 }, // tipo
    { wch: 14 }, // placa carreta
    { wch: 12 }, // situação
    { wch: 18 }, // cliente
    { wch: 22 }, // tipo carreta
    { wch: 16 }, // conteiner
    { wch: 14 }, // modelo
    { wch: 14 }, // lacre
    { wch: 16 }, // bitrem
    { wch: 16 }, // placa traseira
    { wch: 14 }, // situação traseira
    { wch: 18 }, // cliente traseira
    { wch: 22 }, // tipo carreta traseira
    { wch: 18 }, // conteiner traseiro
    { wch: 18 }, // modelo traseiro
    { wch: 14 }, // lacre traseiro
    { wch: 30 }, // obs
    { wch: 14 }, // nº controle
    { wch: 12 }, // status
  ];

  // Congela a primeira linha (cabeçalho)
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cautelas");

  // Nome do arquivo com período
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const fileName = `cautelas_${stamp}.xlsx`;

  // ── Web: gera blob e dispara download ────────────────────────────────────
  if (Platform.OS === "web") {
    const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbOut], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  // ── Mobile: salva em cache e compartilha ──────────────────────────────────
  try {
    const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "base64" }) as string;
    const path = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(path, wbOut, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert("Erro", "Compartilhamento não disponível neste dispositivo.");
      return;
    }

    await Sharing.shareAsync(path, {
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: "Exportar Cautelas",
      UTI: "com.microsoft.excel.xlsx",
    });
  } catch (err) {
    Alert.alert("Erro", "Não foi possível exportar o arquivo.");
    console.error("XLSX export error:", err);
  }
}
