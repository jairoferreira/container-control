import { ArrowDown, ArrowUp, Save } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DateField } from "@/components/DateField";
import { FormField } from "@/components/FormField";
import { OptionPicker } from "@/components/OptionPicker";
import { SectionHeader } from "@/components/SectionHeader";
import { SelectField } from "@/components/SelectField";
import { SuggestField } from "@/components/SuggestField";
import type {
  ModeloConteiner,
  SaidaChegada,
  SituacaoCarreta,
  TipoCarreta,
  TipoVeiculo,
} from "@/contexts/CautelaContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCautela } from "@/contexts/CautelaContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useColors } from "@/hooks/useColors";

const OPERACOES = ["MANAUS", "BOA VISTA", "MADEIRA", "ITACOATIARA", "IRANDUBA", "MANACAPURU", "Outro"];
const TIPOS_VEICULO: TipoVeiculo[] = ["CAVALINHO ATRELADO", "SÓ O CAVALINHO", "CAMINHÃO", "CARRO PEQUENO"];
const MODELOS_CONTEINER: ModeloConteiner[] = ["20 DC", "20 TK", "40 FR", "40 HC"];
const CLIENTES_COMUNS = ["ALIANÇA", "GERDAU", "LEMOS", "MERCOSUL", "ROYAL MAX", "C R LUBRIFICANTES"];

// ── Helpers ───────────────────────────────────────────────────────────────
function todayStr(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function unique(arr: (string | undefined)[]): string[] {
  return [...new Set(arr.filter((s): s is string => !!s && s.trim() !== ""))];
}

// ── Componente de toggle grande (Saindo / Chegando) ───────────────────────
function DirectionToggle({
  value,
  onChange,
}: {
  value: SaidaChegada;
  onChange: (v: SaidaChegada) => void;
}) {
  const colors = useColors();
  return (
    <View style={dirStyles.wrap}>
      {(["saindo", "chegando"] as SaidaChegada[]).map((opt) => {
        const active = value === opt;
        const isSaindo = opt === "saindo";
        return (
          <TouchableOpacity
            key={opt}
            style={[
              dirStyles.btn,
              {
                backgroundColor: active
                  ? isSaindo ? "#1e3a8a" : "#15803d"
                  : colors.muted,
                borderColor: active
                  ? isSaindo ? "#1e3a8a" : "#15803d"
                  : colors.border,
              },
            ]}
            onPress={() => onChange(opt)}
            activeOpacity={0.85}
          >
            {isSaindo
              ? <ArrowUp size={22} color={active ? "#fff" : colors.mutedForeground} />
              : <ArrowDown size={22} color={active ? "#fff" : colors.mutedForeground} />}
            <Text
              style={[
                dirStyles.label,
                { color: active ? "#fff" : colors.mutedForeground },
              ]}
            >
              {opt === "saindo" ? "SAINDO" : "CHEGANDO"}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const dirStyles = StyleSheet.create({
  wrap: { flexDirection: "row", gap: 12, marginBottom: 18 },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 2,
  },
  label: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
});

// ── Componente de toggle binário (CARREGADO/VAZIO ou CONTÊINER/CARRETA ABERTA) ──
function BinaryToggle({
  label,
  options,
  value,
  onChange,
  colors: colorsProp,
}: {
  label: string;
  options: [string, string];
  value: string;
  onChange: (v: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={binStyles.wrap}>
      <Text style={[binStyles.label, { color: colorsProp.mutedForeground }]}>
        {label.toUpperCase()}
      </Text>
      <View style={binStyles.row}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[
                binStyles.btn,
                {
                  backgroundColor: active ? colorsProp.primary : colorsProp.muted,
                  borderColor: active ? colorsProp.primary : colorsProp.border,
                },
              ]}
              onPress={() => onChange(opt)}
              activeOpacity={0.8}
            >
              <Text
                style={[binStyles.btnText, { color: active ? "#fff" : colorsProp.mutedForeground }]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const binStyles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  row: { flexDirection: "row", gap: 10 },
  btn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  btnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// TELA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export default function NovaCautelaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cauteias, addCautela } = useCautela();
  const { settings } = useSettings();
  const { user } = useAuth();

  // Motorista travado quando logado como motorista; admin pode escolher
  const motoristaLocked = !!user && !user.isAdmin;

  // Listas dinâmicas vindas das Configurações (gerenciadas pelo gestor)
  const MOTORISTAS = settings.motoristas;
  const PLACAS_CAVALO = settings.placasCavalo;
  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const botPad = Platform.OS === "web" ? 100 : 0;

  // Número de controle automático
  const numeroControle = useMemo(() => {
    const year = new Date().getFullYear();
    const nums = cauteias
      .map((c) => parseInt(c.numeroControle?.split("/")[0] ?? "0"))
      .filter((n) => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `${String(next).padStart(3, "0")}/${year}`;
  }, [cauteias]);

  // Sugestões de campos de texto livre (história)
  const suggestions = useMemo(() => ({
    origem: unique(cauteias.map((c) => c.origem)),
    destino: unique(cauteias.map((c) => c.destino)),
    cliente: [...new Set([...CLIENTES_COMUNS, ...unique(cauteias.map((c) => c.cliente))])],
    clienteTraseira: [...new Set([...CLIENTES_COMUNS, ...unique(cauteias.map((c) => c.clienteTraseira))])],
    placaCarreta: unique(cauteias.map((c) => c.placaCarreta)),
    placaCarretaTraseira: unique(cauteias.map((c) => c.placaCarretaTraseira)),
  }), [cauteias]);

  // ── Estado do formulário ────────────────────────────────────────────────
  const [dataMov, setDataMov] = useState(todayStr);
  const [saidaChegada, setSaidaChegada] = useState<SaidaChegada>("saindo");

  // Rota
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [operacao, setOperacao] = useState("");

  // Veículo — pré-preenche com o motorista logado (travado para não-admin)
  const [motorista, setMotorista] = useState(
    user && !user.isAdmin ? user.nome : ""
  );
  const [placaCavalo, setPlacaCavalo] = useState("");
  const [odometro, setOdometro] = useState("");
  const [tipo, setTipo] = useState<TipoVeiculo>("");

  // Carreta Dianteira
  const [placaCarreta, setPlacaCarreta] = useState("");
  const [situacao, setSituacao] = useState<SituacaoCarreta>("");
  const [cliente, setCliente] = useState("");
  const [tipoCarreta, setTipoCarreta] = useState<TipoCarreta>("");
  const [conteiner, setConteiner] = useState("");
  const [modeloConteiner, setModeloConteiner] = useState<ModeloConteiner>("");
  const [lacre, setLacre] = useState("");

  // Bitrem
  const [temBitrem, setTemBitrem] = useState(false);
  const [placaCarretaTraseira, setPlacaCarretaTraseira] = useState("");
  const [situacaoTraseira, setSituacaoTraseira] = useState<SituacaoCarreta>("");
  const [clienteTraseira, setClienteTraseira] = useState("");
  const [tipoCarretaTraseira, setTipoCarretaTraseira] = useState<TipoCarreta>("");
  const [conteinerTraseiro, setConteinerTraseiro] = useState("");
  const [modeloConteinerTraseiro, setModeloConteinerTraseiro] = useState<ModeloConteiner>("");
  const [lacreTraseiro, setLacreTraseiro] = useState("");

  // Observações
  const [obs, setObs] = useState("");

  function handleSalvar() {
    if (!motorista.trim()) {
      Alert.alert("Atenção", "Selecione o Motorista.");
      return;
    }
    if (!placaCavalo.trim()) {
      Alert.alert("Atenção", "Selecione a Placa do Cavalo.");
      return;
    }

    addCautela({
      numeroControle,
      dataMov,
      saidaChegada,
      origem,
      destino,
      operacao,
      motorista,
      placaCavalo,
      odometro,
      tipo,
      placaCarreta,
      situacao,
      cliente,
      tipoCarreta,
      conteiner,
      modeloConteiner,
      lacre,
      temBitrem,
      placaCarretaTraseira,
      situacaoTraseira,
      clienteTraseira,
      tipoCarretaTraseira,
      conteinerTraseiro,
      modeloConteinerTraseiro,
      lacreTraseiro,
      obs,
    });

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // navigate() troca de aba corretamente tanto na web quanto no native
    // (router.replace falha dentro de tab navigators)
    router.navigate("/(tabs)");
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Cabeçalho ── */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPad + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>NOVA CAUTELA</Text>
          <Text style={styles.headerSub}>Nº {numeroControle} · {dataMov}</Text>
        </View>
        <Pressable style={styles.saveBtn} onPress={handleSalvar}>
          <Save size={18} color="#fff" />
          <Text style={styles.saveBtnText}>Salvar</Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 40 }]}
        showsVerticalScrollIndicator={false}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
      >
        {/* ══ SAINDO / CHEGANDO ═══════════════════════════════════════════ */}
        <DirectionToggle value={saidaChegada} onChange={setSaidaChegada} />

        {/* ══ VEÍCULO ═════════════════════════════════════════════════════
            Data + Motorista + Placa + Odômetro + Tipo — tudo junto:
            quem está dirigindo, quando e com qual veículo              */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SectionHeader title="Veículo" subtitle="Motorista, data e trator" />

          {/* Data da movimentação fica aqui, junto ao motorista */}
          <DateField label="Data da Movimentação" value={dataMov} onChange={setDataMov} />

          <SelectField
            label="Motorista"
            options={MOTORISTAS}
            value={motorista}
            onChange={setMotorista}
            placeholder="Selecionar motorista…"
            required
            locked={motoristaLocked}
          />
          <SelectField
            label="Placa do Cavalo"
            options={PLACAS_CAVALO}
            value={placaCavalo}
            onChange={setPlacaCavalo}
            placeholder="Selecionar placa…"
            required
          />
          <FormField
            label="Odômetro"
            value={odometro}
            onChangeText={setOdometro}
            placeholder="Quilometragem atual"
            keyboardType="numeric"
          />
          <OptionPicker
            label="Tipo de Veículo"
            options={TIPOS_VEICULO}
            value={tipo}
            onChange={(v) => setTipo(v as TipoVeiculo)}
            columns={2}
          />
        </View>

        {/* ══ ROTA ════════════════════════════════════════════════════════ */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SectionHeader title="Rota" subtitle="De onde sai e para onde vai" />
          <SuggestField
            label="Origem"
            value={origem}
            onChangeText={setOrigem}
            suggestions={suggestions.origem}
            placeholder="Local de saída"
            autoCapitalize="words"
          />
          <SuggestField
            label="Destino"
            value={destino}
            onChangeText={setDestino}
            suggestions={suggestions.destino}
            placeholder="Local de chegada"
            autoCapitalize="words"
          />
          <OptionPicker
            label="Operação"
            options={OPERACOES}
            value={operacao}
            onChange={setOperacao}
          />
        </View>

        {/* ══ CARRETA DIANTEIRA ════════════════════════════════════════════ */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SectionHeader title="Carreta Dianteira" subtitle="Dados da carreta principal" />
          <SuggestField
            label="Placa da Carreta"
            value={placaCarreta}
            onChangeText={setPlacaCarreta}
            suggestions={suggestions.placaCarreta}
            placeholder="Placa da carreta"
            autoCapitalize="characters"
          />
          <BinaryToggle
            label="Situação"
            options={["CARREGADO", "VAZIO"]}
            value={situacao}
            onChange={(v) => setSituacao(v as SituacaoCarreta)}
            colors={colors}
          />
          <SuggestField
            label="Cliente"
            value={cliente}
            onChangeText={setCliente}
            suggestions={suggestions.cliente}
            placeholder="Nome do cliente"
            autoCapitalize="words"
          />
          <BinaryToggle
            label="Carreta Aberta ou Contêiner?"
            options={["CARRETA ABERTA", "CONTÊINER"]}
            value={tipoCarreta}
            onChange={(v) => setTipoCarreta(v as TipoCarreta)}
            colors={colors}
          />

          {/* Campos de contêiner — só aparecem se selecionou CONTÊINER */}
          {tipoCarreta === "CONTÊINER" && (
            <View style={styles.conditional}>
              <FormField
                label="Número do Contêiner"
                value={conteiner}
                onChangeText={setConteiner}
                placeholder="Ex: MRSU4044019"
                autoCapitalize="characters"
              />
              <OptionPicker
                label="Modelo do Contêiner"
                options={MODELOS_CONTEINER}
                value={modeloConteiner}
                onChange={(v) => setModeloConteiner(v as ModeloConteiner)}
              />
              <FormField
                label="Lacre"
                value={lacre}
                onChangeText={setLacre}
                placeholder="Número do lacre ou 'Sem lacre'"
                autoCapitalize="characters"
              />
            </View>
          )}
        </View>

        {/* ══ BITREM ══════════════════════════════════════════════════════ */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SectionHeader title="Bitrem / Carreta Traseira" />

          {/* Toggle SIM / NÃO */}
          <View style={styles.bitremToggleRow}>
            {["NÃO", "SIM"].map((opt) => {
              const active = (opt === "SIM") === temBitrem;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.bitremBtn,
                    {
                      backgroundColor: active
                        ? opt === "SIM" ? "#1e3a8a" : colors.muted
                        : colors.muted,
                      borderColor: active
                        ? opt === "SIM" ? "#1e3a8a" : colors.border
                        : colors.border,
                    },
                  ]}
                  onPress={() => setTemBitrem(opt === "SIM")}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.bitremBtnText,
                      {
                        color: active
                          ? opt === "SIM" ? "#fff" : colors.foreground
                          : colors.mutedForeground,
                      },
                    ]}
                  >
                    {opt === "SIM" ? "✓ Inserir dados de bitrem" : "✗ Sem bitrem"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Campos do bitrem — só aparecem se SIM */}
          {temBitrem && (
            <View style={styles.conditional}>
              <SuggestField
                label="Placa da Carreta Traseira"
                value={placaCarretaTraseira}
                onChangeText={setPlacaCarretaTraseira}
                suggestions={suggestions.placaCarretaTraseira}
                placeholder="Placa da traseira"
                autoCapitalize="characters"
              />
              <BinaryToggle
                label="Situação (Traseira)"
                options={["CARREGADO", "VAZIO"]}
                value={situacaoTraseira}
                onChange={(v) => setSituacaoTraseira(v as SituacaoCarreta)}
                colors={colors}
              />
              <SuggestField
                label="Cliente (Traseira)"
                value={clienteTraseira}
                onChangeText={setClienteTraseira}
                suggestions={suggestions.clienteTraseira}
                placeholder="Nome do cliente"
                autoCapitalize="words"
              />
              <BinaryToggle
                label="Carreta Aberta ou Contêiner? (Traseira)"
                options={["CARRETA ABERTA", "CONTÊINER"]}
                value={tipoCarretaTraseira}
                onChange={(v) => setTipoCarretaTraseira(v as TipoCarreta)}
                colors={colors}
              />

              {tipoCarretaTraseira === "CONTÊINER" && (
                <>
                  <FormField
                    label="Contêiner da Traseira"
                    value={conteinerTraseiro}
                    onChangeText={setConteinerTraseiro}
                    placeholder="Ex: MRSU4044019"
                    autoCapitalize="characters"
                  />
                  <OptionPicker
                    label="Modelo do Contêiner Traseira"
                    options={MODELOS_CONTEINER}
                    value={modeloConteinerTraseiro}
                    onChange={(v) => setModeloConteinerTraseiro(v as ModeloConteiner)}
                  />
                  <FormField
                    label="Lacre (Traseira)"
                    value={lacreTraseiro}
                    onChangeText={setLacreTraseiro}
                    placeholder="Número do lacre ou 'Sem lacre'"
                    autoCapitalize="characters"
                  />
                </>
              )}
            </View>
          )}
        </View>

        {/* ══ OBSERVAÇÕES ══════════════════════════════════════════════════ */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SectionHeader title="Observações" />
          <FormField
            label="Observações"
            value={obs}
            onChangeText={setObs}
            placeholder="Informações adicionais…"
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: "top", paddingTop: 10 }}
          />
        </View>

        {/* ══ BOTÃO SALVAR ═════════════════════════════════════════════════ */}
        <Pressable
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          onPress={handleSalvar}
        >
          <Save size={18} color="#fff" />
          <Text style={styles.submitText}>Salvar Cautela</Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.4,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.72)",
    marginTop: 3,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  saveBtnText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  content: { padding: 16, gap: 14 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: "rgba(15,23,42,0.06)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  conditional: {
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  bitremToggleRow: { flexDirection: "column", gap: 8, marginBottom: 4 },
  bitremBtn: {
    alignItems: "center",
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  bitremBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 6,
  },
  submitText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
