/**
 * Popula o banco com os motoristas e placas que hoje estão fixos no app
 * (SettingsContext.tsx), e cria a configuração inicial (PIN do admin).
 *
 * Gera um PIN aleatório de 4 dígitos por motorista (em vez do antigo "0000"
 * fixo para todos) e imprime a lista em texto puro UMA VEZ — é a única
 * oportunidade de ver esses PINs; depois disso só o hash fica salvo.
 *
 * Uso: pnpm --filter @workspace/api-server run seed
 */
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db, motoristasTable, placasTable, appSettingsTable } from "@workspace/db";

const NOMES = [
  "ALEKSANDRO FERREIRA DE OLIVEIRA",
  "AMIRALDO BRANCHES OLIVEIRA",
  "ARGEMIRO SAMPAIO XAVIER",
  "CLAUDEMIR SANTOS DA SILVA",
  "DEMACI DIAS DOS SANTOS",
  "EDILSON DE LUCENA CORREIA",
  "FRANCISCO DAS CHAGAS NEVES",
  "JOSE EVERARDO NOBRE",
  "JOSE HUMBERTO DE OLIVEIRA",
  "JOSÉ UBIRATAN RODRIGUES",
  "JÚLIO CESAR SILVA OLIVEIRA",
  "MAURÍCIO MIRANDA DA SILVA",
  "PAULO ALVES SILVA",
  "PAULO LONGEN",
  "PEDRO DA SILVA DAMASCENO",
  "RONALD DOS ANJOS SOUZA",
  "SANDRO LUIZ DA SILVA OLIVEIRA",
];

const PLACAS = [
  "FYS1140", "IIT5F54", "JXG4463", "JXM7918", "JXO7053",
  "NOJ2358", "NOJ4403", "NOP0408", "NOU4153", "NOW3D40",
  "NOX0579", "OAJ1855", "OAM1512", "OAM1522", "OCD0744",
  "PHF6227", "PHU3G94", "PHY4A96",
];

const ADMIN_PIN_INICIAL = "123456"; // trocar pelo app (Configurações > PIN do Administrador) após o primeiro login

function gerarPin4(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function main() {
  console.log("Seed: configurando app_settings...");
  const adminPinHash = await bcrypt.hash(ADMIN_PIN_INICIAL, 10);
  await db
    .insert(appSettingsTable)
    .values({ id: "main", adminPinHash, matriculaSeq: NOMES.length })
    .onConflictDoNothing();

  console.log("Seed: cadastrando motoristas...\n");
  const pinsParaDistribuir: { matricula: string; nome: string; pin: string }[] = [];

  for (let i = 0; i < NOMES.length; i++) {
    const matricula = `THB${String(i + 1).padStart(3, "0")}`;
    const pin = gerarPin4();
    const pinHash = await bcrypt.hash(pin, 10);

    await db
      .insert(motoristasTable)
      .values({
        id: randomUUID(),
        matricula,
        nome: NOMES[i],
        pinHash,
        ativo: true,
      })
      .onConflictDoNothing();

    pinsParaDistribuir.push({ matricula, nome: NOMES[i], pin });
  }

  console.log("Seed: cadastrando placas...");
  for (const placa of PLACAS) {
    await db.insert(placasTable).values({ id: randomUUID(), placa }).onConflictDoNothing();
  }

  console.log("\n================ PINS GERADOS (anote agora — não serão mostrados de novo) ================");
  console.log("PIN do Administrador:", ADMIN_PIN_INICIAL, "(troque depois de logar pela primeira vez)\n");
  for (const p of pinsParaDistribuir) {
    console.log(`  ${p.matricula}  —  ${p.nome.padEnd(34)}  —  PIN: ${p.pin}`);
  }
  console.log("=============================================================================================\n");

  console.log("Seed concluído.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro no seed:", err);
  process.exit(1);
});
