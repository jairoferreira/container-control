import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  CloudOff,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Truck,
  UserCheck,
  UserX,
} from "lucide-react-native";

import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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

// ── SectionCard ───────────────────────────────────────────────────────────
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

// ── Lista editável simples (placas) ───────────────────────────────────────
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

// ── Card de motorista individual ──────────────────────────────────────────
function MotoristaCadastroItem({
  motorista, onEdit, onRemove,
}: { motorista: Motorista; onEdit: () => void; onRemove: () => void }) {
  const colors = useColors();
  const ativo = motorista.ativo;
  return (
    <View style={[mitem.wrap, { borderBottomColor: colors.border }]}>
      {/* Avatar */}
      <View style={[mitem.avatar, { backgroundColor: ativo ? colors.primary + "18" : colors.muted }]}>
        <Text style={[mitem.avatarText, { color: ativo ? colors.primary : colors.mutedForeground }]}>
          {motorista.nome.charAt(0)}
        </Text>
      </View>
      {/* Dados */}
      <View style={{ flex: 1, gap: 3 }}>
        <View style={mitem.nomeRow}>
          <Text style={[mitem.nome, { color: colors.foreground }]} numberOfLines={1}>
            {motorista.nome}
          </Text>
          {motorista.matricula ? (
            <Text style={[mitem.matricula, { color: colors.mutedForeground }]}>
              {motorista.matricula}
            </Text>
          ) : null}
        </View>
        <View style={mitem.badges}>
          {motorista.cnh ? (
            <Text style={[mitem.badge, { backgroundColor: "#eff6ff", color: "#1d4ed8" }]}>
              CNH {motorista.cnh.slice(-4).padStart(motorista.cnh.length, "•")}
            </Text>
          ) : null}
          {motorista.telefone ? (
            <Text style={[mitem.badge, { backgroundColor: "#f0fdf4", color: "#15803d" }]}>
              📞 {motorista.telefone}
            </Text>
          ) : null}
          {motorista.placa ? (
            <Text style={[mitem.badge, { backgroundColor: "#fefce8", color: "#854d0e" }]}>
              🚛 {motorista.placa}
            </Text>
          ) : null}
          <View style={[mitem.statusChip, { backgroundColor: ativo ? "#dcfce7" : "#fee2e2" }]}>
            {ativo
              ? <UserCheck size={10} color="#15803d" />
              : <UserX size={10} color="#dc2626" />}
            <Text style={[mitem.statusText, { color: ativo ? "#15803d" : "#dc2626" }]}>
              {ativo ? "Ativo" : "Inativo"}
            </Text>
          </View>
        </View>
        <Text style={[mitem.pinHint, { color: colors.mutedForeground }]}>
          PIN: {motorista.pin === "0000" ? "padrão (0000)" : "personalizado"}
        </Text>
      </View>
      {/* Ações */}
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

// ── PIN Modal Admin ───────────────────────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════════════
// TELA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export default function ConfiguracoesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const botPad = Platform.OS === "web" ? 100 : 0;

  const {
    settings,
    addMotorista, updateMotorista, removeMotorista,
    addPlaca, removePlaca,
    setApiUrl, setSyncEnabled,
    setAdminPin, resetToDefaults,
  } = useSettings();

  const { sincronizar, syncState } = useCautela();
  const [apiUrlInput, setApiUrlInput] = useState(settings.apiUrl);
  const [syncing, setSyncing] = useState(false);

  // Motorista modal state
  const [motoModal, setMotoModal] = useState<{ open: boolean; motorista: Motorista | null }>({ open: false, motorista: null });
  const [adminPinModal, setAdminPinModal] = useState(false);

  const ativos = settings.motoristas.filter((m) => m.ativo).length;
  const inativos = settings.motoristas.length - ativos;

  async function handleSync() {
    setSyncing(true);
    const { ok, erros } = await sincronizar(settings.apiUrl);
    setSyncing(false);
    if (erros === 0) Alert.alert("✅ Sincronizado", `${ok} cautela(s) enviada(s).`);
    else Alert.alert("⚠️ Parcial", `${ok} enviadas, ${erros} com erro.`);
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
          <Text style={styles.headerSub}>Cadastros e sincronização em nuvem</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ══ MOTORISTAS ══════════════════════════════════════════════════ */}
        <SectionCard
          title={`Motoristas  (${ativos} ativo${ativos !== 1 ? "s" : ""}${inativos ? `  ·  ${inativos} inativo${inativos !== 1 ? "s" : ""}` : ""})`}
          icon={<UserCheck size={18} color={colors.primary} />}
        >
          {/* Botão adicionar */}
          <Pressable
            style={[styles.addMotoBtn, { borderColor: colors.primary, backgroundColor: colors.primary + "0E" }]}
            onPress={() => setMotoModal({ open: true, motorista: null })}
          >
            <Plus size={16} color={colors.primary} />
            <Text style={[styles.addMotoBtnText, { color: colors.primary }]}>Cadastrar novo motorista</Text>
          </Pressable>

          {/* Lista */}
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

        {/* ══ SINCRONIZAÇÃO EM NUVEM ══════════════════════════════════════ */}
        <SectionCard title="Sincronização em Nuvem" icon={<Cloud size={18} color={colors.primary} />}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              {settings.syncEnabled
                ? <Cloud size={16} color="#22c55e" />
                : <CloudOff size={16} color={colors.mutedForeground} />}
              <Text style={[styles.switchText, { color: colors.foreground }]}>
                {settings.syncEnabled ? "Sincronização ativada" : "Sincronização desativada"}
              </Text>
            </View>
            <Switch value={settings.syncEnabled} onValueChange={setSyncEnabled}
              trackColor={{ false: colors.muted, true: "#22c55e" }} thumbColor="#fff" />
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>URL DO SERVIDOR</Text>
          <View style={styles.urlRow}>
            <TextInput
              style={[styles.urlInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.input }]}
              value={apiUrlInput} onChangeText={setApiUrlInput}
              placeholder="http://192.168.1.100:3000"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none" keyboardType="url"
            />
            <Pressable style={[styles.saveUrlBtn, { backgroundColor: colors.primary }]}
              onPress={() => { setApiUrl(apiUrlInput); Alert.alert("Salvo", "URL atualizada."); }}>
              <Text style={styles.saveUrlText}>Salvar</Text>
            </Pressable>
          </View>
          <Text style={[styles.urlHint, { color: colors.mutedForeground }]}>
            IP local da máquina onde o servidor está rodando
          </Text>

          {syncState.lastSync && (
            <View style={[styles.syncStatus, { backgroundColor: colors.muted }]}>
              {syncState.status === "ok"
                ? <CheckCircle2 size={14} color="#22c55e" />
                : <AlertCircle size={14} color="#f59e0b" />}
              <Text style={[styles.syncStatusText, { color: colors.mutedForeground }]}>
                Último sync: {syncState.lastSync}
                {syncState.pendentes > 0 ? `  ·  ${syncState.pendentes} pendente(s)` : ""}
              </Text>
            </View>
          )}

          <Pressable
            style={[styles.syncBtn, { backgroundColor: syncing ? colors.muted : "#1e3a8a" }]}
            onPress={handleSync} disabled={syncing}
          >
            {syncing ? <ActivityIndicator size="small" color="#fff" /> : <RefreshCw size={16} color="#fff" />}
            <Text style={styles.syncBtnText}>{syncing ? "Sincronizando…" : "Sincronizar Agora"}</Text>
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

      {/* ── Modais ─────────────────────────────────────────────────────── */}
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

  addMotoBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 14, borderStyle: "dashed",
    paddingVertical: 12, paddingHorizontal: 16, marginBottom: 8,
  },
  addMotoBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 16 },

  pinHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 12 },
  adminPinBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 13, borderRadius: 14,
  },
  adminPinText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },

  switchRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 16, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5E7EB",
  },
  switchLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  switchText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 },
  urlRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  urlInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, fontFamily: "Inter_400Regular" },
  saveUrlBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, justifyContent: "center" },
  saveUrlText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  urlHint: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16, marginBottom: 12 },
  syncStatus: {
    flexDirection: "row", alignItems: "center", gap: 6,
    padding: 10, borderRadius: 10, marginBottom: 8,
  },
  syncStatusText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  syncBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 13, borderRadius: 14, marginTop: 4,
  },
  syncBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  resetBtn: { alignItems: "center", paddingVertical: 14, borderRadius: 14, borderWidth: 1, marginTop: 8 },
  resetText: { color: "#ef4444", fontFamily: "Inter_600SemiBold", fontSize: 13 },
});
