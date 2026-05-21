import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Inbox, Plus } from "lucide-react-native";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CautelaCard } from "@/components/CautelaCard";
import { useCautela } from "@/contexts/CautelaContext";
import { useColors } from "@/hooks/useColors";

function MiniStat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <View style={[mini.wrap, { borderColor: accent + "22" }]}> 
      <Text style={[mini.value, { color: accent }]}>{value}</Text>
      <Text style={mini.label}>{label}</Text>
    </View>
  );
}

const mini = StyleSheet.create({
  wrap: {
    flex: 1,
    minWidth: 72,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  value: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    lineHeight: 26,
  },
  label: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.72)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 4,
  },
});

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { stats, cauteias } = useCautela();
  const recent = cauteias.slice(0, 5);
  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <LinearGradient
        colors={["#101f3b", "#1e3a8a", "#4f46e5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topPad + 24 }]}
      >
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <Text style={styles.company}>THIBA LOGÍSTICA</Text>
            <Text style={styles.title}>CONTROLE DE{`\n`}CAUTELAS</Text>
            <Text style={styles.sub}>Movimentação de contêineres em um só lugar</Text>
          </View>
          <View style={styles.topRight}>
            <View style={styles.logoWrap}>
              <Image
                source={require("@/assets/images/logo-thiba.jpg")}
                style={styles.logo}
                contentFit="contain"
              />
            </View>
            <Pressable style={styles.addBtn} onPress={() => router.push("/(tabs)/nova-cautela")}> 
              <Plus size={18} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View style={styles.statsRow}>
          <MiniStat label="Total" value={stats.total} accent="#60a5fa" />
          <MiniStat label="Pendentes" value={stats.pendentes} accent="#f59e0b" />
          <MiniStat label="Concluídas" value={stats.concluidas} accent="#22c55e" />
          <MiniStat label="Canceladas" value={stats.canceladas} accent="#ef4444" />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionLabel, { color: colors.secondary }]}> 
            Movimentações recentes
          </Text>
          <Pressable onPress={() => router.push("/(tabs)/historico")}> 
            <Text style={[styles.verTudo, { color: colors.primary }]}>Ver tudo</Text>
          </Pressable>
        </View>

        {recent.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Inbox size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhuma cautela registrada</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Toque em + para registrar a primeira movimentação</Text>
            <Pressable
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(tabs)/nova-cautela")}
            >
              <Text style={styles.emptyBtnText}>Nova Cautela</Text>
            </Pressable>
          </View>
        ) : (
          recent.map((c) => <CautelaCard key={c.id} cautela={c} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 26,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  topLeft: { flex: 1, paddingRight: 12 },
  company: {
    fontSize: 10,
    fontFamily: "Cochin",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontFamily: "Cochin",
    color: "#fff",
    letterSpacing: 0.2,
    lineHeight: 34,
  },
  sub: {
    fontSize: 12,
    fontFamily: "Cochin",
    color: "rgba(255,255,255,0.75)",
    marginTop: 8,
    lineHeight: 18,
  },
  topRight: { alignItems: "center", gap: 10 },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    shadowColor: "rgba(0,0,0,0.12)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  logo: { width: 52, height: 52, borderRadius: 14 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  content: { paddingHorizontal: 20, paddingTop: 20 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  verTudo: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  empty: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 14,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyBtnText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
