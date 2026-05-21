import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface OptionPickerProps {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  columns?: number; // 0 = horizontal scroll, 2 = two columns grid
}

export function OptionPicker({
  label,
  options,
  value,
  onChange,
  required,
  columns = 0,
}: OptionPickerProps) {
  const colors = useColors();

  const renderPill = (opt: string) => {
    const active = value === opt;
    return (
      <TouchableOpacity
        key={opt}
        style={[
          styles.pill,
          columns === 2 && styles.pillGrid,
          {
            backgroundColor: active ? colors.primary : colors.muted,
            borderColor: active ? colors.primary : colors.border,
          },
        ]}
        onPress={() => onChange(active ? "" : opt)}
        activeOpacity={0.75}
      >
        <Text
          style={[
            styles.pillText,
            { color: active ? "#fff" : colors.mutedForeground },
          ]}
          numberOfLines={1}
        >
          {opt}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {label.toUpperCase()}
        {required && <Text style={{ color: colors.destructive }}> *</Text>}
      </Text>
      {columns === 2 ? (
        <View style={styles.grid}>{options.map(renderPill)}</View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {options.map(renderPill)}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  scroll: { gap: 8, paddingBottom: 2 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 0,
  },
  pillGrid: {
    flexGrow: 1,
    minWidth: "45%",
    alignItems: "center",
  },
  pillText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
});
