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

## O que já funciona (estado em 26/06/2026)

- Login por matrícula+PIN (motorista) e PIN secreto de gestor (3 toques no logo)
- Cadastro de motoristas e placas
- Fluxo completo de cautela: criar → sincronizar automaticamente → finalizar (recebedor, RG, data/hora)
- Sincronização em tempo real entre todos os dispositivos, sem botão manual
- Geração de PDF da cautela (layout oficial) e relatório tabular em Excel
- Instalável como app no celular (PWA) — ícone da Thiba, tela cheia, sem barra do navegador
- Testado e aprovado pelo usuário em iPhone real

## Pendente / próximos passos

- [ ] Escolher hospedagem definitiva do backend (decisão: **custo fixo mensal**, não pay-as-you-go — favorito hoje é **KingHost VPS**)
- [ ] Apontar subdomínio (ex: `cautelas.thiba.com.br`) via painel atual do domínio (sem tocar nos nameservers, pra não quebrar o e-mail da empresa)
- [ ] Emitir certificado SSL definitivo
- [ ] Homologação final com a gestão da Thiba
- [ ] Publicação em produção

## Domínio e hospedagem atual da empresa

- Domínio: `thiba.com.br` (titular: Carlos Alessandro da Silva Freire)
- DNS atual: `ns1/ns2.newmd.com.br` — **não trocar**, e-mail da empresa depende disso
- Painel de controle (estilo Plesk) tem acesso a "Gerenciar Subdomínios", "Gerenciar DNS" e "Certificados SSL"
- Confirmado: hospedagem atual é compartilhada tradicional (só MySQL/MariaDB, sem Node.js/SSH) — backend precisa rodar em outro lugar

## Comercial

Proposta gerada separadamente em `C:\Users\JAIRO\Downloads\Proposta_Comercial_Thiba_Cautelas.docx` (não versionada neste repositório, é documento de negócio):

- Implantação (único): **R$ 5.000,00**
- Manutenção mensal: **R$ 500,00/mês**
