# Implementação — Front Projeto Integrador

Este documento descreve os gaps de produto resolvidos nesta entrega do app mobile
(React Native + Expo SDK 54 + TypeScript), os arquivos afetados, a nova dependência,
como o app consome a API e como fazer o smoke test no Expo Go.

A navegação real do app é via React Navigation (`src/navigation/index.tsx` →
`AppNavigator` e `src/navigation/MainTabNavigator.tsx`). O `expo-router`, apesar de
presente nas dependências, **não** é usado para as telas.

---

## Visão geral por fluxo

### 1. Onboarding (primeira execução)

Antes a `OnboardingScreen` existia mas não estava registrada na navegação.

- O flag `onboarding_completed` é persistido de forma segura (SecureStore no
  nativo, `localStorage` no web) com o mesmo padrão usado para `auth_token`.
- No `AppNavigator`, quando o usuário **não está logado** e `onboarding_completed`
  é falso, a tela `Onboarding` é exibida antes do `Login`. O flag é carregado de
  forma assíncrona com estado local + efeito, exibindo o `ActivityIndicator`
  enquanto resolve (mesmo padrão do `isLoading` da auth).
- Ao concluir o onboarding (botão "Continuar" no último slide), chamamos
  `setOnboardingCompleted(true)` e navegamos para `Login`. Nas próximas aberturas
  o onboarding é pulado.

Arquivos:
- `src/store/authStorage.ts` — `getOnboardingCompleted()` / `setOnboardingCompleted()`.
- `src/navigation/index.tsx` — carregamento do flag + condicional da tela.
- `src/screens/OnboardingScreen.tsx` — persistência ao finalizar.
- `src/types/navigation.ts` — `Onboarding` já estava em `RootStackParamList`.

> Decisão: o flag é lido direto no navigator (não foi exposto via `AuthContext`),
> pois é relevante apenas no fluxo pré-login e não faz parte da sessão do usuário.

### 2. Lista de editais com score de compatibilidade em destaque

O `compatibilityScore` agora aparece de forma **proeminente** em cada cartão:

- Badge sobreposto à mídia do cartão, no canto superior esquerdo, com o percentual.
- Pílula colorida abaixo dos detalhes com o percentual + faixa textual.
- Cor por faixa: **Alta** (>= 80, verde), **Média** (>= 60, amarelo/âmbar),
  **Baixa** (< 60, vermelho). O rótulo da faixa também entra no `accessibilityLabel`.

Arquivos:
- `src/components/home/OpportunityCard.tsx` — badge + pílula + `getCompatibilityTier`.

A `HomeScreen` já passava `compatibility` para o cartão (com fallback determinístico
quando o backend não envia o score), então nenhuma mudança de dados foi necessária ali.

### 3. Checklist interativo de habilitação

A antiga lista estática "O que conferir" da tela de detalhe foi substituída por um
**checklist interativo persistido na API**, mais um **seletor de status de
participação (funil)**.

- Ao montar a tela, além do detalhe (`getContratacao`), buscamos o checklist
  (`getContratacaoChecklist`).
- Cada item é um checkbox; o toque alterna `checked` com **atualização otimista**
  (UI muda na hora) e dispara `updateContratacaoChecklist`. Em caso de erro, o
  estado é **revertido** e uma mensagem é exibida.
- O seletor de status (Em preparação / Enviada / Ganha / Perdida) persiste via
  o mesmo PUT, também com atualização otimista e reversão em erro.
- Loading, erro e estado vazio são tratados. O restante da tela (dados do órgão,
  datas, valor, links oficiais) permanece intacto.

Arquivos:
- `src/services/contratacoes.ts` — tipos `ParticipationStatus`, `ChecklistItem`,
  `Checklist`, `UpdateChecklistPayload` e funções `getContratacaoChecklist` /
  `updateContratacaoChecklist`.
- `src/screens/OpportunityDetailScreen.tsx` — estado, handlers e UI do checklist.

### 4. Notificações locais de prazo

Novo utilitário com `expo-notifications` para lembrar o usuário de prazos críticos.

- `configureNotificationHandler()` — define como notificações aparecem com o app
  aberto (banner + lista + som). Idempotente.
- `requestNotificationPermission()` — pede permissão uma vez; respeita
  `canAskAgain`.
- `scheduleDeadlineNotification({ id, title, body, date })` — agenda uma
  notificação local para uma data. **Evita duplicar**: cancela o agendamento
  anterior com o mesmo `id` antes de reagendar. Ignora datas no passado.
- `scheduleAlertsDeadlineNotifications(alerts)` — recebe a lista de alertas e
  agenda lembretes para os de data crítica futura (por padrão 2 dias antes; se já
  passou, usa a própria data crítica).
- Em `Platform.OS === 'web'` todas as funções são **no-op seguro** (retornam
  `false`/`null`/`[]`), pois o suporte é limitado.

A `AlertsScreen`, após carregar os alertas com sucesso, pede permissão **uma única
vez por sessão** e agenda lembretes apenas para os alertas acionáveis (prioridade
crítica/em breve). O agendamento é logado e **não bloqueia a UI**.

Arquivos:
- `src/utils/notifications.ts` (novo).
- `src/screens/AlertsScreen.tsx` — efeito de agendamento + permissão.

### 5. Dashboard / Funil no perfil

A `ProfileScreen` agora consome os campos novos de `GET /me/dashboard`:

- **Funil visual** com 4 etapas (Em preparação, Enviadas, Ganhos, Perdidos):
  barras proporcionais ao maior valor, com cores do tema e contagem ao lado.
- **Histórico por mês**: lista/gráfico de barras simples com o total por mês.
- Tiles de métricas existentes foram mantidos. Loading, erro (silencioso, o perfil
  segue útil) e vazio são tratados.

Arquivos:
- `src/services/auth.ts` — tipos `ProfileFunnel`, `ProfileHistoryEntry` e campos
  opcionais `funnel` / `history` em `ProfileDashboard`.
- `src/screens/ProfileScreen.tsx` — `FunnelSection`, `FunnelBar`, `HistoryRow`.

---

## Nova dependência: `expo-notifications`

- Versão: `~0.32.17` (compatível com Expo SDK 54), adicionada ao `package.json`.
- Plugin `expo-notifications` adicionado em `app.json` → `expo.plugins`.

### Como instalar

O recomendado é:

```bash
cd front-projeto-integrador
npx expo install expo-notifications
```

Se o ambiente falhar com o CLI do Expo (como ocorreu nesta máquina por um problema
do próprio CLI ao aplicar config plugins), instale via npm — a versão já está
fixada no `package.json`:

```bash
npm install
# ou, explicitamente:
npm install expo-notifications@~0.32.17
```

> Importante: notificações **locais agendadas** funcionam no Expo Go. Notificações
> **push remotas** exigem build de desenvolvimento (Dev Client) nas versões recentes
> do Expo Go — aqui usamos apenas notificações locais, então o Expo Go basta.

---

## Como o app consome a API

Cliente HTTP: `src/services/api.ts` (`apiRequest`), com token via `useAuth`/`token`.

### Checklist (`OpportunityDetailScreen`)

- `GET /contratacoes/:id/checklist`
  ```json
  {
    "contratacaoId": "string",
    "participationStatus": "preparing",
    "items": [{ "id": "doc-1", "label": "CNPJ ativo e regular", "checked": false, "required": true }],
    "updatedAt": "2026-06-05T00:00:00.000Z"
  }
  ```
- `PUT /contratacoes/:id/checklist` — envia só o que mudou e recebe o checklist
  completo de volta:
  ```json
  { "participationStatus": "submitted", "items": [{ "id": "doc-1", "checked": true }] }
  ```
  - Toggle de item → `{ items: [{ id, checked }] }`.
  - Troca de status → `{ participationStatus }`.

### Dashboard (`ProfileScreen`)

- `GET /me/dashboard` — além das métricas já existentes, lê:
  ```json
  {
    "funnel": { "preparing": 2, "submitted": 1, "won": 0, "lost": 1 },
    "history": [{ "month": "2026-05", "preparing": 1, "submitted": 1, "won": 0, "lost": 0, "total": 2 }]
  }
  ```
  `funnel` e `history` são opcionais no tipo; se ausentes, o funil mostra estado
  vazio e o histórico simplesmente não é renderizado.

---

## Smoke test no Expo Go

1. Instale as dependências:
   ```bash
   cd front-projeto-integrador
   npm install
   ```
2. Suba o app:
   ```bash
   npx expo start
   ```
   Abra no Expo Go (celular físico recomendado para testar notificações).
3. **Onboarding**: em uma instalação limpa (ou após limpar storage / reinstalar),
   o app deve abrir no Onboarding. Avance os slides e toque em "Continuar" no
   último — deve ir para o Login e, ao reabrir o app, pular o onboarding.
4. **Lista/score**: na aba Editais, confira o badge de % no canto da mídia e a
   pílula colorida (verde/âmbar/vermelho conforme a faixa) em cada cartão.
5. **Checklist**: abra um edital. Marque/desmarque itens (deve refletir na hora e
   persistir) e troque o status de participação (Em preparação → Enviada etc.).
   Desligue a rede para validar a reversão em caso de erro.
6. **Notificações**: na aba Alertas, ao carregar, o app pede permissão de
   notificações (aceite). Verifique no console o log
   `[Alertas] N lembrete(s) de prazo agendado(s).`. Lembretes são agendados para
   datas críticas futuras (2 dias antes).
7. **Funil/Perfil**: na aba Perfil, role até "Funil de participações" e veja as
   barras das 4 etapas e o histórico por mês.

---

## Validação

- `npx tsc --noEmit` — **0 erros**.
- `npx eslint` nos arquivos alterados — **0 problemas**.
- `npm run lint` (`expo lint`) falha neste ambiente por um problema do
  CLI/corepack-yarn (lockfile), não relacionado às mudanças de código. Use o
  `eslint` direto se necessário.

## Arquivos novos / alterados

Novos:
- `src/utils/notifications.ts`
- `IMPLEMENTACAO.md`

Alterados:
- `src/store/authStorage.ts`
- `src/navigation/index.tsx`
- `src/screens/OnboardingScreen.tsx`
- `src/services/contratacoes.ts`
- `src/services/auth.ts`
- `src/screens/OpportunityDetailScreen.tsx`
- `src/screens/AlertsScreen.tsx`
- `src/screens/ProfileScreen.tsx`
- `src/components/home/OpportunityCard.tsx`
- `app.json`
- `package.json` (dependência `expo-notifications`)

## P0 — Correções de alinhamento ao MVP

Esta seção documenta as correções P0 do frontend que alinham o app ao MVP, consumindo o contrato do backend implementado em paralelo.

### 1. Recuperação de senha (BLOCO A)

Fluxo de duas etapas em uma única tela (`src/screens/ForgotPasswordScreen.tsx`):

1. **Solicitação**: o usuário informa email ou CNPJ. Chamamos `POST /auth/forgot-password`.
   - Em **desenvolvimento**, o backend devolve `resetToken` na resposta; nesse caso o app pré-preenche o código e avança automaticamente para a etapa 2, exibindo a validade (`expiresInMinutes`).
   - Em **produção**, sem `resetToken`, exibimos a mensagem neutra "Se a conta existir, enviamos as instruções" (evita enumeração de contas) e avança para a etapa 2.
2. **Redefinição**: o usuário informa o código + nova senha + confirmação. Validação com Zod reutilizando a política forte do cadastro (`passwordSchema` exportado de `src/validation/auth.ts`). Chamamos `POST /auth/reset-password`. Em sucesso, exibimos um `Alert` de confirmação e navegamos para `Login`.

Serviços novos em `src/services/auth.ts`: `requestPasswordReset(identifier)` e `resetPassword(token, newPassword)` (POST sem token de auth).

Navegação: `ForgotPassword` adicionado ao `RootStackParamList` (`src/types/navigation.ts`) e registrado no grupo não autenticado (`src/navigation/index.tsx`). A tela de Login (`src/screens/LoginScreen.tsx`) ganhou o link "Esqueci minha senha".

**Smoke test**: na tela de Login, toque em "Esqueci minha senha" → informe um email/CNPJ → em DEV o código é preenchido automaticamente → defina uma nova senha forte (8+ caracteres, com maiúscula, minúscula e número) → confirme → o `Alert` aparece e leva ao Login.

### 2. Filtros combináveis + correção do score fabricado (BLOCO B)

As antigas abas mutuamente exclusivas ("Oportunidades MEI", "Recife/PE", "Meu CNAE") foram substituídas por um painel de filtros combináveis (`src/components/home/HomeFilterPanel.tsx`, um modal/bottom-sheet "Filtros"). O componente `HomeFilterTabs` foi removido.

Filtros disponíveis (todos combináveis simultaneamente):
- **Busca por palavra-chave** (mantida na `HomeSearchBar`) → `q`.
- **Município + UF** → `municipio` / `uf`. Iniciam **vazios** (sem os valores chumbados "Recife/PE").
- **Modalidade** (chips: "Todas", "Pregão - Eletrônico", "Dispensa Eletrônica", "Concorrência") → `modalidadeNome`.
- **Faixa de valor** (presets: "Qualquer valor", "Até R$ 50 mil", "R$ 50–150 mil", "Acima de R$ 150 mil") → `valorMin` / `valorMax`.
- **Oportunidades MEI** (toggle) → `meOnly`.
- **Compatível com meu CNAE** (toggle): quando ligado envia o `cnae` do usuário (de `useAuth`) e a lista vem ordenada por compatibilidade pelo backend. O filtro fica desabilitado quando o usuário não tem CNAE. Antes esse caso era um no-op; agora é funcional.

Na Home há um botão "Filtros" com indicador de filtros ativos (badge com contagem) e um atalho "Limpar filtros".

Em `src/services/contratacoes.ts`, `ListContratacoesParams` ganhou `modalidadeNome`, `valorMin` e `valorMax` (serializados genericamente em `listContratacoes`).

**Correção do score fabricado**: removido o array fixo `[80,76,92,84,88,72]` e a injeção por índice em `HomeScreen.tsx`. O `OpportunityCard` agora exibe somente o `compatibilityScore` REAL vindo da API; quando ausente, mostra o estado neutro "Sem score" em vez de inventar um valor. A duplicação (badge sobre a imagem + pill) foi eliminada: resta uma única exibição proeminente e honesta (o pill com o tier real, ou "Sem score").

**Smoke test**: na Home, abra "Filtros" → combine MEI + uma faixa de valor + município → "Ver resultados"; confira que a contagem de filtros ativos aparece no botão. Ligue "Compatível com meu CNAE" (com um usuário que tenha CNAE) e verifique a reordenação. Verifique que cards sem score mostram "Sem score" e que nenhum valor de aderência aparece duplicado.

### 3. Detalhe enriquecido (BLOCO C)

Em `src/screens/OpportunityDetailScreen.tsx` e tipos em `src/services/contratacoes.ts`:

- Tipo `ContratacaoDetail` estendido com `resumoSimplificado?: string[]` e `elegibilidade?: { exclusivaMeEpp; dentroLimiteMei; mensagem }`.
- **"Entenda este edital"**: nova seção que lista o `resumoSimplificado` em bullets.
- **Requisitos**: seção dedicada exibindo `requisitos` (antes ignorado na tela).
- **Cronograma**: exibe as 4 datas de `datasImportantes` (abertura, encerramento, publicação no PNCP e última atualização), formatadas em pt-BR, tratando nulos com "Não informado".
- **Elegibilidade**: card com cores semânticas (verde quando `dentroLimiteMei`, âmbar caso contrário) usando `elegibilidade.mensagem`, com tag extra quando `exclusivaMeEpp`.
- **Progresso do checklist**: barra + contador "X de Y concluídos" (calculado de `checklist.items`), no topo da seção de checklist.
- **Pull-to-refresh** agora recarrega o detalhe **e** o checklist.
- **Salvamento por item**: o estado de saving é por item (`savingItemIds`), então marcar um item não bloqueia mais a lista inteira; o status de participação tem seu próprio estado (`isSavingParticipation`). Mantido o comportamento otimista com reversão em erro.
- O score na tela de detalhe também passou a ser honesto: mostra a aderência real ou "Sem score de aderência".

**Smoke test**: abra um edital → confira o resumo simplificado em bullets, os requisitos, as 4 datas do cronograma e o card de elegibilidade (cor coerente com `dentroLimiteMei`). Marque dois itens do checklist quase simultaneamente e verifique que cada um salva de forma independente (apenas o item em trânsito mostra spinner) e que a barra de progresso atualiza. Puxe para atualizar e confirme que detalhe e checklist recarregam.

### Validação

`npx tsc --noEmit` passa com zero erros e `eslint` nos arquivos alterados não reporta problemas.

---

## PLANO-MVP — Execução (Frontend)

### 1.1 Alinhamento de copy (remover alegação de IA)

O app traduz editais por regras/glossário; não há IA integrada. Os textos de UI foram
ajustados para refletir o que o produto realmente faz, mantendo o valor de
desmistificar/simplificar licitações.

- `src/screens/OnboardingScreen.tsx` (slide "Chega de editais complicados"):
  - **De:** "Nossa IA analisa os requisitos da Lei 14.133/2021 e te diz exatamente o que você precisa para participar, sem juridiquês."
  - **Para:** "Traduzimos os requisitos da Lei 14.133/2021 em linguagem simples e mostramos de forma organizada o que você precisa para participar, sem juridiquês."

Demais telas visíveis ao usuário (ex.: `OpportunityDetailScreen.tsx`) já usavam copy
honesta ("Resumo em linguagem simples", "Requisitos", "Condições de participação previstas
no edital"), sem alegação de IA — nenhuma alteração necessária. Verificado por `grep` que
não restam menções enganosas a "IA"/"Inteligência Artificial" em strings de UI do `src/`.

### 2.3 / 3.4 Configuração de streaming e variáveis de ambiente

- `src/config/streaming.ts` lê `EXPO_PUBLIC_STREAMING_WS_URL` com default
  `wss://cesar-engenharia-de-dados.onrender.com/ws/notificacoes`; consumido em
  `src/hooks/useLicitacoesStreaming.ts`.
- `src/config/api.ts` lê `EXPO_PUBLIC_API_URL` com default
  `https://api-projeto-integrador-hcu8.onrender.com`.
- `.env.example` completado:
  - Mantida `EXPO_PUBLIC_API_URL=http://localhost:3000`.
  - Adicionada `EXPO_PUBLIC_STREAMING_WS_URL=wss://cesar-engenharia-de-dados.onrender.com/ws/notificacoes`.
- Os defaults no código continuam funcionando sem `.env`, então o app opera mesmo sem o arquivo.
