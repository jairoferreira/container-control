import { Eye, EyeOff, RefreshCw, User } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
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
import type { Motorista } from "@/contexts/SettingsContext";
import { useColors } from "@/hooks/useColors";

// ── Subcomponente: campo de texto ──────────────────────────────────────────
function Field({
  label,
  value,
  onChange,
  placeholder,
  autoCapitalize,
  keyboardType,
  maxLength,
  required,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoCapitalize?: "none" | "words" | "characters" | "sentences";
  keyboardType?: "default" | "numeric" | "phone-pad";
  maxLength?: number;
  required?: boolean;
  hint?: string;
}) {
  const colors = useColors();
  return (
    <View style={f.wrap}>
      <Text style={[f.label, { color: colors.mutedForeground }]}>
        {label.toUpperCase()}
        {required && <Text style={{ color: "#ef4444" }}> *</Text>}
      </Text>
      <TextInput
        style={[f.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.input }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize={autoCapitalize ?? "words"}
        keyboardType={keyboardType ?? "default"}
        maxLength={maxLength}
        returnKeyType="next"
      />
      {hint && <Text style={[f.hint, { color: colors.mutedForeground }]}>{hint}</Text>}
    </View>
  );
}
const f = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: {
    fontSize: 10, fontFamily: "Inter_500Medium",
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6,
  },
  input: {
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, fontFamily: "Inter_400Regular",
  },
  hint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
});

// ── Subcomponente: campo de PIN ────────────────────────────────────────────
function PinField({
  value,
  onChange,
  isEdit,
}: {
  value: string;
  onChange: (v: string) => void;
  isEdit: boolean;
}) {
  const colors = useColors();
  const [show, setShow] = useState(false);
  return (
    <View style={[f.wrap, { marginBottom: 18 }]}>
      <Text style={[f.label, { color: colors.mutedForeground }]}>
        PIN DE ACESSO (4 DÍGITOS){!isEdit && <Text style={{ color: "#ef4444" }}> *</Text>}
      </Text>
      <View style={[pin.row, { borderColor: colors.border, backgroundColor: colors.input }]}>
        <TextInput
          style={[pin.input, { color: colors.foreground }]}
          value={value}
          onChangeText={(t) => onChange(t.replace(/\D/g, "").slice(0, 4))}
          placeholder={isEdit ? "•••• (manter atual)" : "0000"}
          placeholderTextColor={colors.mutedForeground}
          keyboardType="numeric"
          secureTextEntry={!show}
          maxLength={4}
        />
        <Pressable onPress={() => setShow((s) => !s)} style={pin.eye} hitSlop={8}>
          {show
            ? <EyeOff size={16} color={colors.mutedForeground} />
            : <Eye size={16} color={colors.mutedForeground} />}
        </Pressable>
      </View>
      <Text style={[f.hint, { color: colors.mutedForeground }]}>
        {isEdit
          ? "Deixe em branco para manter o PIN atual. O PIN nunca fica salvo no celular do gestor."
          : "Informe ao motorista — esse PIN fica protegido no servidor, não é salvo em nenhum celular."}
      </Text>
    </View>
  );
}
const pin = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 14, overflow: "hidden",
  },
  input: {
    flex: 1, paddingVertical: 12,
    fontSize: 20, fontFamily: "Inter_500Medium", letterSpacing: 6,
  },
  eye: { paddingLeft: 8 },
});

// ═══════════════════════════════════════════════════════════════════════════
// MODAL PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
interface MotoristaFormData {
  matricula: string;
  nome: string;
  cnh: string;
  telefone: string;
  placa: string;
  ativo: boolean;
  pin: string;
}

interface MotoristaModalProps {
  visible: boolean;
  motorista?: Motorista | null;  // null = criar novo
  onSave: (data: MotoristaFormData) => Promise<void>;
  onClose: () => void;
}

const EMPTY: MotoristaFormData = {
  matricula: "", nome: "", cnh: "", telefone: "", placa: "", ativo: true, pin: "",
};

export function MotoristaModal({ visible, motorista, onSave, onClose }: MotoristaModalProps) {
  const colors = useColors();
  const isEdit = !!motorista;
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<MotoristaFormData>(EMPTY);

  useEffect(() => {
    if (visible) {
      setForm(motorista ? {
        matricula: motorista.matricula,
        nome: motorista.nome,
        cnh: motorista.cnh,
        telefone: motorista.telefone,
        placa: motorista.placa,
        ativo: motorista.ativo,
        pin: "",
      } : EMPTY);
    }
  }, [visible, motorista]);

  const set = (key: keyof MotoristaFormData) => (val: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  function warn(msg: string) {
    if (Platform.OS === "web") alert(msg);
    else Alert.alert("Atenção", msg);
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      warn("Nome é obrigatório.");
      return;
    }
    if (!isEdit && form.pin.length !== 4) {
      warn("PIN de 4 dígitos é obrigatório para um novo motorista.");
      return;
    }
    if (form.pin && form.pin.length !== 4) {
      warn("PIN deve ter exatamente 4 dígitos.");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      warn(err?.message ?? "Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={() => {}}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Cabeçalho */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + "18" }]}>
              <User size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {isEdit ? "Editar Motorista" : "Novo Motorista"}
              </Text>
              {isEdit && (
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {motorista?.nome}
                </Text>
              )}
            </View>
          </View>

          {/* Campos */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Matrícula — gerada automaticamente, editável */}
            <View style={mat.wrap}>
              <Text style={[f.label, { color: colors.mutedForeground }]}>
                MATRÍCULA
              </Text>
              <View style={[mat.row, { borderColor: colors.border, backgroundColor: colors.input }]}>
                <TextInput
                  style={[mat.input, { color: colors.foreground }]}
                  value={form.matricula}
                  onChangeText={(v) => set("matricula")(v.toUpperCase())}
                  placeholder={isEdit ? "" : "Deixe em branco para gerar (THB001...)"}
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="characters"
                  maxLength={12}
                  editable={!isEdit}
                />
                {!isEdit && (
                  <Pressable
                    style={[mat.regenBtn, { backgroundColor: colors.primary + "18" }]}
                    onPress={() => set("matricula")("")}
                    hitSlop={6}
                  >
                    <RefreshCw size={14} color={colors.primary} />
                  </Pressable>
                )}
              </View>
              <Text style={[f.hint, { color: colors.mutedForeground }]}>
                {isEdit
                  ? "A matrícula não pode ser alterada depois de criada."
                  : "Em branco, o servidor gera automaticamente (THB001, THB002...)"}
              </Text>
            </View>

            <Field
              label="Nome completo"
              value={form.nome}
              onChange={(v) => set("nome")(v.toUpperCase())}
              placeholder="Ex: JOÃO SILVA SANTOS"
              autoCapitalize="characters"
              required
            />

            <Field
              label="CNH"
              value={form.cnh}
              onChange={set("cnh")}
              placeholder="Ex: 12345678901"
              keyboardType="numeric"
              maxLength={11}
              autoCapitalize="none"
              hint="Número do registro na CNH (11 dígitos)"
            />

            <Field
              label="Telefone / WhatsApp"
              value={form.telefone}
              onChange={set("telefone")}
              placeholder="Ex: (92) 98765-4321"
              keyboardType="phone-pad"
              autoCapitalize="none"
            />

            <Field
              label="Placa habitual do cavalo"
              value={form.placa}
              onChange={(v) => set("placa")(v.toUpperCase())}
              placeholder="Ex: NOJ2358"
              autoCapitalize="characters"
              maxLength={8}
              hint="Placa que esse motorista usa com mais frequência"
            />

            <PinField value={form.pin} onChange={set("pin")} isEdit={isEdit} />

            {/* Status ativo/inativo */}
            <View style={[styles.statusRow, { borderColor: colors.border }]}>
              <View>
                <Text style={[styles.statusLabel, { color: colors.foreground }]}>Motorista ativo</Text>
                <Text style={[styles.statusHint, { color: colors.mutedForeground }]}>
                  Inativos não aparecem no formulário de cautela
                </Text>
              </View>
              <Switch
                value={form.ativo}
                onValueChange={set("ativo")}
                trackColor={{ false: colors.muted, true: "#22c55e" }}
                thumbColor="#fff"
              />
            </View>

            {/* Botões */}
            <View style={styles.btnRow}>
              <Pressable
                style={[styles.btn, { borderColor: colors.border }]}
                onPress={onClose}
              >
                <Text style={[styles.btnText, { color: colors.mutedForeground }]}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnPrimary, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={[styles.btnText, { color: "#fff" }]}>
                  {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const mat = StyleSheet.create({
  wrap: { marginBottom: 14 },
  row: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 14, overflow: "hidden",
  },
  input: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontFamily: "Inter_600SemiBold", letterSpacing: 1,
  },
  regenBtn: {
    paddingHorizontal: 14, paddingVertical: 12,
    alignItems: "center", justifyContent: "center",
  },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    minHeight: "60%",
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignSelf: "center",
    marginTop: 12, marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 16, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  body: { padding: 20, paddingBottom: 32 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  statusLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  statusHint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  btnRow: { flexDirection: "row", gap: 10 },
  btn: {
    flex: 1, paddingVertical: 14,
    borderRadius: 14, borderWidth: 1,
    alignItems: "center",
  },
  btnPrimary: { borderWidth: 0 },
  btnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
