import DateTimePicker from "@react-native-community/datetimepicker";
import { Clock } from "lucide-react-native";
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface TimeFieldProps {
  label: string;
  value: string;
  onChange: (time: string) => void;
}

function toDate(hhmm: string): Date {
  const now = new Date();
  if (!hhmm) return now;
  const [h, m] = hhmm.split(":").map(Number);
  now.setHours(isNaN(h) ? 0 : h, isNaN(m) ? 0 : m, 0, 0);
  return now;
}

function fromDate(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function TimeField({ label, value, onChange }: TimeFieldProps) {
  const colors = useColors();
  const [open, setOpen] = useState(false);

  if (Platform.OS === "web") {
    const Input = "input" as unknown as React.ElementType;
    return (
      <View style={styles.wrap}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}> 
          {label.toUpperCase()}
        </Text>
        <View style={[styles.webWrap, { borderColor: colors.border, backgroundColor: colors.input }]}> 
          <Clock size={14} color={colors.primary} style={styles.icon} />
          <Input
            type="time"
            value={value || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            style={{
              flex: 1,
              fontSize: 14,
              fontFamily: "Inter_400Regular, Arial, sans-serif",
              color: colors.foreground,
              border: "none",
              outline: "none",
              background: "transparent",
              padding: "2px 0",
              cursor: "pointer",
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}> 
        {label.toUpperCase()}
      </Text>
      <Pressable
        style={[styles.nativeBtn, { borderColor: colors.border, backgroundColor: colors.input }]}
        onPress={() => setOpen(true)}
      >
        <Clock size={16} color={colors.primary} />
        <Text style={[styles.nativeBtnText, { color: value ? colors.foreground : colors.mutedForeground }]}> 
          {value || "Selecionar horário"}
        </Text>
      </Pressable>

      {open && (
        <DateTimePicker
          value={toDate(value)}
          mode="time"
          is24Hour
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selected) => {
            setOpen(Platform.OS === "ios");
            if (event.type === "set" && selected) onChange(fromDate(selected));
            if (Platform.OS === "android") setOpen(false);
          }}
        />
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
    letterSpacing: 0.35,
  },
  icon: { marginRight: 6 },
  webWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  nativeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  nativeBtnText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
