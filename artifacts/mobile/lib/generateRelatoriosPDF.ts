/**
 * generateRelatoriosPDF.ts
 * Gera um relatório tabular de cautelas em PDF (A4 paisagem).
 * ~25 cautelas por página — ideal para conferência e assinatura física.
 */

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";
import type { Cautela } from "@/contexts/CautelaContext";

function v(val?: string | null): string {
  return val && val.trim() ? val.trim() : "—";
}

function statusLabel(s: string): string {
  if (s === "pendente")  return "Pendente";
  if (s === "concluida") return "Concluída";
  if (s === "cancelada") return "Cancelada";
  return s;
}

function statusColor(s: string): string {
  if (s === "pendente")  return "#92400e";
  if (s === "concluida") return "#14532d";
  if (s === "cancelada") return "#7f1d1d";
  return "#1a1a1a";
}

function statusBg(s: string): string {
  if (s === "pendente")  return "#fef3c7";
  if (s === "concluida") return "#dcfce7";
  if (s === "cancelada") return "#fee2e2";
  return "#f3f4f6";
}

// ── Gerador principal ─────────────────────────────────────────────────────────
export async function gerarRelatorioTabelaPDF(
  cautelas: Cautela[],
  descFiltro: string
): Promise<void> {
  if (cautelas.length === 0) {
    if (Platform.OS === "web") {
      window.alert("Nenhuma cautela encontrada para os filtros selecionados.");
    } else {
      Alert.alert("Aviso", "Nenhuma cautela encontrada para os filtros selecionados.");
    }
    return;
  }

  const agora = new Date().toLocaleString("pt-BR");

  // ── Linhas da tabela ───────────────────────────────────────────────────────
  const rows = cautelas
    .map((c, i) => {
      const bg       = i % 2 === 0 ? "#ffffff" : "#f8fafc";
      const sLabel   = statusLabel(c.status);
      const sColor   = statusColor(c.status);
      const sBg      = statusBg(c.status);
      const dir      = c.saidaChegada === "saindo" ? "↑" : "↓";
      const referencia = c.conteiner || c.placaCarreta || "—";

      return `
        <tr style="background:${bg}">
          <td class="ctr bold">${v(c.numeroControle)}</td>
          <td class="ctr">${v(c.dataMov)}</td>
          <td>${v(c.motorista)}</td>
          <td class="ctr">${v(c.placaCavalo)}</td>
          <td class="ctr dir">${dir}</td>
          <td>${v(c.origem)}</td>
          <td>${v(c.destino)}</td>
          <td class="ctr">${referencia}</td>
          <td class="ctr">
            <span style="
              background:${sBg}; color:${sColor};
              font-weight:700; font-size:6.5pt;
              padding:1px 5px; border-radius:4px;
              white-space:nowrap;
            ">${sLabel}</span>
          </td>
          <td>${v(c.recebedor)}</td>
          <td class="assinatura"></td>
        </tr>`;
    })
    .join("");

  // ── HTML ───────────────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {
    size: A4 landscape;
    margin: 8mm 10mm;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 7.5pt;
    color: #111;
  }

  /* ── Cabeçalho ── */
  .report-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2.5px solid #1e3a8a;
    padding-bottom: 4mm;
    margin-bottom: 4mm;
  }
  .report-title {
    font-size: 14pt;
    font-weight: 900;
    color: #1e3a8a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1.2;
  }
  .report-sub {
    font-size: 7pt;
    color: #555;
    margin-top: 3px;
  }
  .report-meta {
    text-align: right;
    font-size: 7pt;
    color: #555;
    line-height: 1.6;
  }
  .report-count {
    font-size: 12pt;
    font-weight: 900;
    color: #1e3a8a;
  }

  /* ── Tabela ── */
  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  col.c-num   { width: 6.5% }
  col.c-data  { width: 7.5% }
  col.c-moto  { width: 15%  }
  col.c-placa { width: 6.5% }
  col.c-dir   { width: 3%   }
  col.c-orig  { width: 9%   }
  col.c-dest  { width: 9%   }
  col.c-ref   { width: 9%   }
  col.c-stat  { width: 8%   }
  col.c-receb { width: 12%  }
  col.c-assin { width: 14%  }

  thead tr {
    background: #1e3a8a;
    color: #fff;
  }
  th {
    padding: 2.5mm 2mm;
    font-size: 6.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.2px;
    white-space: nowrap;
    overflow: hidden;
  }
  td {
    padding: 1.8mm 2mm;
    font-size: 7pt;
    border-bottom: 0.5px solid #e5e7eb;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    vertical-align: middle;
  }
  .ctr  { text-align: center; }
  .bold { font-weight: 700; }
  .dir  { font-size: 9pt; font-weight: 700; color: #1e3a8a; }

  /* Coluna de assinatura */
  .assinatura {
    border-bottom: 1px solid #aaa !important;
    min-height: 14px;
  }

  /* ── Rodapé ── */
  .report-footer {
    margin-top: 5mm;
    padding-top: 3mm;
    border-top: 0.75px solid #ddd;
    text-align: center;
    font-size: 6.5pt;
    color: #888;
  }

  /* ── Legenda de status ── */
  .legend {
    display: flex;
    gap: 8mm;
    margin-top: 3mm;
    justify-content: flex-end;
    font-size: 6.5pt;
    color: #555;
  }
  .legend-item { display: flex; align-items: center; gap: 2mm; }
  .legend-dot  { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
</style>
</head>
<body>

  <div class="report-header">
    <div>
      <div class="report-title">Relatório de Cautelas — THIBA LOGÍSTICA</div>
      <div class="report-sub">${descFiltro}</div>
    </div>
    <div class="report-meta">
      <div>Gerado em ${agora}</div>
      <div class="report-count">${cautelas.length} cautela${cautelas.length !== 1 ? "s" : ""}</div>
    </div>
  </div>

  <table>
    <colgroup>
      <col class="c-num">
      <col class="c-data">
      <col class="c-moto">
      <col class="c-placa">
      <col class="c-dir">
      <col class="c-orig">
      <col class="c-dest">
      <col class="c-ref">
      <col class="c-stat">
      <col class="c-receb">
      <col class="c-assin">
    </colgroup>
    <thead>
      <tr>
        <th class="ctr">Nº</th>
        <th class="ctr">Data</th>
        <th>Motorista</th>
        <th class="ctr">Placa</th>
        <th class="ctr">Dir.</th>
        <th>Origem</th>
        <th>Destino</th>
        <th class="ctr">Conteiner / Carreta</th>
        <th class="ctr">Status</th>
        <th>Recebedor</th>
        <th class="ctr">Assinatura</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="legend">
    <span class="legend-item"><span class="legend-dot" style="background:#fef3c7;border:1px solid #d97706"></span> Pendente</span>
    <span class="legend-item"><span class="legend-dot" style="background:#dcfce7;border:1px solid #16a34a"></span> Concluída</span>
    <span class="legend-item"><span class="legend-dot" style="background:#fee2e2;border:1px solid #dc2626"></span> Cancelada</span>
    <span class="legend-item">↑ Saindo &nbsp; ↓ Chegando</span>
  </div>

  <div class="report-footer">
    Rua Constelação de Gêmeos, nº 176 – Aleixo &nbsp;|&nbsp; Tel.: (92) 3644-1105 &nbsp;|&nbsp; Manaus – AM &nbsp;|&nbsp; E-mail: thiba@thiba.com.br
  </div>

</body>
</html>`;

  // ── Web: abre aba nova e aciona impressão ──────────────────────────────────
  if (Platform.OS === "web") {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 400);
    }
    return;
  }

  // ── Mobile: expo-print → expo-sharing ─────────────────────────────────────
  try {
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert("Erro", "Compartilhamento não disponível neste dispositivo.");
      return;
    }
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Relatório de Cautelas",
      UTI: "com.adobe.pdf",
    });
  } catch (err) {
    Alert.alert("Erro", "Não foi possível gerar o relatório PDF.");
    console.error("Relatório PDF error:", err);
  }
}
