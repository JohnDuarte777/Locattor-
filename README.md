# Locattor

App para gerenciamento de imóveis de aluguel, para **Android e iOS**, feito com [Expo](https://expo.dev) (React Native + TypeScript).

## Funcionalidades

- **Login** – criar conta, entrar, sair e recuperar senha. Cada usuário vê apenas os próprios dados.
- **Imóveis** – cadastro com endereço, tipo, valor de aluguel, quartos, área e observações; situação (alugado/vago).
- **Inquilinos** – cadastro com CPF/CNPJ, telefone e e-mail; atalhos para ligar, enviar e-mail ou WhatsApp.
- **Contratos** – vincula imóvel e inquilino, com valor, dia de vencimento, vigência e caução. Pode ser encerrado ou reativado.
- **Cobranças automáticas** – as cobranças mensais são geradas automaticamente para os contratos ativos, do primeiro vencimento até o mês atual. Status: *pago*, *pendente* ou *atrasado*.
- **Cobrança pelo WhatsApp** – mensagem de lembrete pronta com mês, valor e vencimento.
- **Despesas** – IPTU, condomínio, manutenção, seguro etc., por imóvel.
- **Painel** – previsto x recebido no mês, valores em atraso, saldo, taxa de ocupação e próximos vencimentos.
- **Financeiro** – navegação mês a mês com resumo, aluguéis e despesas.

Por enquanto as contas e os dados ficam salvos no próprio aparelho (AsyncStorage) e funcionam offline. A estrutura já está pronta para migrar para um banco online (Supabase/PostgreSQL) — veja [docs/MIGRACAO_BANCO.md](docs/MIGRACAO_BANCO.md).

## Instalar no Android (sem computador)

A cada atualização do `main`, o GitHub compila o app automaticamente
(workflow `.github/workflows/android-apk.yml`) e publica o APK em **Releases**.

1. No celular Android, abra
   <https://github.com/JohnDuarte777/Locattor-/releases/latest/download/locattor.apk>
   (ou a página **Releases** do repositório e toque em `locattor.apk`).
2. Abra o arquivo baixado e toque em **Instalar**. Na primeira vez, o Android pede
   para **permitir apps desconhecidos** para o navegador — autorize.
3. Para atualizar, baixe e instale o APK novo por cima; os dados são mantidos.

> APK de testes, assinado com a chave padrão de desenvolvimento. Para publicar na
> Play Store é preciso gerar uma chave própria (ex.: com EAS Build).

## Como rodar no celular (com computador)

Pré-requisito: [Node.js](https://nodejs.org) 20 ou superior.

```bash
npm install
npx expo start
```

1. Instale o app **Expo Go** no celular ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)).
2. Escaneie o QR code exibido no terminal (no iPhone, use a câmera; no Android, use o Expo Go).

Também é possível abrir no navegador com `npm run web` (útil para testes rápidos).

## Gerar o app para instalar / publicar

Use o [EAS Build](https://docs.expo.dev/build/introduction/) (compila na nuvem, sem precisar de Xcode ou Android Studio):

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android   # gera .apk/.aab
npx eas-cli@latest build --platform ios       # requer conta Apple Developer
```

## Estrutura

```
src/
  app/                 # telas (Expo Router: cada arquivo é uma rota)
    (auth)/            # login, cadastro e recuperação de senha
    (app)/             # telas que exigem login
      (tabs)/          # abas: Início, Imóveis, Inquilinos, Contratos, Financeiro
      imovel/ inquilino/ contrato/ despesa/   # detalhes e formulários
  auth/                # estado de login (AuthProvider) e botão de sair
  components/          # componentes visuais reutilizáveis e tema
  data/                # tipos, store (estado global) e cálculo de alterações
  services/            # backend: login e dados (hoje local; trocável por banco online)
  lib/                 # regras de negócio (cobranças), formatação, WhatsApp
docs/                  # guia de migração e esquema SQL do banco online
```

## Scripts

| Comando             | Descrição                       |
| ------------------- | ------------------------------- |
| `npm start`         | Inicia o servidor de desenvolvimento |
| `npm run android`   | Abre no emulador/dispositivo Android |
| `npm run ios`       | Abre no simulador iOS (macOS)   |
| `npm run typecheck` | Verificação de tipos TypeScript |
