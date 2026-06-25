import { ChevronDown, Lock, X } from "lucide-react-native";
import React, { useState } from "react";
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
import { useColors } from "@/hooks/useColors";

interface SelectFieldProps {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  /** Trava o campo: exibe o valor mas impede alteração */
  locked?: boolean;
}

export function SelectField({
  label,
  options,
  value,
  onChange,
  placeholder = "Selecionar…",
  required,
  locked = false,
}: SelectFieldProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  // ── Web: native <select> ──────────────────────────────────────────────────
  if (Platform.OS === "web") {
    const Select = "select" as unknown as React.ElementType;
    return (
      <View style={styles.wrap}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          {label.toUpperCase()}
          {required && <Text style={{ color: colors.destructive }}> *</Text>}
        </Text>
        <View
          style={[
            styles.btn,
            { borderColor: colors.border, backgroundColor: colors.input },
            locked && styles.btnLocked,
          ]}
        >
          <Select
            value={value}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              !locked && onChange(e.target.value)
            }
            disabled={locked}
            style={{
              flex: 1,
              fontSize: 14,
              fontFamily: "Inter_400Regular, Arial, sans-serif",
              color: value ? colors.foreground : colors.mutedForeground,
              border: "none",
              outline: "none",
              background: "transparent",
              cursor: locked ? "default" : "pointer",
              opacity: 1,
            }}
          >
            <option value="">{placeholder}</option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
          {locked
            ? <Lock size={14} color={colors.mutedForeground} />
            : <ChevronDown size={16} color={colors.mutedForeground} />}
        </View>
      </View>
    );
  }

  // ── Native: Modal picker ─────────────────────────────────────────────────
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {label.toUpperCase()}
        {required && <Text style={{ color: colors.destructive }}> *</Text>}
      </Text>

      <Pressable
        style={[
          styles.btn,
          { borderColor: colors.border, backgroundColor: colors.input },
          locked && styles.btnLocked,
        ]}
        onPress={() => { if (!locked) { setSearch(""); setOpen(true); } }}
        disabled={locked}
      >
        <Text
          style={[
            styles.btnText,
            { color: value ? colors.foreground : colors.mutedForeground },
          ]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        {locked
          ? <Lock size={14} color={colors.mutedForeground} />
          : <ChevronDown size={16} color={colors.mutedForeground} />}
      </Pressable>

      <Modal visible={open} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 },
            ]}
          >
            {/* Header */}
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                {label}
              </Text>
              <Pressable onPress={() => setOpen(false)} style={styles.closeBtn}>
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
              <TextInput
                style={[
                  styles.searchInput,
                  { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border },
                ]}
                placeholder="Buscar…"
                placeholderTextColor={colors.mutedForeground}
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
            </View>

            {/* List */}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const active = item === value;
                return (
                  <Pressable
                    style={[
                      styles.item,
                      { borderBottomColor: colors.border },
                      active && { backgroundColor: colors.primary + "18" },
                    ]}
                    onPress={() => { onChange(item); setOpen(false); }}
                  >
                    <Text
                      style={[
                        styles.itemText,
                        { color: active ? colors.primary : colors.foreground },
                      ]}
                    >
                      {item}
                    </Text>
                    {active && (
                      <Text style={{ color: colors.primary, fontSize: 18 }}>✓</Text>
                    )}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text style={[styles.empty, { color: colors.mutedForeground }]}>
                  Nenhum resultado
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 48,
    gap: 8,
  },
  btnLocked: {
    opacity: 0.7,
    borderStyle: "dashed",
  },
  btnText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "75%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  closeBtn: {
    padding: 4,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  empty: {
    textAlign: "center",
    padding: 24,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
});
