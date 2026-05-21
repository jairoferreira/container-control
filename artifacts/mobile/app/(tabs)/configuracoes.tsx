import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  CloudOff,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  Truck,
  User,
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
import { useCautela } from "@/contexts/CautelaContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useColors } from "@/hooks/useColors";

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
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
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: "rgba(15,23,42,0.05)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});

// ── Lista editável (motoristas ou placas) ─────────────────────────────────
function EditableList({
  items,
  placeholder,
  onAdd,
  onRemove,
  autoCapitalize,
}: {
  items: string[];
  placeholder: string;
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  autoCapitalize?: "none" | "words" | "characters" | "sentences";
}) {
  const colors = useColors();
  const [input, setInput] = useState("");

  function handleAdd() {
    const v = input.trim();
    if (!v) return;
    if (items.map((i) => i.toUpperCase()).includes(v.toUpperCase())) {
      Alert.alert("Aviso", "Já existe na lista.");
      return;
    }
    onAdd(v);
    setInput("");
  }

  return (
    <View>
      {/* Campo de adição */}
      <View style={[list.addRow, { borderColor: colors.border }]}>
        <TextInput
          style={[list.input, { color: colors.foreground }]}
          value={input}
          onChangeText={setInput}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize={autoCapitalize ?? "words"}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable
          style={[list.addBtn, { backgroundColor: colors.primary }]}
          onPress={handleAdd}
        >
          <Plus size={18} color="#fff" />
        </Pressable>
      </View>

      {/* Itens existentes */}
      {items.map((item) => (
        <View
          key={item}
          style={[list.item, { borderBottomColor: colors.border }]}
        >
          <Text style={[list.itemText, { color: colors.foreground }]} numberOfLines={1}>
            {item}
          </Text>
          <Pressable
            style={list.removeBtn}
            onPress={() => {
              const msg = `Remover "${item}"?`;
              if (Platform.OS === "web") {
                if (window.confirm(msg)) onRemove(item);
              } else {
                Alert.alert("Remover", msg, [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Remover", style: "destructive", onPress: () => onRemove(item) },
                ]);
              }
            }}
            hitSlop={8}
          >
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
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 10,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  addBtn: {
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  itemText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  removeBtn: { padding: 4 },
  count: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
    textAlign: "right",
  },
});

// ── PIN Modal ─────────────────────────────────────────────────────────────
function PinModal({
  visible,
  title,
  length,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  length: 4 | 6;
  onConfirm: (pin: string) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleConfirm() {
    if (value.length !== length) {
      setError(`PIN deve ter ${length} dígitos.`);
      return;
    }
    onConfirm(value);
    setValue("");
    setError("");
  }

  function handleClose() {
    setValue("");
    setError("");
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={pm.overlay}>
        <View style={[pm.box, { backgroundColor: colors.card }]}>
          <Text style={[pm.title, { color: colors.foreground }]}>{title}</Text>
          <TextInput
            style={[pm.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.input }]}
            value={value}
            onChangeText={(t) => { setValue(t.replace(/\D/g, "").slice(0, length)); setError(""); }}
            placeholder={"•".repeat(length)}
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            secureTextEntry
            maxLength={length}
            autoFocus
          />
          {error ? <Text style={pm.error}>{error}</Text> : null}
          <View style={pm.btnRow}>
            <Pressable style={[pm.btn, { borderColor: colors.border }]} onPress={handleClose}>
              <Text style={[pm.btnText, { color: colors.mutedForeground }]}>Cancelar</Text>
            </Pressable>
            <Pressable style={[pm.btn, pm.btnPrimary]} onPress={handleConfirm}>
              <Text style={[pm.btnText, { color: "#fff" }]}>Salvar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  box: {
    borderRadius: 22,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 12,
    gap: 14,
  },
  title: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "center" },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 22,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    letterSpacing: 8,
  },
  error: { color: "#ef4444", fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  btnRow: { flexDirection: "row", gap: 10 },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  btnPrimary: { backgroundColor: "#1e3a8a", borderColor: "#1e3a8a" },
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
    addMotorista,
    removeMotorista,
    addPlaca,
    removePlaca,
    setApiUrl,
    setSyncEnabled,
    setMotoristaPinFor,
    removeMotoristaPinFor,
    setAdminPin,
    resetToDefaults,
  } = useSettings();

  const { sincronizar, syncState } = useCautela();
  const [apiUrlInput, setApiUrlInput] = useState(settings.apiUrl);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "error" | null>(null);

  // PIN management modal state
  const [pinModal, setPinModal] = useState<{
    open: boolean;
    type: "motorista" | "admin";
    nome?: string;
  }>({ open: false, type: "motorista" });

  async function handleSync() {
    setSyncing(true);
    setTestResult(null);
    const { ok, erros } = await sincronizar(settings.apiUrl);
    setSyncing(false);
    if (erros === 0) {
      setTestResult("ok");
      Alert.alert("✅ Sincronizado", `${ok} cautela(s) enviada(s) com sucesso.`);
    } else {
      setTestResult("error");
      Alert.alert("⚠️ Parcial", `${ok} enviadas, ${erros} com erro.\nVerifique a URL do servidor.`);
    }
  }

  function handleSaveUrl() {
    setApiUrl(apiUrlInput);
    Alert.alert("Salvo", "URL do servidor atualizada.");
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Cabeçalho */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPad + 16 }]}>
        <Text style={styles.headerTitle}>CONFIGURAÇÕES</Text>
        <Text style={styles.headerSub}>Listas e sincronização em nuvem</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ══ MOTORISTAS ═══════════════════════════════════════════════════ */}
        <SectionCard
          title={`Motoristas  (${settings.motoristas.length})`}
          icon={<User size={18} color={colors.primary} />}
        >
          <EditableList
            items={settings.motoristas}
            placeholder="Nome completo do motorista"
            onAdd={addMotorista}
            onRemove={removeMotorista}
            autoCapitalize="words"
          />
        </SectionCard>

        {/* ══ PLACAS DO CAVALO ════════════════════════════════════════════ */}
        <SectionCard
          title={`Placas do Cavalo  (${settings.placasCavalo.length})`}
          icon={<Truck size={18} color={colors.primary} />}
        >
          <EditableList
            items={settings.placasCavalo}
            placeholder="Ex: NOJ2358 ou NOW3D40"
            onAdd={addPlaca}
            onRemove={removePlaca}
            autoCapitalize="characters"
          />
        </SectionCard>

        {/* ══ PINs DOS MOTORISTAS ═════════════════════════════════════════ */}
        <SectionCard
          title="PINs dos Motoristas"
          icon={<KeyRound size={18} color={colors.primary} />}
        >
          <Text style={[pinStyles.hint, { color: colors.mutedForeground }]}>
            PIN padrão é <Text style={{ fontFamily: "Inter_700Bold" }}>0000</Text> para motoristas sem PIN cadastrado. Toque no nome para definir um PIN personalizado.
          </Text>
          {settings.motoristas.map((nome) => {
            const hasPin = !!settings.motoristaPins[nome];
            return (
              <View key={nome} style={[pinStyles.row, { borderBottomColor: colors.border }]}>
                <View style={pinStyles.rowLeft}>
                  <Text style={[pinStyles.nome, { color: colors.foreground }]} numberOfLines={1}>
                    {nome}
                  </Text>
                  <View style={[pinStyles.badge, { backgroundColor: hasPin ? "#dcfce7" : colors.muted }]}>
                    <Text style={[pinStyles.badgeText, { color: hasPin ? "#15803d" : colors.mutedForeground }]}>
                      {hasPin ? "PIN definido" : "Padrão 0000"}
                    </Text>
                  </View>
                </View>
                <View style={pinStyles.rowBtns}>
                  <Pressable
                    style={[pinStyles.btn, { borderColor: colors.border }]}
                    onPress={() => setPinModal({ open: true, type: "motorista", nome })}
                    hitSlop={6}
                  >
                    <Lock size={14} color={colors.primary} />
                    <Text style={[pinStyles.btnText, { color: colors.primary }]}>
                      {hasPin ? "Alterar" : "Definir"}
                    </Text>
                  </Pressable>
                  {hasPin && (
                    <Pressable
                      style={[pinStyles.btn, { borderColor: "#fca5a5" }]}
                      onPress={() => removeMotoristaPinFor(nome)}
                      hitSlop={6}
                    >
                      <Text style={[pinStyles.btnText, { color: "#ef4444" }]}>Reset</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </SectionCard>

        {/* ══ PIN DO ADMINISTRADOR ════════════════════════════════════════ */}
        <SectionCard
          title="PIN do Administrador"
          icon={<Lock size={18} color={colors.primary} />}
        >
          <Text style={[pinStyles.hint, { color: colors.mutedForeground }]}>
            PIN de 6 dígitos usado no acesso secreto do gestor (3 toques no logo THIBA).
          </Text>
          <Pressable
            style={[pinStyles.adminBtn, { backgroundColor: "#1e3a8a" }]}
            onPress={() => setPinModal({ open: true, type: "admin" })}
          >
            <Lock size={16} color="#fff" />
            <Text style={pinStyles.adminBtnText}>Alterar PIN do Administrador</Text>
          </Pressable>
        </SectionCard>

        {/* ══ SINCRONIZAÇÃO EM NUVEM ═══════════════════════════════════════ */}
        <SectionCard
          title="Sincronização em Nuvem"
          icon={<Cloud size={18} color={colors.primary} />}
        >
          {/* Toggle de ativação */}
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              {settings.syncEnabled
                ? <Cloud size={16} color="#22c55e" />
                : <CloudOff size={16} color={colors.mutedForeground} />}
              <Text style={[styles.switchText, { color: colors.foreground }]}>
                {settings.syncEnabled ? "Sincronização ativada" : "Sincronização desativada"}
              </Text>
            </View>
            <Switch
              value={settings.syncEnabled}
              onValueChange={setSyncEnabled}
              trackColor={{ false: colors.muted, true: "#22c55e" }}
              thumbColor="#fff"
            />
          </View>

          {/* URL do servidor */}
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            URL DO SERVIDOR
          </Text>
          <View style={styles.urlRow}>
            <TextInput
              style={[
                styles.urlInput,
                { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.input },
              ]}
              value={apiUrlInput}
              onChangeText={setApiUrlInput}
              placeholder="http://192.168.1.100:3000"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Pressable
              style={[styles.saveUrlBtn, { backgroundColor: colors.primary }]}
              onPress={handleSaveUrl}
            >
              <Text style={styles.saveUrlText}>Salvar</Text>
            </Pressable>
          </View>

          <Text style={[styles.urlHint, { color: colors.mutedForeground }]}>
            Use o IP local da máquina onde o servidor está rodando (ex: http://192.168.1.100:3000)
          </Text>

          {/* Status de sync */}
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

          {syncState.pendentes > 0 && (
            <View style={[styles.pendingBadge, { backgroundColor: "#fef3c7" }]}>
              <AlertCircle size={14} color="#f59e0b" />
              <Text style={styles.pendingText}>
                {syncState.pendentes} cautela(s) ainda não sincronizada(s)
              </Text>
            </View>
          )}

          {/* Botão sincronizar */}
          <Pressable
            style={[
              styles.syncBtn,
              { backgroundColor: syncing ? colors.muted : "#1e3a8a" },
            ]}
            onPress={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <RefreshCw size={16} color="#fff" />
            )}
            <Text style={styles.syncBtnText}>
              {syncing ? "Sincronizando…" : "Sincronizar Agora"}
            </Text>
          </Pressable>
        </SectionCard>

        {/* ══ RESETAR ══════════════════════════════════════════════════════ */}
        <Pressable
          style={[styles.resetBtn, { borderColor: "#ef4444" }]}
          onPress={() => {
            const msg = "Restaurar todas as listas para os valores padrão?";
            if (Platform.OS === "web") {
              if (window.confirm(msg)) resetToDefaults();
            } else {
              Alert.alert("Restaurar padrões", msg, [
                { text: "Cancelar", style: "cancel" },
                { text: "Restaurar", style: "destructive", onPress: resetToDefaults },
              ]);
            }
          }}
        >
          <Text style={styles.resetText}>Restaurar Listas para o Padrão</Text>
        </Pressable>
      </ScrollView>

      {/* ── PIN Modal ───────────────────────────────────────────────────── */}
      <PinModal
        visible={pinModal.open}
        title={
          pinModal.type === "admin"
            ? "Novo PIN do Administrador"
            : `PIN de ${pinModal.nome?.split(" ")[0] ?? ""}`
        }
        length={pinModal.type === "admin" ? 6 : 4}
        onConfirm={(pin) => {
          if (pinModal.type === "admin") {
            setAdminPin(pin);
            Alert.alert("✅ Salvo", "PIN do administrador atualizado.");
          } else if (pinModal.nome) {
            setMotoristaPinFor(pinModal.nome, pin);
            Alert.alert("✅ Salvo", `PIN de ${pinModal.nome.split(" ")[0]} definido.`);
          }
          setPinModal({ open: false, type: "motorista" });
        }}
        onClose={() => setPinModal({ open: false, type: "motorista" })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.4,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.72)",
    marginTop: 3,
  },
  content: { padding: 16, gap: 0 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  switchLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  switchText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  urlRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  urlInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  saveUrlBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: "center",
  },
  saveUrlText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  urlHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
    marginBottom: 12,
  },
  syncStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  syncStatusText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  pendingText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#92400e",
  },
  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 4,
  },
  syncBtnText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  resetBtn: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  resetText: {
    color: "#ef4444",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});

const pinStyles = StyleSheet.create({
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  rowLeft: { flex: 1, gap: 3 },
  nome: { fontSize: 12, fontFamily: "Inter_500Medium" },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  rowBtns: { flexDirection: "row", gap: 6 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  adminBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 4,
  },
  adminBtnText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});
