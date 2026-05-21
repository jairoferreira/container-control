import { Download, Inbox, Plus, Search, X } from "lucide-react-native";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CautelaCard } from "@/components/CautelaCard";
import type { StatusCautela } from "@/contexts/CautelaContext";
import { useCautela } from "@/contexts/CautelaContext";
import { exportarCSV } from "@/lib/exportCautelasCSV";
import { useColors } from "@/hooks/useColors";

const FILTERS: { label: string; value: StatusCautela | "todos" }[] = [
  { label: "Todas", value: "todos" },
  { label: "Pendentes", value: "pendente" },
  { label: "Concluídas", value: "concluida" },
  { label: "Canceladas", value: "cancelada" },
];

export default function HistoricoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cauteias } = useCautela();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusCautela | "todos">("todos");
  const [exporting, setExporting] = useState(false);

  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;

  const filtered = cauteias.filter((c) => {
    const matchStatus = filter === "todos" || c.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.numeroControle?.toLowerCase().includes(q) ||
      c.motorista?.toLowerCase().includes(q) ||
      c.origem?.toLowerCase().includes(q) ||
      c.destino?.toLowerCase().includes(q) ||
      c.placaCavalo?.toLowerCase().includes(q) ||
      c.placaCarreta?.toLowerCase().includes(q) ||
      c.conteiner?.toLowerCase().includes(q) ||
      c.cliente?.toLowerCase().includes(q) ||
      c.operacao?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  async function handleExport() {
    setExporting(true);
    await exportarCSV(filter === "todos" ? cauteias : filtered);
    setExporting(false);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Cabeçalho ── */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPad + 20 }]}>
        <View>
          <Text style={styles.headerTitle}>HISTÓRICO</Text>
          <Text style={styles.headerSub}>
            {cauteias.length} movimentaç{cauteias.length !== 1 ? "ões" : "ão"} registrada{cauteias.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.headerBtns}>
          {/* Exportar CSV */}
          <Pressable
            style={[styles.headerBtn, { opacity: exporting ? 0.6 : 1 }]}
            onPress={handleExport}
            disabled={exporting || cauteias.length === 0}
          >
            <Download size={20} color="#fff" />
          </Pressable>
          {/* Nova cautela */}
          <Pressable
            style={styles.headerBtn}
            onPress={() => router.push("/(tabs)/nova-cautela")}
          >
            <Plus size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* ── Busca ── */}
      <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Search size={18} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Motorista, placa, contêiner, cliente…"
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <X size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* ── Filtros ── */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.value}
            style={[
              styles.filterBtn,
              {
                backgroundColor: filter === f.value ? colors.primary : colors.card,
                borderColor: filter === f.value ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setFilter(f.value)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f.value ? "#fff" : colors.mutedForeground },
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
        {filtered.length !== cauteias.length && (
          <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {/* ── Lista ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filtered.length}
        renderItem={({ item }) => <CautelaCard cautela={item} />}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Inbox size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {search || filter !== "todos" ? "Nenhum resultado" : "Sem movimentações"}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {search || filter !== "todos"
                ? "Tente outros filtros ou termos"
                : "Registre sua primeira cautela"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
  },
  headerBtns: { flexDirection: "row", gap: 10 },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 18,
    marginTop: -20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: "rgba(15,23,42,0.06)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    marginTop: 16,
    marginBottom: 4,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  resultCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginLeft: "auto",
  },
  list: { paddingHorizontal: 18, paddingTop: 12 },
  empty: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 36,
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
