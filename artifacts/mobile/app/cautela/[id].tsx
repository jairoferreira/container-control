import { ArrowDown, ArrowLeft, ArrowUp, CheckCircle, FileText, XCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { StatusCautela } from "@/contexts/CautelaContext";
import { useCautela } from "@/contexts/CautelaContext";
import { useColors } from "@/hooks/useColors";
import { gerarECompartilharPDF } from "@/lib/generateCautelaPDF";

const STATUS_CONFIG: Record<StatusCautela, { label: string; color: string }> = {
  pendente:  { label: "Pendente",  color: "#f59e0b" },
  concluida: { label: "Concluída", color: "#22c55e" },
  cancelada: { label: "Cancelada", color: "#ef4444" },
};

function InfoRow({ label, value }: { label: string; value?: string }) {
  const colors = useColors();
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  const hasContent = React.Children.toArray(children).some(Boolean);
  if (!hasContent) return null;
  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.sectionHeader, { backgroundColor: colors.primary }]}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export default function CautelaDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getCautela, updateStatus } = useCautela();
  const cautela = getCautela(id);

  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;
  const [generatingPDF, setGeneratingPDF] = useState(false);

  if (!cautela) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
          Cautela não encontrada
        </Text>
      </View>
    );
  }

  const { label, color } = STATUS_CONFIG[cautela.status];
  const isSaindo = cautela.saidaChegada === "saindo";

  async function handleGerarPDF() {
    setGeneratingPDF(true);
    try {
      await gerarECompartilharPDF(cautela!);
    } catch {
      Alert.alert("Erro", "Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setGeneratingPDF(false);
    }
  }

  function handleStatus(status: StatusCautela) {
    const msg = status === "concluida" ? "Marcar como concluída?" : "Cancelar esta cautela?";
    const execute = () => {
      updateStatus(cautela!.id, status);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    };
    if (Platform.OS === "web") {
      if (window.confirm(msg)) execute();
      return;
    }
    Alert.alert("Confirmar", msg, [
      { text: "Não", style: "cancel" },
      { text: "Sim", style: status === "cancelada" ? "destructive" : "default", onPress: execute },
    ]);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Cabeçalho ── */}
      <View style={[styles.header, { backgroundColor: isSaindo ? "#1e3a8a" : "#15803d", paddingTop: topPad + 16 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.directionRow}>
            {isSaindo
              ? <ArrowUp size={16} color="rgba(255,255,255,0.8)" />
              : <ArrowDown size={16} color="rgba(255,255,255,0.8)" />}
            <Text style={styles.directionLabel}>
              {isSaindo ? "SAINDO" : "CHEGANDO"}
            </Text>
          </View>
          <Text style={styles.headerTitle}>#{cautela.numeroControle}</Text>
          <View style={[styles.badge, { backgroundColor: color + "30" }]}>
            <Text style={[styles.badgeText, { color }]}>{label}</Text>
          </View>
        </View>
        <Pressable style={styles.backBtn} onPress={handleGerarPDF} disabled={generatingPDF}>
          {generatingPDF
            ? <ActivityIndicator size="small" color="#fff" />
            : <FileText size={20} color="#fff" />}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* IDENTIFICAÇÃO */}
        <Section title="IDENTIFICAÇÃO">
          <InfoRow label="Nº de Controle" value={cautela.numeroControle} />
          <InfoRow label="Data" value={cautela.dataMov} />
          <InfoRow label="Direção" value={cautela.saidaChegada === "saindo" ? "Saindo" : "Chegando"} />
        </Section>

        {/* ROTA */}
        <Section title="ROTA">
          <InfoRow label="Origem" value={cautela.origem} />
          <InfoRow label="Destino" value={cautela.destino} />
          <InfoRow label="Operação" value={cautela.operacao} />
        </Section>

        {/* VEÍCULO */}
        <Section title="VEÍCULO">
          <InfoRow label="Motorista" value={cautela.motorista} />
          <InfoRow label="Placa do Cavalo" value={cautela.placaCavalo} />
          <InfoRow label="Odômetro" value={cautela.odometro ? cautela.odometro + " km" : undefined} />
          <InfoRow label="Tipo" value={cautela.tipo} />
        </Section>

        {/* CARRETA DIANTEIRA */}
        <Section title="CARRETA DIANTEIRA">
          <InfoRow label="Placa da Carreta" value={cautela.placaCarreta} />
          <InfoRow label="Situação" value={cautela.situacao} />
          <InfoRow label="Cliente" value={cautela.cliente} />
          <InfoRow label="Tipo" value={cautela.tipoCarreta} />
          {cautela.tipoCarreta === "CONTÊINER" && (
            <>
              <InfoRow label="Nº Contêiner" value={cautela.conteiner} />
              <InfoRow label="Modelo" value={cautela.modeloConteiner} />
              <InfoRow label="Lacre" value={cautela.lacre} />
            </>
          )}
        </Section>

        {/* BITREM */}
        {cautela.temBitrem && (
          <Section title="CARRETA TRASEIRA (BITREM)">
            <InfoRow label="Placa Traseira" value={cautela.placaCarretaTraseira} />
            <InfoRow label="Situação" value={cautela.situacaoTraseira} />
            <InfoRow label="Cliente" value={cautela.clienteTraseira} />
            <InfoRow label="Tipo" value={cautela.tipoCarretaTraseira} />
            {cautela.tipoCarretaTraseira === "CONTÊINER" && (
              <>
                <InfoRow label="Nº Contêiner" value={cautela.conteinerTraseiro} />
                <InfoRow label="Modelo" value={cautela.modeloConteinerTraseiro} />
                <InfoRow label="Lacre" value={cautela.lacreTraseiro} />
              </>
            )}
          </Section>
        )}

        {/* OBSERVAÇÕES */}
        {cautela.obs ? (
          <Section title="OBSERVAÇÕES">
            <InfoRow label="Obs" value={cautela.obs} />
          </Section>
        ) : null}

        {/* AÇÕES */}
        {cautela.status === "pendente" && (
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: "#22c55e" }]}
              onPress={() => handleStatus("concluida")}
            >
              <CheckCircle size={18} color="#fff" />
              <Text style={styles.actionText}>Marcar Concluída</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: "#ef4444" }]}
              onPress={() => handleStatus("cancelada")}
            >
              <XCircle size={18} color="#fff" />
              <Text style={styles.actionText}>Cancelar</Text>
            </Pressable>
          </View>
        )}

        <Pressable
          style={[styles.actionBtn, styles.pdfBtn]}
          onPress={handleGerarPDF}
          disabled={generatingPDF}
        >
          {generatingPDF
            ? <ActivityIndicator size="small" color="#1a2361" />
            : <FileText size={18} color="#1a2361" />}
          <Text style={styles.pdfBtnText}>
            {generatingPDF ? "Gerando PDF…" : "Gerar / Imprimir PDF"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { alignItems: "center", gap: 4 },
  directionRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  directionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  content: { padding: 16, gap: 14 },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.9)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionContent: { padding: 14, gap: 2 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    textAlign: "right",
  },
  actions: { gap: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    borderRadius: 13,
  },
  actionText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  pdfBtn: {
    backgroundColor: "#EEF0FB",
    borderWidth: 1.5,
    borderColor: "#1a2361",
  },
  pdfBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#1a2361",
  },
});
