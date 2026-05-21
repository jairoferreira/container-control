import {
  ArrowDown, ArrowLeft, ArrowUp,
  CalendarDays, CheckCircle, Clock,
  FileText, MapPin, X, XCircle,
} from "lucide-react-native";
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
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { StatusCautela } from "@/contexts/CautelaContext";
import { useCautela } from "@/contexts/CautelaContext";
import { useColors } from "@/hooks/useColors";
import { gerarECompartilharPDF } from "@/lib/generateCautelaPDF";

// Carrega DateTimePicker apenas em native
const NativeDatePicker: any =
  Platform.OS !== "web"
    ? require("@react-native-community/datetimepicker").default
    : null;

const STATUS_CONFIG: Record<StatusCautela, { label: string; color: string }> = {
  pendente:  { label: "Pendente",  color: "#f59e0b" },
  concluida: { label: "Concluída", color: "#22c55e" },
  cancelada: { label: "Cancelada", color: "#ef4444" },
};

// ── Helpers de formatação ─────────────────────────────────────────────────────
function formatDate(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function isoTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ── DatePickerField ───────────────────────────────────────────────────────────
function DatePickerField({
  label, value, onChange,
}: {
  label: string; value: Date | null; onChange: (d: Date | null) => void;
}) {
  const colors = useColors();
  const [show, setShow] = useState(false);

  const borderColor = value ? colors.primary : colors.border;
  const iconColor   = value ? colors.primary : colors.mutedForeground;

  function handleWebChange(e: any) {
    const v = e.target.value;
    if (!v) { onChange(null); return; }
    const [y, m, d] = v.split("-").map(Number);
    onChange(new Date(y, m - 1, d));
  }

  return (
    <View style={pf.wrap}>
      <Text style={[pf.label, { color: colors.mutedForeground }]}>{label.toUpperCase()}</Text>

      {Platform.OS === "web" ? (
        <View style={[pf.btn, { borderColor, backgroundColor: colors.input }]}>
          <CalendarDays size={15} color={iconColor} />
          {React.createElement("input", {
            type: "date",
            value: value ? isoDate(value) : "",
            onChange: handleWebChange,
            style: {
              flex: 1, minWidth: 0,
              border: "none", outline: "none", background: "transparent",
              fontSize: 14, cursor: "pointer",
              color: value ? colors.foreground : colors.mutedForeground,
              fontFamily: "'Inter', system-ui, sans-serif", padding: 0,
            },
          })}
          {value && React.createElement("button", {
            type: "button",
            onClick: (e: any) => { e.stopPropagation(); onChange(null); },
            style: { background: "none", border: "none", cursor: "pointer", padding: "0 2px", display: "flex" },
          }, React.createElement(X, { size: 14, color: colors.mutedForeground }))}
        </View>
      ) : (
        <>
          <Pressable
            style={[pf.btn, { borderColor, backgroundColor: colors.input }]}
            onPress={() => setShow(true)}
          >
            <CalendarDays size={15} color={iconColor} />
            <Text style={[pf.display, { color: value ? colors.foreground : colors.mutedForeground }]}>
              {value ? formatDate(value) : "Selecionar data"}
            </Text>
            {value && (
              <Pressable onPress={() => onChange(null)} hitSlop={8}>
                <X size={14} color={colors.mutedForeground} />
              </Pressable>
            )}
          </Pressable>
          {show && NativeDatePicker && (
            <NativeDatePicker
              value={value ?? new Date()}
              mode="date"
              display="default"
              onChange={(_: any, sel?: Date) => {
                setShow(false);
                if (sel) onChange(sel);
              }}
            />
          )}
        </>
      )}
    </View>
  );
}

// ── TimePickerField ───────────────────────────────────────────────────────────
function TimePickerField({
  label, value, onChange,
}: {
  label: string; value: Date | null; onChange: (d: Date | null) => void;
}) {
  const colors = useColors();
  const [show, setShow] = useState(false);

  const borderColor = value ? colors.primary : colors.border;
  const iconColor   = value ? colors.primary : colors.mutedForeground;

  function handleWebChange(e: any) {
    const v = e.target.value; // "HH:MM"
    if (!v) { onChange(null); return; }
    const [h, m] = v.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    onChange(d);
  }

  return (
    <View style={pf.wrap}>
      <Text style={[pf.label, { color: colors.mutedForeground }]}>{label.toUpperCase()}</Text>

      {Platform.OS === "web" ? (
        <View style={[pf.btn, { borderColor, backgroundColor: colors.input }]}>
          <Clock size={15} color={iconColor} />
          {React.createElement("input", {
            type: "time",
            value: value ? isoTime(value) : "",
            onChange: handleWebChange,
            style: {
              flex: 1, minWidth: 0,
              border: "none", outline: "none", background: "transparent",
              fontSize: 14, cursor: "pointer",
              color: value ? colors.foreground : colors.mutedForeground,
              fontFamily: "'Inter', system-ui, sans-serif", padding: 0,
            },
          })}
          {value && React.createElement("button", {
            type: "button",
            onClick: (e: any) => { e.stopPropagation(); onChange(null); },
            style: { background: "none", border: "none", cursor: "pointer", padding: "0 2px", display: "flex" },
          }, React.createElement(X, { size: 14, color: colors.mutedForeground }))}
        </View>
      ) : (
        <>
          <Pressable
            style={[pf.btn, { borderColor, backgroundColor: colors.input }]}
            onPress={() => setShow(true)}
          >
            <Clock size={15} color={iconColor} />
            <Text style={[pf.display, { color: value ? colors.foreground : colors.mutedForeground }]}>
              {value ? formatTime(value) : "Selecionar hora"}
            </Text>
            {value && (
              <Pressable onPress={() => onChange(null)} hitSlop={8}>
                <X size={14} color={colors.mutedForeground} />
              </Pressable>
            )}
          </Pressable>
          {show && NativeDatePicker && (
            <NativeDatePicker
              value={value ?? new Date()}
              mode="time"
              display="default"
              is24Hour={true}
              onChange={(_: any, sel?: Date) => {
                setShow(false);
                if (sel) onChange(sel);
              }}
            />
          )}
        </>
      )}
    </View>
  );
}

const pf = StyleSheet.create({
  wrap: { flex: 1 },
  label: {
    fontSize: 10, fontFamily: "Inter_500Medium",
    letterSpacing: 0.5, marginBottom: 6,
  },
  btn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 11,
    minHeight: 44,
  },
  display: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
});

// ── InfoRow / Section ─────────────────────────────────────────────────────────
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

// ── Campo de texto simples (Recebedor / RG) ───────────────────────────────────
function FinalField({
  label, value, onChange, placeholder, autoCapitalize,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string;
  autoCapitalize?: "none" | "words" | "characters" | "sentences";
}) {
  const colors = useColors();
  return (
    <View style={ff.wrap}>
      <Text style={[ff.label, { color: colors.mutedForeground }]}>{label.toUpperCase()}</Text>
      <TextInput
        style={[ff.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.input }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize={autoCapitalize ?? "words"}
        returnKeyType="next"
      />
    </View>
  );
}
const ff = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 10, fontFamily: "Inter_500Medium", letterSpacing: 0.5, marginBottom: 6 },
  input: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, fontFamily: "Inter_400Regular",
    minHeight: 44,
  },
});

// ═════════════════════════════════════════════════════════════════════════════
export default function CautelaDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getCautela, updateStatus, finalizarCautela } = useCautela();
  const cautela = getCautela(id);

  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // ── Finalização ─────────────────────────────────────────────────────────────
  const [finalizando,   setFinalizando]   = useState(false);
  const [fDestDate,     setFDestDate]     = useState<Date | null>(null);
  const [fDestTime,     setFDestTime]     = useState<Date | null>(null);
  const [fRecebedor,    setFRecebedor]    = useState("");
  const [fRG,           setFRG]           = useState("");

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

  function handleCancelar() {
    const msg = "Cancelar esta cautela?";
    const execute = () => {
      updateStatus(cautela!.id, "cancelada");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };
    if (Platform.OS === "web") { if (window.confirm(msg)) execute(); return; }
    Alert.alert("Confirmar", msg, [
      { text: "Não", style: "cancel" },
      { text: "Cancelar cautela", style: "destructive", onPress: execute },
    ]);
  }

  function handleFinalizar() {
    if (!fDestDate || !fDestTime || !fRecebedor.trim()) {
      const msg = "Selecione a Data de Entrega, o Horário e informe o Recebedor.";
      if (Platform.OS === "web") { alert(msg); return; }
      Alert.alert("Campos obrigatórios", msg);
      return;
    }
    const msg = "Confirmar entrega e marcar como Concluída?";
    const execute = () => {
      finalizarCautela(cautela!.id, {
        destinoData:    formatDate(fDestDate!),
        destinoHorario: formatTime(fDestTime!),
        recebedor: fRecebedor.trim(),
        rg: fRG.trim(),
      });
      setFinalizando(false);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };
    if (Platform.OS === "web") { if (window.confirm(msg)) execute(); return; }
    Alert.alert("Finalizar cautela", msg, [
      { text: "Voltar", style: "cancel" },
      { text: "Confirmar entrega", style: "default", onPress: execute },
    ]);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
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
        keyboardShouldPersistTaps="handled"
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

        {/* ENTREGA (só quando concluída) */}
        {cautela.status === "concluida" && cautela.recebedor ? (
          <Section title="ENTREGA">
            <InfoRow label="Data de Entrega" value={cautela.destinoData} />
            <InfoRow label="Horário"         value={cautela.destinoHorario} />
            <InfoRow label="Recebedor"       value={cautela.recebedor} />
            <InfoRow label="RG do Recebedor" value={cautela.rg} />
          </Section>
        ) : null}

        {/* ── AÇÕES ──────────────────────────────────────────────────────── */}
        {cautela.status === "pendente" && (
          <View style={styles.actionsWrap}>

            {/* ── Formulário de finalização ─────────────────────────────── */}
            {finalizando ? (
              <View style={[styles.finalizarCard, { backgroundColor: colors.card, borderColor: "#22c55e" }]}>
                <View style={styles.finalizarHeader}>
                  <MapPin size={16} color="#22c55e" />
                  <Text style={[styles.finalizarTitle, { color: colors.foreground }]}>
                    Dados de Entrega
                  </Text>
                </View>
                <Text style={[styles.finalizarHint, { color: colors.mutedForeground }]}>
                  Preencha os dados no momento da entrega para concluir a cautela.
                </Text>

                {/* Data e Hora lado a lado */}
                <View style={styles.dateTimeRow}>
                  <DatePickerField
                    label="Data de entrega *"
                    value={fDestDate}
                    onChange={setFDestDate}
                  />
                  <TimePickerField
                    label="Horário *"
                    value={fDestTime}
                    onChange={setFDestTime}
                  />
                </View>

                <View style={{ height: 12 }} />

                <FinalField
                  label="Recebedor *"
                  value={fRecebedor}
                  onChange={(v) => setFRecebedor(v.toUpperCase())}
                  placeholder="Nome de quem recebe"
                  autoCapitalize="characters"
                />

                <FinalField
                  label="RG do recebedor"
                  value={fRG}
                  onChange={setFRG}
                  placeholder="Opcional"
                  autoCapitalize="none"
                />

                <View style={styles.finalizarBtns}>
                  <Pressable
                    style={[styles.finalizarBtn, { borderColor: colors.border }]}
                    onPress={() => setFinalizando(false)}
                  >
                    <Text style={[styles.finalizarBtnText, { color: colors.mutedForeground }]}>
                      Voltar
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.finalizarBtn, styles.finalizarBtnOk]}
                    onPress={handleFinalizar}
                  >
                    <CheckCircle size={16} color="#fff" />
                    <Text style={[styles.finalizarBtnText, { color: "#fff" }]}>
                      Confirmar Entrega
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* ── Botões de ação ─────────────────────────────────────── */
              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: "#22c55e" }]}
                  onPress={() => setFinalizando(true)}
                >
                  <CheckCircle size={18} color="#fff" />
                  <Text style={styles.actionText}>Finalizar Cautela</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: "#ef4444" }]}
                  onPress={handleCancelar}
                >
                  <XCircle size={18} color="#fff" />
                  <Text style={styles.actionText}>Cancelar Cautela</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* ── Botão PDF (sempre visível) ─────────────────────────────────── */}
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
    paddingHorizontal: 16, paddingBottom: 18,
    flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { alignItems: "center", gap: 4 },
  directionRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  directionLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.8)", letterSpacing: 1,
  },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#ffffff" },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  content: { padding: 16, gap: 14 },
  section: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  sectionHeader: { paddingHorizontal: 16, paddingVertical: 10 },
  sectionTitle: {
    fontSize: 11, fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.9)", textTransform: "uppercase", letterSpacing: 1,
  },
  sectionContent: { padding: 14, gap: 2 },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5E7EB",
  },
  infoLabel: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  infoValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "right" },

  // Ações
  actionsWrap: { gap: 0 },
  actions: { gap: 10 },
  actionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 15, borderRadius: 13,
  },
  actionText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  pdfBtn: { backgroundColor: "#EEF0FB", borderWidth: 1.5, borderColor: "#1a2361" },
  pdfBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#1a2361" },

  // Formulário de finalização
  finalizarCard: {
    borderRadius: 16, borderWidth: 1.5,
    padding: 16, marginBottom: 10,
  },
  finalizarHeader: {
    flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6,
  },
  finalizarTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  finalizarHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginBottom: 14 },
  dateTimeRow: { flexDirection: "row", gap: 10 },
  finalizarBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  finalizarBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1, alignItems: "center",
    flexDirection: "row", justifyContent: "center", gap: 6,
  },
  finalizarBtnOk: { backgroundColor: "#22c55e", borderColor: "#22c55e" },
  finalizarBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
