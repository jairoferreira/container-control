import { Image } from "expo-image";
import { Lock } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, AuthApiError } from "@/lib/authApi";

// ── PIN Dots ──────────────────────────────────────────────────────────────────
function PinDots({
  filled,
  total,
  error,
}: {
  filled: number;
  total: number;
  error?: boolean;
}) {
  return (
    <View style={dot.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            dot.base,
            i < filled ? (error ? dot.error : dot.filled) : dot.empty,
          ]}
        />
      ))}
    </View>
  );
}
const dot = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 20,
    justifyContent: "center",
    marginVertical: 28,
  },
  base: { width: 22, height: 22, borderRadius: 11 },
  filled: { backgroundColor: "#fff" },
  error: { backgroundColor: "#f87171" },
  empty: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
  },
});

// ── Numeric Keypad ────────────────────────────────────────────────────────────
const ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "⌫"],
];
function NumPad({
  onDigit,
  onDelete,
  disabled,
}: {
  onDigit: (d: string) => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={[pad.grid, disabled && pad.disabled]}>
      {ROWS.map((row, ri) => (
        <View key={ri} style={pad.row}>
          {row.map((k, ki) => (
            <Pressable
              key={ki}
              style={({ pressed }) => [
                pad.key,
                k === "" && pad.hidden,
                pressed && k !== "" && !disabled && pad.pressed,
              ]}
              onPress={() => {
                if (disabled || k === "") return;
                if (k === "⌫") onDelete();
                else onDigit(k);
              }}
              disabled={k === "" || disabled}
              hitSlop={4}
            >
              <Text style={pad.keyText}>{k}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}
const pad = StyleSheet.create({
  grid: { gap: 10, paddingHorizontal: 12 },
  row: { flexDirection: "row", justifyContent: "center", gap: 10 },
  key: {
    flex: 1,
    height: 62,
    borderRadius: 16,
    maxWidth: 120,
    backgroundColor: "rgba(255,255,255,0.09)",
    alignItems: "center",
    justifyContent: "center",
  },
  hidden: { opacity: 0 } as any,
  pressed: { backgroundColor: "rgba(255,255,255,0.20)" },
  disabled: { opacity: 0.35 },
  keyText: {
    fontSize: 24,
    fontFamily: "Inter_500Medium",
    color: "#fff",
  },
});

// ── Lockout Banner (texto vindo do servidor) ──────────────────────────────────
function LockoutBanner({ message }: { message: string }) {
  return (
    <View style={lb.wrap}>
      <Lock size={20} color="#f87171" />
      <View style={{ flex: 1 }}>
        <Text style={lb.title}>Acesso bloqueado</Text>
        <Text style={lb.sub}>{message}</Text>
      </View>
    </View>
  );
}
const lb = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(248,113,113,0.12)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.3)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  title: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#f87171",
  },
  sub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(248,113,113,0.8)",
    marginTop: 1,
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// MAIN LOGIN SCREEN
// ═════════════════════════════════════════════════════════════════════════════
type Step = "matricula" | "pin";

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { loginMotorista, loginRestrito } = useAuth();

  // ── Etapa de login ──────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("matricula");
  const [matriculaInput, setMatriculaInput] = useState("");
  const [pinDigits, setPinDigits] = useState("");
  const [pinError, setPinError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lockMsg, setLockMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Admin easter egg ────────────────────────────────────────────────────
  const logoTapCount = useRef(0);
  const logoTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminDigits, setAdminDigits] = useState("");
  const [adminError, setAdminError] = useState(false);
  const [adminErrorMsg, setAdminErrorMsg] = useState<string | null>(null);
  const [adminLockMsg, setAdminLockMsg] = useState<string | null>(null);
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  // ── Logo — 3 toques abrem o admin ───────────────────────────────────────
  const handleLogoTap = useCallback(() => {
    logoTapCount.current += 1;
    if (logoTapTimer.current) clearTimeout(logoTapTimer.current);
    if (logoTapCount.current >= 3) {
      logoTapCount.current = 0;
      setAdminDigits("");
      setAdminError(false);
      setAdminErrorMsg(null);
      setAdminLockMsg(null);
      setAdminModalOpen(true);
    } else {
      logoTapTimer.current = setTimeout(() => {
        logoTapCount.current = 0;
      }, 1500);
    }
  }, []);

  // ── Etapa 1: confirmar matrícula ────────────────────────────────────────
  function handleConfirmarMatricula() {
    Keyboard.dismiss();
    const mat = matriculaInput.trim().toUpperCase();
    if (!mat) {
      setErrorMsg("Digite sua matrícula.");
      return;
    }
    setErrorMsg(null);
    setLockMsg(null);
    setPinDigits("");
    setPinError(false);
    setStep("pin");
  }

  // ── Etapa 2: PIN — validado no servidor ──────────────────────────────────
  const handleDigit = useCallback(
    async (d: string) => {
      if (submitting) return;
      setPinError(false);
      setErrorMsg(null);
      const next = pinDigits + d;
      setPinDigits(next);

      if (next.length === 4) {
        setSubmitting(true);
        const mat = matriculaInput.trim().toUpperCase();
        try {
          const motorista = await authApi.loginMotorista(mat, next);
          loginMotorista(motorista.nome);
        } catch (err) {
          setPinError(true);
          setTimeout(() => {
            setPinDigits("");
            setPinError(false);
            if (err instanceof AuthApiError && err.status === 423) {
              setLockMsg(err.message);
              setStep("matricula");
              setMatriculaInput("");
            } else if (err instanceof AuthApiError) {
              setErrorMsg(err.message);
            } else {
              setErrorMsg("Não foi possível conectar. Verifique sua internet.");
            }
          }, 800);
        } finally {
          setSubmitting(false);
        }
      }
    },
    [pinDigits, matriculaInput, loginMotorista, submitting]
  );

  const handleDelete = useCallback(() => {
    setPinError(false);
    setPinDigits((p) => p.slice(0, -1));
  }, []);

  // ── Admin PIN — validado no servidor ─────────────────────────────────────
  const handleAdminDigit = useCallback(
    async (d: string) => {
      if (adminSubmitting) return;
      setAdminError(false);
      setAdminErrorMsg(null);
      const next = adminDigits + d;
      setAdminDigits(next);

      if (next.length === 6) {
        setAdminSubmitting(true);
        try {
          const { role } = await authApi.loginRestrito(next);
          setAdminModalOpen(false);
          loginRestrito(role, next);
        } catch (err) {
          setAdminError(true);
          setTimeout(() => {
            setAdminDigits("");
            setAdminError(false);
            if (err instanceof AuthApiError && err.status === 423) {
              setAdminLockMsg(err.message);
            } else if (err instanceof AuthApiError) {
              setAdminErrorMsg(err.message);
            } else {
              setAdminErrorMsg("Não foi possível conectar. Verifique sua internet.");
            }
          }, 800);
        } finally {
          setAdminSubmitting(false);
        }
      }
    },
    [adminDigits, loginRestrito, adminSubmitting]
  );

  const handleAdminDelete = useCallback(() => {
    setAdminError(false);
    setAdminDigits((p) => p.slice(0, -1));
  }, []);

  // ── Layout ──────────────────────────────────────────────────────────────
  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const botPad = Platform.OS === "web" ? 20 : insets.bottom + 8;

  return (
    <View style={[styles.root, { paddingTop: topPad, paddingBottom: botPad }]}>

      {/* ── Logo ── */}
      <Pressable style={styles.logoArea} onPress={handleLogoTap}>
        <View style={styles.logoWrap}>
          <Image
            source={require("@/assets/images/logo-thiba.jpg")}
            style={styles.logoImg}
            contentFit="contain"
          />
        </View>
        <Text style={styles.brandName}>THIBA LOGÍSTICA</Text>
        <Text style={styles.brandSub}>Sistema de Cautelas</Text>
      </Pressable>

      {/* ── Card central ── */}
      <View style={styles.card}>

        {/* Banner de bloqueio */}
        {lockMsg && <LockoutBanner message={lockMsg} />}

        {/* ETAPA 1 — Matrícula */}
        {step === "matricula" && (
          <>
            <Text style={styles.fieldLabel}>Matrícula</Text>
            <TextInput
              style={styles.matriculaInput}
              value={matriculaInput}
              onChangeText={(v) => {
                setMatriculaInput(v.toUpperCase());
                setErrorMsg(null);
              }}
              placeholder="Ex: THB001"
              placeholderTextColor="rgba(255,255,255,0.25)"
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
              maxLength={12}
              returnKeyType="next"
              onSubmitEditing={handleConfirmarMatricula}
            />

            {errorMsg && (
              <Text style={styles.errorText}>{errorMsg}</Text>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.continueBtn,
                pressed && styles.continueBtnPressed,
              ]}
              onPress={handleConfirmarMatricula}
            >
              <Text style={styles.continueBtnText}>Continuar</Text>
            </Pressable>

            <Text style={styles.hint}>
              Use a matrícula fornecida pelo gestor
            </Text>
          </>
        )}

        {/* ETAPA 2 — PIN */}
        {step === "pin" && (
          <>
            <View style={styles.pinHeader}>
              <Text style={styles.fieldLabel}>PIN de acesso</Text>
              <Pressable
                onPress={() => {
                  setStep("matricula");
                  setPinDigits("");
                  setPinError(false);
                  setErrorMsg(null);
                }}
              >
                <Text style={styles.backLink}>← Voltar</Text>
              </Pressable>
            </View>

            <PinDots filled={pinDigits.length} total={4} error={pinError} />

            {errorMsg && !pinError && (
              <Text style={[styles.errorText, { marginBottom: 12, textAlign: "center" }]}>
                {errorMsg}
              </Text>
            )}

            <NumPad
              onDigit={handleDigit}
              onDelete={handleDelete}
              disabled={submitting}
            />
          </>
        )}
      </View>

      {/* ── Admin PIN Modal ── */}
      <Modal
        visible={adminModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAdminModalOpen(false)}
      >
        <View style={adm.overlay}>
          <View style={adm.box}>
            <Text style={adm.title}>Acesso Restrito</Text>
            <Text style={adm.sub}>PIN de administrador ou de consulta (6 dígitos)</Text>

            {adminLockMsg ? (
              <LockoutBanner message={adminLockMsg} />
            ) : (
              <>
                <PinDots
                  filled={adminDigits.length}
                  total={6}
                  error={adminError}
                />
                {adminErrorMsg && (
                  <Text style={adm.errText}>{adminErrorMsg}</Text>
                )}
                <NumPad
                  onDigit={handleAdminDigit}
                  onDelete={handleAdminDelete}
                  disabled={adminSubmitting}
                />
              </>
            )}

            <Pressable
              style={adm.cancelBtn}
              onPress={() => setAdminModalOpen(false)}
            >
              <Text style={adm.cancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 28,
  },

  logoArea: { alignItems: "center", gap: 10 },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  logoImg: { width: 96, height: 96 },
  brandName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 2.5,
  },
  brandSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 24,
  },

  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },

  matriculaInput: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    letterSpacing: 2,
    marginBottom: 12,
  },

  errorText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#f87171",
    marginBottom: 12,
  },

  continueBtn: {
    backgroundColor: "#3b82f6",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  continueBtnPressed: { backgroundColor: "#2563eb" },
  continueBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },

  hint: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.3)",
    marginTop: 14,
    lineHeight: 18,
  },

  pinHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  backLink: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#60a5fa",
  },
});

const adm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  box: {
    backgroundColor: "#1e293b",
    borderRadius: 28,
    padding: 24,
    width: "100%",
    maxWidth: 420,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textAlign: "center",
  },
  sub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    marginBottom: 4,
  },
  errText: {
    color: "#f87171",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    marginBottom: 4,
    marginTop: -8,
  },
  cancelBtn: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  cancelText: {
    color: "rgba(255,255,255,0.5)",
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
});
