# Thiba Cautelas — Resumo do Projeto

Sistema de controle de cautelas de movimentação de containers para a **Thiba Logística e Serviços Ltda**.

Repositório: https://github.com/jairoferreira/container-control

## Stack técnica

- **Backend**: Node.js + Express (`artifacts/api-server`)
- **Banco de dados**: PostgreSQL via Drizzle ORM (`lib/db`)
- **App**: Expo / React Native, web habilitado como PWA instalável (`artifacts/mobile`)
- **Gerenciador**: pnpm workspace

## Como rodar localmente (Windows)

Pré-requisitos já instalados nesta máquina: Node.js 24, pnpm, PostgreSQL 18 (usuário `postgres`, senha `postgres`, banco `container_control`).

```powershell
# 1. Subir a API (porta 5000)
cd artifacts\api-server
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/container_control"
$env:PORT = "5000"
pnpm run dev

# 2. Gerar e servir o app web (porta 8081)
cd artifacts\mobile
$env:EXPO_PUBLIC_API_URL = "http://localhost:5000"   # ou a URL pública da API, se usar túnel
pnpm exec expo export -p web
npx serve -s dist -l 8081
```

Para acesso remoto (demo, celular etc.), usar **Cloudflare Tunnel** (`cloudflared tunnel --url http://localhost:5000` e o mesmo para a porta 8081) — gratuito, não precisa de conta.

## O que já funciona (estado em 29/06/2026)

- Login por **matrícula curta (THB001, THB002...) + PIN**, validado **no servidor** (não mais local)
- PIN secreto de gestor (3 toques no logo) — também validado no servidor, com hash (bcrypt)
- Bloqueio por tentativas (5 erros = 15 min) imposto pelo servidor, não contornável limpando dados do navegador
- Cadastro de motoristas e placas **agora vive no banco de dados** — compartilhado entre todos os dispositivos (antes era só local em cada celular)
- Fluxo completo de cautela: criar → sincronizar automaticamente → finalizar (recebedor, RG, data/hora)
- Sincronização em tempo real entre todos os dispositivos, sem botão manual
- Geração de PDF da cautela (layout oficial) e relatório tabular em Excel
- Instalável como app no celular (PWA) — ícone da Thiba, tela cheia, sem barra do navegador
- Tutorial animado interativo (`/tutorial.html`) explicando o preenchimento pro motorista
- Testado e aprovado pelo usuário em iPhone real
- **3 perfis de acesso**: Motorista (cria/sincroniza cautelas), Admin/Gestor (tudo + cadastros + PINs), e **Consulta** (só-leitura — Dashboard + Histórico + exportação, sem editar nada; pensado pra secretária/conferência). Consulta acessa pelo mesmo gesto (3 toques no logo), com um PIN próprio definido pelo admin em Configurações

## Pendente / próximos passos

- [ ] Escolher hospedagem definitiva do backend (decisão: **custo fixo mensal**, não pay-as-you-go — favorito hoje é **KingHost VPS**)
- [ ] Apontar subdomínio (ex: `cautelas.thiba.com.br`) via painel atual do domínio (sem tocar nos nameservers, pra não quebrar o e-mail da empresa)
- [ ] Emitir certificado SSL definitivo
- [ ] Rodar `pnpm --filter @workspace/api-server run seed` no banco de produção (gera PINs novos — ver aviso de segurança abaixo)
- [ ] Homologação final com a gestão da Thiba
- [ ] Publicação em produção

## Segurança — importante

- O PIN do admin inicial (`123456`, gerado pelo seed) **precisa ser trocado** em Configurações antes de divulgar o sistema
- Os PINs gerados pelo seed ficam só em `PINS_INICIAIS_NAO_COMMITAR.txt` (fora do git) — distribuir aos motoristas e apagar o arquivo depois
- Toda ação administrativa (criar/editar/remover motorista ou placa) exige o cabeçalho `x-admin-pin`, validado contra o hash salvo — nunca contra texto puro

## Domínio e hospedagem atual da empresa

- Domínio: `thiba.com.br` (titular: Carlos Alessandro da Silva Freire)
- DNS atual: `ns1/ns2.newmd.com.br` — **não trocar**, e-mail da empresa depende disso
- Painel de controle (estilo Plesk) tem acesso a "Gerenciar Subdomínios", "Gerenciar DNS" e "Certificados SSL"
- Confirmado: hospedagem atual é compartilhada tradicional (só MySQL/MariaDB, sem Node.js/SSH) — backend precisa rodar em outro lugar

## Comercial

Proposta gerada separadamente em `C:\Users\JAIRO\Downloads\Proposta_Comercial_Thiba_Cautelas.docx` (não versionada neste repositório, é documento de negócio):

- Implantação (único): **R$ 5.000,00**
- Manutenção mensal: **R$ 500,00/mês**
