import { Package, Save, Square } from "lucide-react-native";
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
import { SectionHeader } from "@/components/SectionHeader";
import { TimeField } from "@/components/TimeField";
import type { TipoCabinete } from "@/contexts/CautelaContext";
import { useCautela } from "@/contexts/CautelaContext";
import { useColors } from "@/hooks/useColors";

export default function NovaCautelaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cauteias, addCautela } = useCautela();
  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;

  const numeroControle = useMemo(() => {
    const year = new Date().getFullYear();
    const nums = cauteias
      .map((c) => parseInt(c.numeroControle?.split("/")[0] ?? "0"))
      .filter((n) => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `${String(next).padStart(3, "0")}/${year}`;
  }, [cauteias]);

  const [dataMov, setDataMov] = useState("");
  const [origemLocal, setOrigemLocal] = useState("");
  const [booking, setBooking] = useState("");
  const [origemData, setOrigemData] = useState("");
  const [origemHorario, setOrigemHorario] = useState("");
  const [armador, setArmador] = useState("");
  const [pesoLiq, setPesoLiq] = useState("");
  const [lacreArmador, setLacreArmador] = useState("");
  const [obs, setObs] = useState("");
  const [destinoLocal, setDestinoLocal] = useState("");
  const [destinoData, setDestinoData] = useState("");
  const [destinoHorario, setDestinoHorario] = useState("");
  const [placaCavalo, setPlacaCavalo] = useState("");
  const [conteiner, setConteiner] = useState("");
  const [tara, setTara] = useState("");
  const [notasFiscais, setNotasFiscais] = useState("");
  const [pesoBruto, setPesoBruto] = useState("");
  const [tipoCabinete, setTipoCabinete] = useState<TipoCabinete>("cheio");
  const [transportador, setTransportador] = useState("");
  const [motorista, setMotorista] = useState("");
  const [rg, setRg] = useState("");
  const [recebedor, setRecebedor] = useState("");

  function handleSalvar() {
    if (!numeroControle.trim()) {
      Alert.alert("Atenção", "Informe o Nº de Controle.");
      return;
    }

    addCautela({
      numeroControle,
      dataMov,
      origemLocal,
      booking,
      origemData,
      origemHorario,
      armador,
      pesoLiq,
      lacreArmador,
      obs,
      destinoLocal,
      destinoData,
      destinoHorario,
      placaCavalo,
      conteiner,
      tara,
      notasFiscais,
      pesoBruto,
      tipoCabinete,
      transportador,
      motorista,
      rg,
      recebedor,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)/historico");
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPad + 16 }]}> 
        <View>
          <Text style={styles.headerTitle}>NOVA CAUTELA</Text>
          <Text style={styles.headerSub}>Movimentação de Contêiner</Text>
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
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <SectionHeader title="Identificação" />
          <View style={styles.ctrlRow}>
            <Text style={[styles.ctrlLabel, { color: colors.mutedForeground }]}>Nº DE CONTROLE</Text>
            <Text style={[styles.ctrlValue, { backgroundColor: colors.muted, color: colors.primary }]}> 
              {numeroControle}
            </Text>
          </View>
          <DateField label="Data da Movimentação" value={dataMov} onChange={setDataMov} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <SectionHeader title="Origem" subtitle="Dados do local de saída" />
          <FormField
            label="Local"
            value={origemLocal}
            onChangeText={setOrigemLocal}
            placeholder="Local de origem"
          />
          <FormField
            label="Booking"
            value={booking}
            onChangeText={setBooking}
            placeholder="Número do booking"
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <DateField label="Data" value={origemData} onChange={setOrigemData} />
            </View>
            <View style={styles.half}>
              <TimeField label="Horário" value={origemHorario} onChange={setOrigemHorario} />
            </View>
          </View>
          <FormField
            label="Armador"
            value={armador}
            onChangeText={setArmador}
            placeholder="Nome do armador"
          />
          <FormField
            label="Peso Líq."
            value={pesoLiq}
            onChangeText={setPesoLiq}
            placeholder="Kg"
            keyboardType="numeric"
          />
          <FormField
            label="Lacre (Armador)"
            value={lacreArmador}
            onChangeText={setLacreArmador}
            placeholder="Número do lacre"
          />
          <FormField
            label="OBS"
            value={obs}
            onChangeText={setObs}
            placeholder="Observações adicionais"
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: "top", paddingTop: 10 }}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <SectionHeader title="Destino" subtitle="Dados do local de chegada" />
          <FormField
            label="Local"
            value={destinoLocal}
            onChangeText={setDestinoLocal}
            placeholder="Local de destino"
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <DateField label="Data" value={destinoData} onChange={setDestinoData} />
            </View>
            <View style={styles.half}>
              <TimeField label="Horário" value={destinoHorario} onChange={setDestinoHorario} />
            </View>
          </View>
          <FormField
            label="Placa (Cavalo)"
            value={placaCavalo}
            onChangeText={setPlacaCavalo}
            placeholder="AAA-0000"
            autoCapitalize="characters"
          />
          <FormField
            label="Contêiner"
            value={conteiner}
            onChangeText={setConteiner}
            placeholder="Número do contêiner"
            autoCapitalize="characters"
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <FormField
                label="Tara"
                value={tara}
                onChangeText={setTara}
                placeholder="Kg"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.half}>
              <FormField
                label="Peso Bruto"
                value={pesoBruto}
                onChangeText={setPesoBruto}
                placeholder="Kg"
                keyboardType="numeric"
              />
            </View>
          </View>
          <FormField
            label="Nota(s) Fiscal(is)"
            value={notasFiscais}
            onChangeText={setNotasFiscais}
            placeholder="Números das NFs"
          />
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>TIPO DE CABINETE</Text>
          <View style={styles.toggleRow}>
            {(["cheio", "vazio"] as TipoCabinete[]).map((tipo) => (
              <TouchableOpacity
                key={tipo}
                style={[
                  styles.toggleBtn,
                  {
                    backgroundColor: tipoCabinete === tipo ? colors.primary : colors.muted,
                    borderColor: tipoCabinete === tipo ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setTipoCabinete(tipo)}
                activeOpacity={0.8}
              >
                {tipo === "cheio"
                  ? <Package size={16} color={tipoCabinete === tipo ? "#fff" : colors.mutedForeground} />
                  : <Square size={16} color={tipoCabinete === tipo ? "#fff" : colors.mutedForeground} />}
                <Text
                  style={[
                    styles.toggleText,
                    { color: tipoCabinete === tipo ? "#fff" : colors.mutedForeground },
                  ]}
                >
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <SectionHeader title="Transportador" subtitle="Responsáveis pela movimentação" />
          <FormField
            label="Transportador"
            value={transportador}
            onChangeText={setTransportador}
            placeholder="Nome da transportadora"
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <FormField
                label="Motorista"
                value={motorista}
                onChangeText={setMotorista}
                placeholder="Nome"
              />
            </View>
            <View style={styles.half}>
              <FormField
                label="RG"
                value={rg}
                onChangeText={setRg}
                placeholder="RG do motorista"
                keyboardType="numeric"
              />
            </View>
          </View>
          <FormField
            label="Recebedor"
            value={recebedor}
            onChangeText={setRecebedor}
            placeholder="Nome do recebedor"
          />
        </View>

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
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
    color: "rgba(255,255,255,0.78)",
    marginTop: 4,
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
  content: {
    padding: 20,
    gap: 14,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    overflow: "hidden",
    shadowColor: "rgba(15,23,42,0.06)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  half: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  ctrlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  ctrlLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.4,
  },
  ctrlValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    overflow: "hidden",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 10,
  },
  submitText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
