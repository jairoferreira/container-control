import { Image } from "expo-image";
import { ChevronDown, ChevronUp, UserCheck } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
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

// ── PIN Dots ───────────────────────────────────────────────────────────────
function PinDots({ filled, total, error }: { filled: number; total: number; error?: boolean }) {
  return (
    <View style={dot.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[dot.base, i < filled ? (error ? dot.error : dot.filled) : dot.empty]}
        />
      ))}
    </View>
  );
}
const dot = StyleSheet.create({
  row: { flexDirection: "row", gap: 20, justifyContent: "center", marginVertical: 28 },
  base: { width: 22, height: 22, borderRadius: 11 },
  filled: { backgroundColor: "#fff" },
  error: { backgroundColor: "#f87171" },
  empty: { backgroundColor: "transparent", borderWidth: 2, borderColor: "rgba(255,255,255,0.35)" },
});

// ── Numeric Keypad ─────────────────────────────────────────────────────────
const ROWS = [["1","2","3"],["4","5","6"],["7","8","9"],["","0","⌫"]];
function NumPad({ onDigit, onDelete }: { onDigit: (d: string) => void; onDelete: () => void }) {
  return (
    <View style={pad.grid}>
      {ROWS.map((row, ri) => (
        <View key={ri} style={pad.row}>
          {row.map((k, ki) => (
            <Pressable
              key={ki}
              style={({ pressed }) => [pad.key, k === "" && pad.hidden, pressed && k !== "" && pad.pressed]}
              onPress={() => { if (k === "⌫") onDelete(); else if (k) onDigit(k); }}
              disabled={k === ""}
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
    flex: 1, height: 62, borderRadius: 16, maxWidth: 120,
    backgroundColor: "rgba(255,255,255,0.09)",
    alignItems: "center", justifyContent: "center",
  },
  hidden: { opacity: 0 } as any,
  pressed: { backgroundColor: "rgba(255,255,255,0.20)" },
  keyText: { fontSize: 24, fontFamily: "Inter_500Medium", color: "#fff" },
});

// ── Name Picker Modal (dropdown) ───────────────────────────────────────────
function NamePickerModal({
  visible,
  names,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  names: string[];
  selected: string | null;
  onSelect: (name: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = search.trim()
    ? names.filter((n) => n.toLowerCase().includes(search.toLowerCase()))
    : names;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={picker.overlay} onPress={onClose}>
        <Pressable style={picker.sheet} onPress={() => {}}>
          {/* Handle */}
          <View style={picker.handle} />

          <Text style={picker.title}>Selecione seu nome</Text>

          {/* Search */}
          <View style={picker.searchWrap}>
            <TextInput
              style={picker.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar nome…"
              placeholderTextColor="rgba(255,255,255,0.35)"
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            style={picker.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  picker.item,
                  item === selected && picker.itemSelected,
                  pressed && picker.itemPressed,
                ]}
                onPress={() => { onSelect(item); onClose(); setSearch(""); }}
              >
                <Text
                  style={[picker.itemText, item === selected && picker.itemTextSelected]}
                  numberOfLines={1}
                >
                  {item}
                </Text>
                {item === selected && (
                  <UserCheck size={16} color="#60a5fa" />
                )}
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={picker.sep} />}
            ListEmptyComponent={
              <Text style={picker.empty}>Nenhum resultado</Text>
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
const picker = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === "web" ? 20 : 34,
    maxHeight: "75%",
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginTop: 12, marginBottom: 16,
  },
  title: {
    fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff",
    textAlign: "center", marginBottom: 14,
  },
  searchWrap: {
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: {
    fontSize: 14, fontFamily: "Inter_400Regular", color: "#fff",
  },
  list: { flexGrow: 0 },
  item: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 15,
  },
  itemSelected: { backgroundColor: "rgba(96,165,250,0.12)" },
  itemPressed: { backgroundColor: "rgba(255,255,255,0.08)" },
  itemText: {
    flex: 1, fontSize: 14, fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.8)",
  },
  itemTextSelected: { color: "#60a5fa", fontFamily: "Inter_700Bold" },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.07)", marginHorizontal: 16 },
  empty: { textAlign: "center", color: "rgba(255,255,255,0.35)", padding: 20, fontFamily: "Inter_400Regular" },
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════
export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { loginMotorista, loginAdmin } = useAuth();
  const { settings } = useSettings();

  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pinDigits, setPinDigits] = useState("");
  const [pinError, setPinError] = useState(false);

  // Admin Easter egg — 3 taps on logo
  const logoTapCount = useRef(0);
  const logoTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminDigits, setAdminDigits] = useState("");
  const [adminError, setAdminError] = useState(false);

  const handleLogoTap = useCallback(() => {
    logoTapCount.current += 1;
    if (logoTapTimer.current) clearTimeout(logoTapTimer.current);
    if (logoTapCount.current >= 3) {
      logoTapCount.current = 0;
      setAdminDigits(""); setAdminError(false);
      setAdminModalOpen(true);
    } else {
      logoTapTimer.current = setTimeout(() => { logoTapCount.current = 0; }, 1500);
    }
  }, []);

  const selectName = useCallback((nome: string) => {
    setSelectedName(nome);
    setPinDigits(""); setPinError(false);
  }, []);

  const handleDigit = useCallback((d: string) => {
    setPinError(false);
    const next = pinDigits + d;
    setPinDigits(next);
    if (next.length === 4) {
      const ok = loginMotorista(selectedName!, next, settings.motoristaPins);
      if (!ok) {
        setPinError(true);
        setTimeout(() => { setPinDigits(""); setPinError(false); }, 900);
      }
    }
  }, [pinDigits, selectedName, loginMotorista, settings.motoristaPins]);

  const handleDelete = useCallback(() => {
    setPinError(false);
    setPinDigits((p) => p.slice(0, -1));
  }, []);

  const handleAdminDigit = useCallback((d: string) => {
    setAdminError(false);
    const next = adminDigits + d;
    setAdminDigits(next);
    if (next.length === 6) {
      const ok = loginAdmin(next, settings.adminPin);
      if (!ok) {
        setAdminError(true);
        setTimeout(() => { setAdminDigits(""); setAdminError(false); }, 900);
      } else {
        setAdminModalOpen(false);
      }
    }
  }, [adminDigits, loginAdmin, settings.adminPin]);

  const handleAdminDelete = useCallback(() => {
    setAdminError(false);
    setAdminDigits((p) => p.slice(0, -1));
  }, []);

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

        {/* Dropdown de nome */}
        <Text style={styles.fieldLabel}>Motorista</Text>
        <Pressable
          style={[styles.dropdown, dropdownOpen && styles.dropdownOpen]}
          onPress={() => setDropdownOpen(true)}
        >
          <Text
            style={[styles.dropdownText, !selectedName && styles.dropdownPlaceholder]}
            numberOfLines={1}
          >
            {selectedName ?? "Selecione seu nome…"}
          </Text>
          {dropdownOpen
            ? <ChevronUp size={18} color="rgba(255,255,255,0.5)" />
            : <ChevronDown size={18} color="rgba(255,255,255,0.5)" />}
        </Pressable>

        {/* PIN — só aparece depois de escolher o nome */}
        {selectedName !== null && (
          <>
            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>
              {pinError ? "PIN incorreto — tente novamente" : "PIN (4 dígitos)"}
            </Text>
            <PinDots filled={pinDigits.length} total={4} error={pinError} />
            <NumPad onDigit={handleDigit} onDelete={handleDelete} />
          </>
        )}

        {/* Hint quando nenhum nome selecionado */}
        {selectedName === null && (
          <Text style={styles.hint}>
            Toque no campo acima para abrir a lista de motoristas
          </Text>
        )}
      </View>

      {/* ── Dropdown Modal ── */}
      <NamePickerModal
        visible={dropdownOpen}
        names={settings.motoristas}
        selected={selectedName}
        onSelect={selectName}
        onClose={() => setDropdownOpen(false)}
      />

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
            <Text style={adm.sub}>Digite o PIN de administrador (6 dígitos)</Text>
            <PinDots filled={adminDigits.length} total={6} error={adminError} />
            {adminError && <Text style={adm.errText}>PIN incorreto</Text>}
            <NumPad onDigit={handleAdminDigit} onDelete={handleAdminDelete} />
            <Pressable style={adm.cancelBtn} onPress={() => setAdminModalOpen(false)}>
              <Text style={adm.cancelText}>Cancelar</Text>
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
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 28,
  },

  logoArea: { alignItems: "center", gap: 10 },
  logoWrap: {
    width: 96, height: 96, borderRadius: 24, overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4, shadowRadius: 24, elevation: 12,
  },
  logoImg: { width: 96, height: 96 },
  brandName: {
    fontSize: 20, fontFamily: "Inter_700Bold",
    color: "#fff", letterSpacing: 2.5,
  },
  brandSub: {
    fontSize: 12, fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.45)", letterSpacing: 0.5,
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

  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  dropdownOpen: {
    borderColor: "#60a5fa",
    backgroundColor: "rgba(96,165,250,0.10)",
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  dropdownPlaceholder: {
    color: "rgba(255,255,255,0.35)",
    fontFamily: "Inter_400Regular",
  },

  hint: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.3)",
    marginTop: 16,
    lineHeight: 18,
  },
});

const adm = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center", alignItems: "center", padding: 24,
  },
  box: {
    backgroundColor: "#1e293b", borderRadius: 28,
    padding: 24, width: "100%", maxWidth: 420,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5, shadowRadius: 40, elevation: 20,
    gap: 4,
  },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "center" },
  sub: {
    fontSize: 12, fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.45)", textAlign: "center", marginBottom: 4,
  },
  errText: {
    color: "#f87171", fontSize: 13, fontFamily: "Inter_500Medium",
    textAlign: "center", marginBottom: 4,
  },
  cancelBtn: {
    marginTop: 14, paddingVertical: 14, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center",
  },
  cancelText: { color: "rgba(255,255,255,0.5)", fontFamily: "Inter_500Medium", fontSize: 14 },
});
