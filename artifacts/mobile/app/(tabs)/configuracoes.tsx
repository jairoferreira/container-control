import {
  CalendarDays,
  Download,
  FileSpreadsheet,
  Lock,
  Pencil,
  Plus,
  Trash2,
  Truck,
  UserCheck,
  UserX,
  X,
} from "lucide-react-native";

import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotoristaModal } from "@/components/MotoristaModal";
import { useCautela } from "@/contexts/CautelaContext";
import type { Motorista } from "@/contexts/SettingsContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { exportarXLSX } from "@/lib/exportCautelasXLSX";

// Carrega DateTimePicker apenas em native (evita erro no bundle web)
const NativeDatePicker: any =
  Platform.OS !== "web"
    ? require("@react-native-community/datetimepicker").default
    : null;

// ── SectionCard ───────────────────────────────────────────────────────────────
function SectionCard({
  title, icon, children,
}: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={[card.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={card.header}>
        {icon}
        <Text style={[card.title, { color: colors.foreground }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}
const card = StyleSheet.create({
  wrap: {
    borderRadius: 20, borderWidth: 1,
    padding: 16, marginBottom: 14,
    shadowColor: "rgba(15,23,42,0.05)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 2,
  },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginBottom: 14, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5E7EB",
  },
  title: { fontSize: 15, fontFamily: "Inter_700Bold" },
});

// ── DatePickerField ───────────────────────────────────────────────────────────
function DatePickerField({
  label, value, onChange, placeholder = "Qualquer data",
}: {
  label: string;
  value: Date | null;
  onChange: (d: Date | null) => void;
  placeholder?: string;
}) {
  const colors = useColors();
  const [showNative, setShowNative] = useState(false);

  const displayText = value
    ? value.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
    : placeholder;

  // ISO date string (YYYY-MM-DD) para o input HTML
  const isoVal = value
    ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
    : "";

  function handleWebChange(e: any) {
    const v = e.target.value;
    if (!v) { onChange(null); return; }
    // Interpreta como data local (não UTC)
    const [y, m, d] = v.split("-").map(Number);
    onChange(new Date(y, m - 1, d));
  }

  const borderColor = value ? colors.primary : colors.border;
  const iconColor   = value ? colors.primary : colors.mutedForeground;

  return (
    <View style={dpf.fieldWrap}>
      <Text style={[dpf.label, { color: colors.mutedForeground }]}>{label}</Text>

      {/* ── Web: input HTML type="date" estilizado ─────────────────────── */}
      {Platform.OS === "web" && (
        <View style={[dpf.btn, { borderColor, backgroundColor: colors.input }]}>
          <CalendarDays size={15} color={iconColor} />
          {React.createElement("input", {
            type: "date",
            value: isoVal,
            onChange: handleWebChange,
            style: {
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 14,
              cursor: "pointer",
              color: value ? colors.foreground : colors.mutedForeground,
              fontFamily: "'Inter', system-ui, sans-serif",
              padding: 0,
            },
          })}
          {value
            ? React.createElement(
                "button",
                {
                  type: "button",
                  onClick: (e: any) => { e.stopPropagation(); onChange(null); },
                  style: {
                    background: "none", border: "none", cursor: "pointer",
                    padding: "0 2px", display: "flex", alignItems: "center",
                  },
                },
                React.createElement(X, { size: 14, color: colors.mutedForeground })
              )
            : null}
        </View>
      )}

      {/* ── Native: botão + DateTimePicker ────────────────────────────── */}
      {Platform.OS !== "web" && (
        <>
          <Pressable
            style={[dpf.btn, { borderColor, backgroundColor: colors.input }]}
            onPress={() => setShowNative(true)}
          >
            <CalendarDays size={15} color={iconColor} />
            <Text style={[dpf.displayText, { color: value ? colors.foreground : colors.mutedForeground }]}>
              {displayText}
            </Text>
            {value && (
              <Pressable
                onPress={(e) => { (e as any).stopPropagation?.(); onChange(null); }}
                hitSlop={8}
              >
                <X size={14} color={colors.mutedForeground} />
              </Pressable>
            )}
          </Pressable>
          {showNative && NativeDatePicker && (
            <NativeDatePicker
              value={value ?? new Date()}
              mode="date"
              display="default"
              onChange={(_: any, selectedDate?: Date) => {
                setShowNative(false);
                if (selectedDate) onChange(selectedDate);
              }}
            />
          )}
        </>
      )}
    </View>
  );
}
const dpf = StyleSheet.create({
  fieldWrap: { flex: 1 },
  label: {
    fontSize: 11, fontFamily: "Inter_500Medium",
    textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8,
  },
  btn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 11,
    minHeight: 44,
  },
  displayText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
});

// ── Lista editável simples (placas) ───────────────────────────────────────────
function EditableList({
  items, placeholder, onAdd, onRemove, autoCapitalize,
}: {
  items: string[]; placeholder: string;
  onAdd: (v: string) => void; onRemove: (v: string) => void;
  autoCapitalize?: "none" | "words" | "characters" | "sentences";
}) {
  const colors = useColors();
  const [input, setInput] = useState("");
  function handleAdd() {
    const v = input.trim();
    if (!v) return;
    if (items.map((i) => i.toUpperCase()).includes(v.toUpperCase())) {
      Alert.alert("Aviso", "Já existe na lista."); return;
    }
    onAdd(v); setInput("");
  }
  return (
    <View>
      <View style={[list.addRow, { borderColor: colors.border }]}>
        <TextInput
          style={[list.input, { color: colors.foreground }]}
          value={input} onChangeText={setInput}
          placeholder={placeholder} placeholderTextColor={colors.mutedForeground}
          autoCapitalize={autoCapitalize ?? "words"}
          onSubmitEditing={handleAdd} returnKeyType="done"
        />
        <Pressable style={[list.addBtn, { backgroundColor: colors.primary }]} onPress={handleAdd}>
          <Plus size={18} color="#fff" />
        </Pressable>
      </View>
      {items.map((item) => (
        <View key={item} style={[list.item, { borderBottomColor: colors.border }]}>
          <Text style={[list.itemText, { color: colors.foreground }]} numberOfLines={1}>{item}</Text>
          <Pressable style={list.removeBtn} hitSlop={8}
            onPress={() => {
              const msg = `Remover "${item}"?`;
              if (Platform.OS === "web") { if (window.confirm(msg)) onRemove(item); }
              else { Alert.alert("Remover", msg, [{ text: "Cancelar", style: "cancel" }, { text: "Remover", style: "destructive", onPress: () => onRemove(item) }]); }
            }}>
            <Trash2 size={16} color="#ef4444" />
          </Pressable>
        </View>
      ))}
      <Text style={[list.count, { color: colors.mutedForeground }]}>
        {items.length} {items.length === 1 ? "item" : "itens"} cadastrado{items.length !== 1 ? "s" : ""}
      </Text>
    </View>
  );
}
const list = StyleSheet.create({
  addRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 14, overflow: "hidden", marginBottom: 10 },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  addBtn: { padding: 12, alignItems: "center", justifyContent: "center" },
  item: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  itemText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  removeBtn: { padding: 4 },
  count: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 8, textAlign: "right" },
});

// ── Card de motorista individual ──────────────────────────────────────────────
function MotoristaCadastroItem({
  motorista, onEdit, onRemove,
}: { motorista: Motorista; onEdit: () => void; onRemove: () => void }) {
  const colors = useColors();
  const ativo = motorista.ativo;
  return (
    <View style={[mitem.wrap, { borderBottomColor: colors.border }]}>
      <View style={[mitem.avatar, { backgroundColor: ativo ? colors.primary + "18" : colors.muted }]}>
        <Text style={[mitem.avatarText, { color: ativo ? colors.primary : colors.mutedForeground }]}>
          {motorista.nome.charAt(0)}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={mitem.nomeRow}>
          <Text style={[mitem.nome, { color: colors.foreground }]} numberOfLines={1}>
            {motorista.nome}
          </Text>
          {motorista.matricula
            ? <Text style={[mitem.matricula, { color: colors.mutedForeground }]}>{motorista.matricula}</Text>
            : null}
        </View>
        <View style={mitem.badges}>
          {motorista.cnh
            ? <Text style={[mitem.badge, { backgroundColor: "#eff6ff", color: "#1d4ed8" }]}>CNH {motorista.cnh.slice(-4).padStart(motorista.cnh.length, "•")}</Text>
            : null}
          {motorista.telefone
            ? <Text style={[mitem.badge, { backgroundColor: "#f0fdf4", color: "#15803d" }]}>📞 {motorista.telefone}</Text>
            : null}
          {motorista.placa
            ? <Text style={[mitem.badge, { backgroundColor: "#fefce8", color: "#854d0e" }]}>🚛 {motorista.placa}</Text>
            : null}
          <View style={[mitem.statusChip, { backgroundColor: ativo ? "#dcfce7" : "#fee2e2" }]}>
            {ativo ? <UserCheck size={10} color="#15803d" /> : <UserX size={10} color="#dc2626" />}
            <Text style={[mitem.statusText, { color: ativo ? "#15803d" : "#dc2626" }]}>
              {ativo ? "Ativo" : "Inativo"}
            </Text>
          </View>
        </View>
        <Text style={[mitem.pinHint, { color: colors.mutedForeground }]}>
          PIN: {motorista.pin === "0000" ? "padrão (0000)" : "personalizado"}
        </Text>
      </View>
      <View style={mitem.actions}>
        <Pressable style={[mitem.actionBtn, { borderColor: colors.border }]} onPress={onEdit} hitSlop={4}>
          <Pencil size={14} color={colors.primary} />
        </Pressable>
        <Pressable style={[mitem.actionBtn, { borderColor: "#fca5a5" }]} onPress={onRemove} hitSlop={4}>
          <Trash2 size={14} color="#ef4444" />
        </Pressable>
      </View>
    </View>
  );
}
const mitem = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  avatar: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  nomeRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  nome: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  matricula: { fontSize: 10, fontFamily: "Inter_500Medium", opacity: 0.6 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  badge: { fontSize: 10, fontFamily: "Inter_500Medium", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  pinHint: { fontSize: 10, fontFamily: "Inter_400Regular" },
  actions: { gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});

// ── PIN Modal Admin ───────────────────────────────────────────────────────────
function AdminPinModal({ visible, onConfirm, onClose }: { visible: boolean; onConfirm: (p: string) => void; onClose: () => void }) {
  const colors = useColors();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  function confirm() {
    if (value.length !== 6) { setError("PIN deve ter 6 dígitos."); return; }
    onConfirm(value); setValue(""); setError("");
  }
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { setValue(""); onClose(); }}>
      <View style={apm.overlay}>
        <View style={[apm.box, { backgroundColor: colors.card }]}>
          <Text style={[apm.title, { color: colors.foreground }]}>Novo PIN do Administrador</Text>
          <TextInput
            style={[apm.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.input }]}
            value={value} onChangeText={(t) => { setValue(t.replace(/\D/g, "").slice(0, 6)); setError(""); }}
            placeholder="••••••" placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric" secureTextEntry maxLength={6} autoFocus
          />
          {error ? <Text style={apm.error}>{error}</Text> : null}
          <View style={apm.btns}>
            <Pressable style={[apm.btn, { borderColor: colors.border }]} onPress={() => { setValue(""); onClose(); }}>
              <Text style={[apm.btnText, { color: colors.mutedForeground }]}>Cancelar</Text>
            </Pressable>
            <Pressable style={[apm.btn, apm.btnOk]} onPress={confirm}>
              <Text style={[apm.btnText, { color: "#fff" }]}>Salvar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
const apm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 24 },
  box: { borderRadius: 22, padding: 24, width: "100%", maxWidth: 380, gap: 14 },
  title: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "center" },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 22, fontFamily: "Inter_500Medium", textAlign: "center", letterSpacing: 8 },
  error: { color: "#ef4444", fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  btns: { flexDirection: "row", gap: 10 },
  btn: { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  btnOk: { backgroundColor: "#1e3a8a", borderColor: "#1e3a8a" },
  btnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});

// ═════════════════════════════════════════════════════════════════════════════
// TELA PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════
export default function ConfiguracoesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const botPad = Platform.OS === "web" ? 100 : 0;

  const {
    settings,
    addMotorista, updateMotorista, removeMotorista,
    addPlaca, removePlaca,
    setAdminPin, resetToDefaults,
  } = useSettings();

  const { cauteias } = useCautela();

  // ── Motorista modal ──────────────────────────────────────────────────────
  const [motoModal, setMotoModal] = useState<{ open: boolean; motorista: Motorista | null }>({ open: false, motorista: null });
  const [adminPinModal, setAdminPinModal] = useState(false);

  // ── Exportação ───────────────────────────────────────────────────────────
  const [exportDataInicio, setExportDataInicio] = useState<Date | null>(null);
  const [exportDataFim,    setExportDataFim]    = useState<Date | null>(null);
  const [exportStatus, setExportStatus] = useState<"tudo" | "concluida" | "cancelada">("tudo");
  const [exporting, setExporting] = useState(false);

  const ativos   = settings.motoristas.filter((m) => m.ativo).length;
  const inativos = settings.motoristas.length - ativos;

  // Contagem em tempo real para o hint
  const filteredCount = (() => {
    let list = cauteias;
    if (exportDataInicio) list = list.filter((c) => new Date(c.createdAt) >= exportDataInicio!);
    if (exportDataFim) {
      const fim = new Date(exportDataFim);
      fim.setHours(23, 59, 59, 999);
      list = list.filter((c) => new Date(c.createdAt) <= fim);
    }
    if (exportStatus !== "tudo") list = list.filter((c) => c.status === exportStatus);
    return list.length;
  })();

  async function handleExportar() {
    let filtradas = [...cauteias];
    if (exportDataInicio) filtradas = filtradas.filter((c) => new Date(c.createdAt) >= exportDataInicio!);
    if (exportDataFim) {
      const fim = new Date(exportDataFim);
      fim.setHours(23, 59, 59, 999);
      filtradas = filtradas.filter((c) => new Date(c.createdAt) <= fim);
    }
    if (exportStatus !== "tudo") filtradas = filtradas.filter((c) => c.status === exportStatus);

    setExporting(true);
    await exportarXLSX(filtradas);
    setExporting(false);
  }

  function confirmRemoveMotorista(m: Motorista) {
    const msg = `Remover "${m.nome}" do cadastro?`;
    if (Platform.OS === "web") { if (window.confirm(msg)) removeMotorista(m.id); }
    else {
      Alert.alert("Remover motorista", msg, [
        { text: "Cancelar", style: "cancel" },
        { text: "Remover", style: "destructive", onPress: () => removeMotorista(m.id) },
      ]);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Cabeçalho */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPad + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>CONFIGURAÇÕES</Text>
          <Text style={styles.headerSub}>Cadastros e exportação de dados</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ══ EXPORTAR DADOS ══════════════════════════════════════════════ */}
        <SectionCard
          title="Exportar Dados"
          icon={<FileSpreadsheet size={18} color={colors.primary} />}
        >
          {/* Datas com calendário */}
          <View style={styles.dateRow}>
            <DatePickerField
              label="Data Inicial"
              value={exportDataInicio}
              onChange={setExportDataInicio}
            />
            <DatePickerField
              label="Data Final"
              value={exportDataFim}
              onChange={setExportDataFim}
            />
          </View>

          {/* Tipo de cautelas */}
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            TIPO DE CAUTELAS
          </Text>
          <View style={styles.statusPicker}>
            {(
              [
                { value: "tudo",      label: "Todas"      },
                { value: "concluida", label: "Concluídas" },
                { value: "cancelada", label: "Canceladas" },
              ] as { value: "tudo" | "concluida" | "cancelada"; label: string }[]
            ).map(({ value, label }) => (
              <Pressable
                key={value}
                style={[
                  styles.statusChip,
                  {
                    borderColor: exportStatus === value ? colors.primary : colors.border,
                    backgroundColor: exportStatus === value ? colors.primary + "12" : "transparent",
                  },
                ]}
                onPress={() => setExportStatus(value)}
              >
                <Text style={[
                  styles.statusChipText,
                  { color: exportStatus === value ? colors.primary : colors.mutedForeground },
                ]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Contagem em tempo real */}
          <Text style={[styles.exportHint, { color: colors.mutedForeground }]}>
            {filteredCount === cauteias.length
              ? `${cauteias.length} cautela${cauteias.length !== 1 ? "s" : ""} (todas)`
              : `${filteredCount} de ${cauteias.length} cautela${cauteias.length !== 1 ? "s" : ""} no filtro`}
          </Text>

          {/* Botão */}
          <Pressable
            style={[styles.exportBtn, { backgroundColor: exporting ? colors.muted : "#1e3a8a" }]}
            onPress={handleExportar}
            disabled={exporting}
          >
            <Download size={16} color="#fff" />
            <Text style={styles.exportBtnText}>
              {exporting ? "Gerando arquivo…" : "Exportar para Excel (.xlsx)"}
            </Text>
          </Pressable>
        </SectionCard>

        {/* ══ MOTORISTAS ══════════════════════════════════════════════════ */}
        <SectionCard
          title={`Motoristas  (${ativos} ativo${ativos !== 1 ? "s" : ""}${inativos ? `  ·  ${inativos} inativo${inativos !== 1 ? "s" : ""}` : ""})`}
          icon={<UserCheck size={18} color={colors.primary} />}
        >
          <Pressable
            style={[styles.addMotoBtn, { borderColor: colors.primary, backgroundColor: colors.primary + "0E" }]}
            onPress={() => setMotoModal({ open: true, motorista: null })}
          >
            <Plus size={16} color={colors.primary} />
            <Text style={[styles.addMotoBtnText, { color: colors.primary }]}>Cadastrar novo motorista</Text>
          </Pressable>

          {settings.motoristas.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nenhum motorista cadastrado.
            </Text>
          ) : (
            settings.motoristas.map((m) => (
              <MotoristaCadastroItem
                key={m.id}
                motorista={m}
                onEdit={() => setMotoModal({ open: true, motorista: m })}
                onRemove={() => confirmRemoveMotorista(m)}
              />
            ))
          )}
        </SectionCard>

        {/* ══ PLACAS DO CAVALO ════════════════════════════════════════════ */}
        <SectionCard
          title={`Placas do Cavalo  (${settings.placasCavalo.length})`}
          icon={<Truck size={18} color={colors.primary} />}
        >
          <EditableList
            items={settings.placasCavalo}
            placeholder="Ex: NOJ2358 ou NOW3D40"
            onAdd={addPlaca} onRemove={removePlaca}
            autoCapitalize="characters"
          />
        </SectionCard>

        {/* ══ PIN DO ADMINISTRADOR ════════════════════════════════════════ */}
        <SectionCard
          title="PIN do Administrador"
          icon={<Lock size={18} color={colors.primary} />}
        >
          <Text style={[styles.pinHint, { color: colors.mutedForeground }]}>
            PIN de 6 dígitos para acesso secreto do gestor (3 toques no logo THIBA).
          </Text>
          <Pressable
            style={[styles.adminPinBtn, { backgroundColor: "#1e3a8a" }]}
            onPress={() => setAdminPinModal(true)}
          >
            <Lock size={16} color="#fff" />
            <Text style={styles.adminPinText}>Alterar PIN do Administrador</Text>
          </Pressable>
        </SectionCard>

        {/* ══ RESETAR ═════════════════════════════════════════════════════ */}
        <Pressable
          style={[styles.resetBtn, { borderColor: "#ef4444" }]}
          onPress={() => {
            const msg = "Restaurar todas as listas para os valores padrão?";
            if (Platform.OS === "web") { if (window.confirm(msg)) resetToDefaults(); }
            else { Alert.alert("Restaurar padrões", msg, [{ text: "Cancelar", style: "cancel" }, { text: "Restaurar", style: "destructive", onPress: resetToDefaults }]); }
          }}
        >
          <Text style={styles.resetText}>Restaurar Listas para o Padrão</Text>
        </Pressable>
      </ScrollView>

      {/* ── Modais ──────────────────────────────────────────────────────── */}
      <MotoristaModal
        visible={motoModal.open}
        motorista={motoModal.motorista}
        onSave={(data) => {
          if (motoModal.motorista) {
            updateMotorista(motoModal.motorista.id, data);
            Alert.alert("✅ Salvo", "Cadastro atualizado.");
          } else {
            addMotorista(data);
            Alert.alert("✅ Cadastrado", `${data.nome} adicionado.`);
          }
        }}
        onClose={() => setMotoModal({ open: false, motorista: null })}
      />

      <AdminPinModal
        visible={adminPinModal}
        onConfirm={(pin) => { setAdminPin(pin); setAdminPinModal(false); Alert.alert("✅ Salvo", "PIN do administrador atualizado."); }}
        onClose={() => setAdminPinModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingBottom: 20,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.4 },
  headerSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.72)", marginTop: 3 },
  content: { padding: 16 },

  // Exportação
  dateRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  fieldLabel: {
    fontSize: 11, fontFamily: "Inter_500Medium",
    textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8,
  },
  statusPicker: { flexDirection: "row", gap: 8, marginBottom: 14 },
  statusChip: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1.5, alignItems: "center",
  },
  statusChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  exportHint: {
    fontSize: 11, fontFamily: "Inter_400Regular",
    lineHeight: 16, marginBottom: 14,
  },
  exportBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14,
  },
  exportBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14 },

  // Motoristas
  addMotoBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 14, borderStyle: "dashed",
    paddingVertical: 12, paddingHorizontal: 16, marginBottom: 8,
  },
  addMotoBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 16 },

  // Admin PIN
  pinHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 12 },
  adminPinBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 13, borderRadius: 14,
  },
  adminPinText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },

  resetBtn: { alignItems: "center", paddingVertical: 14, borderRadius: 14, borderWidth: 1, marginTop: 8 },
  resetText: { color: "#ef4444", fontFamily: "Inter_600SemiBold", fontSize: 13 },
});
