import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface SuggestFieldProps extends Omit<TextInputProps, "value" | "onChangeText"> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  suggestions: string[];
  required?: boolean;
}

export function SuggestField({
  label,
  value,
  onChangeText,
  suggestions,
  required,
  style,
  ...props
}: SuggestFieldProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);

  const filtered = focused
    ? suggestions
        .filter(
          (s) =>
            s &&
            s.toLowerCase().includes((value || "").toLowerCase()) &&
            s.toLowerCase() !== value.toLowerCase()
        )
        .slice(0, 4)
    : [];

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {label.toUpperCase()}
        {required && <Text style={{ color: "#ef4444" }}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.input,
            borderColor: focused ? colors.primary : colors.border,
            color: colors.foreground,
            borderBottomLeftRadius: filtered.length > 0 ? 0 : 16,
            borderBottomRightRadius: filtered.length > 0 ? 0 : 16,
          },
          style,
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholderTextColor={colors.mutedForeground}
        {...props}
      />
      {filtered.length > 0 && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.card,
              borderColor: colors.primary,
            },
          ]}
        >
          {filtered.map((item, i) => (
            <Pressable
              key={item}
              style={[
                styles.item,
                i < filtered.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
              ]}
              onPress={() => {
                onChangeText(item);
                setFocused(false);
              }}
            >
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>↩</Text>
              <Text style={[styles.itemText, { color: colors.foreground }]}>{item}</Text>
            </Pressable>
          ))}
        </View>
      )}
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
  input: {
    borderWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 48,
  },
  dropdown: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: "hidden",
    marginTop: -2,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  hint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  itemText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
});
