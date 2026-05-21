import { Image } from "expo-image";
import { Lock } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { useSettings } from "@/contexts/SettingsContext";
import {
  ADMIN_LOCKOUT_MS,
  ADMIN_LOGIN_KEY,
  MOTORISTA_LOCKOUT_MS,
  MOTORISTA_LOGIN_KEY,
  checkLockout,
  clearAttempts,
  recordFailure,
} from "@/lib/loginSecurity";

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

// ── Lockout Banner ────────────────────────────────────────────────────────────
function LockoutBanner({ secs }: { secs: number }) {
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  const timeStr = `${mins}:${String(s).padStart(2, "0")}`;
  return (
    <View style={lb.wrap}>
      <Lock size={20} color="#f87171" />
      <View>
        <Text style={lb.title}>Acesso bloqueado</Text>
        <Text style={lb.sub}>
          Tente novamente em{" "}
          <Text style={lb.timer}>{timeStr}</Text>
        </Text>
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
  timer: {
    fontFamily: "Inter_700Bold",
    color: "#f87171",
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// MAIN LOGIN SCREEN
// ═════════════════════════════════════════════════════════════════════════════
type Step = "matricula" | "pin";

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { loginMotorista, loginAdmin } = useAuth();
  const { settings } = useSettings();

  // ── Etapa de login ──────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("matricula");
  const [matriculaInput, setMatriculaInput] = useState("");
  const [pinDigits, setPinDigits] = useState("");
  const [pinError, setPinError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Bloqueio motorista ──────────────────────────────────────────────────
  const [lockoutSecs, setLockoutSecs] = useState(0);
  const lockoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Admin easter egg ────────────────────────────────────────────────────
  const logoTapCount = useRef(0);
  const logoTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminDigits, setAdminDigits] = useState("");
  const [adminError, setAdminError] = useState(false);
  const [adminErrorMsg, setAdminErrorMsg] = useState<string | null>(null);
  const [adminLockoutSecs, setAdminLockoutSecs] = useState(0);
  const adminTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Verificar bloqueio ao montar ────────────────────────────────────────
  useEffect(() => {
    checkLockout(MOTORISTA_LOGIN_KEY).then(({ locked, remainingMs }) => {
      if (locked) startCountdown(remainingMs, "motorista");
    });
  }, []);

  // ── Helpers de countdown ────────────────────────────────────────────────
  function startCountdown(ms: number, who: "motorista" | "admin") {
    const secs = Math.ceil(ms / 1000);
    if (who === "motorista") {
      setLockoutSecs(secs);
      if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
      lockoutTimerRef.current = setInterval(() => {
        setLockoutSecs((prev) => {
          if (prev <= 1) {
            clearInterval(lockoutTimerRef.current!);
            lockoutTimerRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setAdminLockoutSecs(secs);
      if (adminTimerRef.current) clearInterval(adminTimerRef.current);
      adminTimerRef.current = setInterval(() => {
        setAdminLockoutSecs((prev) => {
          if (prev <= 1) {
            clearInterval(adminTimerRef.current!);
            adminTimerRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }

  useEffect(() => {
    return () => {
      if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
      if (adminTimerRef.current) clearInterval(adminTimerRef.current);
    };
  }, []);

  // ── Logo — 3 toques abrem o admin ───────────────────────────────────────
  const handleLogoTap = useCallback(() => {
    logoTapCount.current += 1;
    if (logoTapTimer.current) clearTimeout(logoTapTimer.current);
    if (logoTapCount.current >= 3) {
      logoTapCount.current = 0;
      // Verifica bloqueio do admin antes de abrir
      checkLockout(ADMIN_LOGIN_KEY).then(({ locked, remainingMs }) => {
        if (locked) {
          startCountdown(remainingMs, "admin");
        }
        setAdminDigits("");
        setAdminError(false);
        setAdminErrorMsg(null);
        setAdminModalOpen(true);
      });
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
    setPinDigits("");
    setPinError(false);
    setStep("pin");
  }

  // ── Etapa 2: PIN ────────────────────────────────────────────────────────
  const handleDigit = useCallback(
    async (d: string) => {
      if (lockoutSecs > 0) return;
      setPinError(false);
      setErrorMsg(null);
      const next = pinDigits + d;
      setPinDigits(next);

      if (next.length === 4) {
        const mat = matriculaInput.trim().toUpperCase();
        const motorista = settings.motoristas.find(
          (m) => m.matricula.toUpperCase() === mat && m.ativo
        );
        const pinCorreta = motorista?.pin ?? null;
        const ok = pinCorreta !== null && next === pinCorreta;

        if (ok) {
          await clearAttempts(MOTORISTA_LOGIN_KEY);
          loginMotorista(motorista!.nome);
        } else {
          setPinError(true);
          const { locked, remainingMs, attemptsLeft } = await recordFailure(
            MOTORISTA_LOGIN_KEY,
            MOTORISTA_LOCKOUT_MS
          );

          setTimeout(() => {
            setPinDigits("");
            setPinError(false);
            if (locked) {
              startCountdown(remainingMs, "motorista");
              setErrorMsg(null);
              setStep("matricula");
              setMatriculaInput("");
            } else {
              // Mensagem genérica — não revela se matrícula existe ou PIN está errado
              setErrorMsg(
                attemptsLeft === 1
                  ? "Matrícula ou PIN incorretos. Mais 1 tentativa antes do bloqueio."
                  : `Matrícula ou PIN incorretos. Tentativas restantes: ${attemptsLeft}.`
              );
            }
          }, 800);
        }
      }
    },
    [pinDigits, matriculaInput, settings.motoristas, loginMotorista, lockoutSecs]
  );

  const handleDelete = useCallback(() => {
    setPinError(false);
    setPinDigits((p) => p.slice(0, -1));
  }, []);

  // ── Admin PIN ───────────────────────────────────────────────────────────
  const handleAdminDigit = useCallback(
    async (d: string) => {
      if (adminLockoutSecs > 0) return;
      setAdminError(false);
      setAdminErrorMsg(null);
      const next = adminDigits + d;
      setAdminDigits(next);

      if (next.length === 6) {
        const ok = next === settings.adminPin;
        if (ok) {
          await clearAttempts(ADMIN_LOGIN_KEY);
          setAdminModalOpen(false);
          loginAdmin();
        } else {
          setAdminError(true);
          const { locked, remainingMs, attemptsLeft } = await recordFailure(
            ADMIN_LOGIN_KEY,
            ADMIN_LOCKOUT_MS
          );

          setTimeout(() => {
            setAdminDigits("");
            setAdminError(false);
            if (locked) {
              startCountdown(remainingMs, "admin");
              setAdminErrorMsg(null);
            } else {
              setAdminErrorMsg(
                attemptsLeft === 1
                  ? "PIN incorreto. Última tentativa."
                  : `PIN incorreto. Tentativas restantes: ${attemptsLeft}.`
              );
            }
          }, 800);
        }
      }
    },
    [adminDigits, settings.adminPin, loginAdmin, adminLockoutSecs]
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
        {lockoutSecs > 0 && <LockoutBanner secs={lockoutSecs} />}

        {/* ETAPA 1 — Matrícula */}
        {step === "matricula" && lockoutSecs === 0 && (
          <>
            <Text style={styles.fieldLabel}>Matrícula</Text>
            <TextInput
              style={styles.matriculaInput}
              value={matriculaInput}
              onChangeText={(v) => {
                setMatriculaInput(v.toUpperCase());
                setErrorMsg(null);
              }}
              placeholder="Ex: THB-00001"
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
        {step === "pin" && lockoutSecs === 0 && (
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
              disabled={lockoutSecs > 0}
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
            <Text style={adm.title}>Acesso Gestor</Text>
            <Text style={adm.sub}>PIN de administrador (6 dígitos)</Text>

            {/* Bloqueio admin */}
            {adminLockoutSecs > 0 ? (
              <LockoutBanner secs={adminLockoutSecs} />
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
                  disabled={adminLockoutSecs > 0}
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
