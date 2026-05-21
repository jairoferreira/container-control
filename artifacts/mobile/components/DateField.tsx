import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar } from "lucide-react-native";
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  required?: boolean;
}

function toDate(ddmmaaaa: string): Date {
  if (!ddmmaaaa) return new Date();
  const [d, m, y] = ddmmaaaa.split("/").map(Number);
  const date = new Date(y || 2000, (m || 1) - 1, d || 1);
  return isNaN(date.getTime()) ? new Date() : date;
}

function fromDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function toHtmlValue(ddmmaaaa: string): string {
  if (!ddmmaaaa) return "";
  const [d, m, y] = ddmmaaaa.split("/");
  if (!d || !m || !y || y.length < 4) return "";
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function fromHtmlValue(yyyymmdd: string): string {
  if (!yyyymmdd) return "";
  const [y, m, d] = yyyymmdd.split("-");
  return `${d}/${m}/${y}`;
}

export function DateField({ label, value, onChange, required }: DateFieldProps) {
  const colors = useColors();
  const [open, setOpen] = useState(false);

  if (Platform.OS === "web") {
    const Input = "input" as unknown as React.ElementType;
    return (
      <View style={styles.wrap}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}> 
          {label.toUpperCase()}
          {required && <Text style={{ color: colors.destructive }}> *</Text>}
        </Text>
        <View style={[styles.webWrap, { borderColor: colors.border, backgroundColor: colors.input }]}> 
          <Calendar size={14} color={colors.primary} style={styles.icon} />
          <Input
            type="date"
            value={toHtmlValue(value)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(fromHtmlValue(e.target.value))
            }
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
        {required && <Text style={{ color: colors.destructive }}> *</Text>}
      </Text>
      <Pressable
        style={[styles.nativeBtn, { borderColor: colors.border, backgroundColor: colors.input }]}
        onPress={() => setOpen(true)}
      >
        <Calendar size={16} color={colors.primary} />
        <Text style={[styles.nativeBtnText, { color: value ? colors.foreground : colors.mutedForeground }]}> 
          {value || "Selecionar data"}
        </Text>
      </Pressable>

      {open && (
        <DateTimePicker
          value={toDate(value)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          locale="pt-BR"
          onChange={(event, selected) => {
            setOpen(Platform.OS === "ios");
            if (event.type === "set" && selected) {
              onChange(fromDate(selected));
            }
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
