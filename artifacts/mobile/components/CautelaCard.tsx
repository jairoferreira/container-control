import { ArrowDown, ArrowUp, ChevronRight, Truck } from "lucide-react-native";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Cautela, StatusCautela } from "@/contexts/CautelaContext";
import { useColors } from "@/hooks/useColors";

const STATUS_CONFIG: Record<StatusCautela, { label: string; color: string }> = {
  pendente:  { label: "Pendente",  color: "#f59e0b" },
  concluida: { label: "Concluída", color: "#22c55e" },
  cancelada: { label: "Cancelada", color: "#ef4444" },
};

interface CautelaCardProps {
  cautela: Cautela;
}

export function CautelaCard({ cautela }: CautelaCardProps) {
  const colors = useColors();
  const { label, color } = STATUS_CONFIG[cautela.status];
  const date = cautela.dataMov || new Date(cautela.createdAt).toLocaleDateString("pt-BR");
  const isSaindo = cautela.saidaChegada === "saindo";
  const dirColor = isSaindo ? "#1e3a8a" : "#15803d";

  const subtitle = [cautela.motorista, cautela.origem && cautela.destino ? `${cautela.origem} → ${cautela.destino}` : ""]
    .filter(Boolean).join(" · ");

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
      onPress={() => router.push(`/cautela/${cautela.id}`)}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          {/* Ícone com cor de direção */}
          <View style={[styles.iconWrap, { backgroundColor: dirColor + "18" }]}>
            {isSaindo
              ? <ArrowUp size={20} color={dirColor} />
              : <ArrowDown size={20} color={dirColor} />}
          </View>
          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Text style={[styles.numero, { color: colors.foreground }]}>#{cautela.numeroControle}</Text>
              <Text style={[styles.dirTag, { color: dirColor, backgroundColor: dirColor + "14" }]}>
                {isSaindo ? "SAINDO" : "CHEGANDO"}
              </Text>
            </View>
            {!!subtitle && (
              <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
            {!!cautela.placaCavalo && (
              <View style={styles.plateRow}>
                <Truck size={11} color={colors.mutedForeground} />
                <Text style={[styles.plate, { color: colors.mutedForeground }]}>
                  {cautela.placaCavalo}{cautela.placaCarreta ? ` · ${cautela.placaCarreta}` : ""}
                  {cautela.temBitrem && cautela.placaCarretaTraseira ? ` · ${cautela.placaCarretaTraseira}` : ""}
                </Text>
              </View>
            )}
            <Text style={[styles.date, { color: colors.mutedForeground }]}>{date}</Text>
          </View>
        </View>
        <View style={styles.right}>
          <View style={[styles.badge, { backgroundColor: color + "22" }]}>
            <Text style={[styles.badgeText, { color }]}>{label}</Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: "rgba(15,23,42,0.12)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  numero: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  dirTag: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 5,
  },
  plateRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  plate: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  date: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
