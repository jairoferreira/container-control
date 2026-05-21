import { Image } from "expo-image";
import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";

// ── PIN Dots ───────────────────────────────────────────────────────────────
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
            i < filled
              ? error
                ? dot.filled_error
                : dot.filled
              : dot.empty,
          ]}
        />
      ))}
    </View>
  );
}

const dot = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 18,
    justifyContent: "center",
    marginVertical: 24,
  },
  base: { width: 20, height: 20, borderRadius: 10 },
  filled: { backgroundColor: "#fff" },
  filled_error: { backgroundColor: "#f87171" },
  empty: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
});

// ── Numeric Keypad ─────────────────────────────────────────────────────────
const KEYROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "⌫"],
];

function NumPad({
  onDigit,
  onDelete,
}: {
  onDigit: (d: string) => void;
  onDelete: () => void;
}) {
  return (
    <View style={pad.grid}>
      {KEYROWS.map((row, ri) => (
        <View key={ri} style={pad.row}>
          {row.map((k, ki) => (
            <Pressable
              key={ki}
              style={({ pressed }) => [
                pad.key,
                k === "" && pad.hidden,
                pressed && k !== "" && pad.pressed,
              ]}
              onPress={() => {
                if (k === "⌫") onDelete();
                else if (k !== "") onDigit(k);
              }}
              disabled={k === ""}
              hitSlop={6}
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
  grid: { gap: 12, alignSelf: "stretch", paddingHorizontal: 16 },
  row: { flexDirection: "row", justifyContent: "center", gap: 12 },
  key: {
    flex: 1,
    height: 64,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 110,
  },
  hidden: { opacity: 0, pointerEvents: "none" } as any,
  pressed: { backgroundColor: "rgba(255,255,255,0.22)" },
  keyText: {
    fontSize: 24,
    fontFamily: "Inter_500Medium",
    color: "#fff",
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════
export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { loginMotorista, loginAdmin } = useAuth();
  const { settings } = useSettings();

  // Step state
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [pinDigits, setPinDigits] = useState("");
  const [pinError, setPinError] = useState(false);

  // Admin Easter egg — 3 taps on logo
  const logoTapCount = useRef(0);
  const logoTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminDigits, setAdminDigits] = useState("");
  const [adminError, setAdminError] = useState(false);

  // ── Logo 3-tap handler ────────────────────────────────────────────────
  const handleLogoTap = useCallback(() => {
    logoTapCount.current += 1;
    if (logoTapTimer.current) clearTimeout(logoTapTimer.current);
    if (logoTapCount.current >= 3) {
      logoTapCount.current = 0;
      setAdminDigits("");
      setAdminError(false);
      setAdminModalOpen(true);
    } else {
      logoTapTimer.current = setTimeout(() => {
        logoTapCount.current = 0;
      }, 1500);
    }
  }, []);

  // ── Motorista PIN handlers ────────────────────────────────────────────
  const handleDigit = useCallback(
    (d: string) => {
      setPinError(false);
      const next = pinDigits + d;
      setPinDigits(next);
      if (next.length === 4) {
        const ok = loginMotorista(selectedName!, next, settings.motoristaPins);
        if (!ok) {
          setPinError(true);
          setTimeout(() => {
            setPinDigits("");
            setPinError(false);
          }, 900);
        }
        // If ok — AuthContext user is set, AppGate will switch to app
      }
    },
    [pinDigits, selectedName, loginMotorista, settings.motoristaPins]
  );

  const handleDelete = useCallback(() => {
    setPinError(false);
    setPinDigits((p) => p.slice(0, -1));
  }, []);

  // ── Admin PIN handlers ────────────────────────────────────────────────
  const handleAdminDigit = useCallback(
    (d: string) => {
      setAdminError(false);
      const next = adminDigits + d;
      setAdminDigits(next);
      if (next.length === 6) {
        const ok = loginAdmin(next, settings.adminPin);
        if (!ok) {
          setAdminError(true);
          setTimeout(() => {
            setAdminDigits("");
            setAdminError(false);
          }, 900);
        } else {
          setAdminModalOpen(false);
        }
      }
    },
    [adminDigits, loginAdmin, settings.adminPin]
  );

  const handleAdminDelete = useCallback(() => {
    setAdminError(false);
    setAdminDigits((p) => p.slice(0, -1));
  }, []);

  const selectName = useCallback((nome: string) => {
    setSelectedName(nome);
    setPinDigits("");
    setPinError(false);
  }, []);

  const goBack = useCallback(() => {
    setSelectedName(null);
    setPinDigits("");
    setPinError(false);
  }, []);

  const topPad = Platform.OS === "web" ? 24 : insets.top + 16;
  const botPad = Platform.OS === "web" ? 24 : insets.bottom + 16;

  return (
    <View style={[styles.root, { paddingTop: topPad, paddingBottom: botPad }]}>
      {/* ── Logo ─────────────────────────────────────────────────────── */}
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

      {/* ── Divider ──────────────────────────────────────────────────── */}
      <View style={styles.divider} />

      {selectedName === null ? (
        /* ── Step 1: Name list ────────────────────────────────────── */
        <View style={styles.nameSection}>
          <Text style={styles.promptLabel}>Selecione seu nome</Text>
          <FlatList
            data={settings.motoristas}
            keyExtractor={(item) => item}
            style={styles.nameList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.nameListContent}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.nameItem,
                  pressed && styles.nameItemPressed,
                ]}
                onPress={() => selectName(item)}
              >
                <Text style={styles.nameItemText} numberOfLines={1}>
                  {item}
                </Text>
                <Text style={styles.nameArrow}>›</Text>
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.nameSep} />}
          />
        </View>
      ) : (
        /* ── Step 2: PIN entry ────────────────────────────────────── */
        <View style={styles.pinSection}>
          {/* Back */}
          <Pressable style={styles.backRow} onPress={goBack}>
            <Text style={styles.backArrow}>‹</Text>
            <Text style={styles.backName} numberOfLines={1}>
              {selectedName.split(" ")[0]}
            </Text>
          </Pressable>

          <Text
            style={[styles.pinPrompt, pinError && styles.pinPromptError]}
          >
            {pinError ? "PIN incorreto. Tente novamente." : "Digite seu PIN (4 dígitos)"}
          </Text>

          <PinDots filled={pinDigits.length} total={4} error={pinError} />

          <NumPad onDigit={handleDigit} onDelete={handleDelete} />
        </View>
      )}

      {/* ── Admin PIN Modal ───────────────────────────────────────────── */}
      <Modal
        visible={adminModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAdminModalOpen(false)}
      >
        <View style={modal.overlay}>
          <View style={modal.box}>
            <Text style={modal.title}>Acesso Gestor</Text>
            <Text style={modal.sub}>
              Digite o PIN de administrador (6 dígitos)
            </Text>

            <PinDots
              filled={adminDigits.length}
              total={6}
              error={adminError}
            />

            {adminError && (
              <Text style={modal.errorText}>PIN incorreto</Text>
            )}

            <NumPad onDigit={handleAdminDigit} onDelete={handleAdminDelete} />

            <Pressable
              style={modal.cancelBtn}
              onPress={() => setAdminModalOpen(false)}
            >
              <Text style={modal.cancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0f172a",
  },

  // Logo area
  logoArea: {
    alignItems: "center",
    paddingVertical: 20,
  },
  logoWrap: {
    width: 90,
    height: 90,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#fff",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  logoImg: {
    width: 90,
    height: 90,
  },
  brandName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 2,
  },
  brandSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
    marginTop: 4,
    letterSpacing: 0.5,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 24,
    marginVertical: 4,
  },

  // Name list
  nameSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  promptLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: "center",
  },
  nameList: {
    flex: 1,
  },
  nameListContent: {
    borderRadius: 18,
    overflow: "hidden",
  },
  nameItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  nameItemPressed: {
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  nameItemText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#fff",
  },
  nameArrow: {
    fontSize: 20,
    color: "rgba(255,255,255,0.3)",
    marginLeft: 8,
  },
  nameSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  // PIN section
  pinSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: "stretch",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    alignSelf: "flex-start",
    paddingHorizontal: 4,
  },
  backArrow: {
    fontSize: 28,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 30,
  },
  backName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.6)",
  },
  pinPrompt: {
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.55)",
    marginTop: 8,
  },
  pinPromptError: {
    color: "#f87171",
  },
});

const modal = StyleSheet.create({
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
    alignItems: "stretch",
    width: "100%",
    maxWidth: 420,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
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
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginTop: 6,
  },
  errorText: {
    color: "#f87171",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    marginBottom: 8,
  },
  cancelBtn: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  cancelText: {
    color: "rgba(255,255,255,0.55)",
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
});
