# Histórias de Usuário — Plataforma de Apoio à Concorrência Pública para MEIs

Checklist das histórias de usuário do projeto, no formato *Como [persona], quero [objetivo], para [benefício]*.

- ✅ **marcado** = implementado e funcional (verificado no código).
- ⬜ **desmarcado** = não implementado / pendente. Itens com a anotação *(fora de escopo)* foram conscientemente deixados de fora por decisão de produto.

**Personas:** **MEI** (microempreendedor usuário do app) · **Equipe** (desenvolvimento/disciplina) · **Avaliador** (quem testa/roda o projeto).

---

## Épico 1 — Onboarding e Autenticação

- [x] **US-01** — Como MEI, quero ver uma introdução com os benefícios do app no primeiro acesso, para entender o valor antes de me cadastrar. *(carrossel de 3 slides, exibido só na 1ª vez via flag `onboarding_completed` no SecureStore)*
- [x] **US-02** — Como MEI, quero criar minha conta informando dados da empresa (CNPJ e CNAE), para personalizar as oportunidades. *(cadastro em wizard de 3 passos com validação)*
- [x] **US-03** — Como MEI, quero fazer login com e-mail/CNPJ e senha, para acessar minha área de forma segura. *(JWT + persistência em SecureStore)*
- [x] **US-04** — Como MEI, quero recuperar minha senha caso esqueça, para não perder o acesso. *(fluxo solicitar → redefinir; e-mail real quando `SMTP_*` configurado, fallback dev caso contrário)*
- [x] **US-05** — Como MEI, quero permanecer logado entre sessões e sair com segurança, para conveniência sem abrir mão da proteção. *(restauração de sessão, logout com revogação de token, logout automático em 401)*
- [ ] **US-06** — Como MEI, quero um botão "mostrar senha", para conferir o que digitei. *(pendente)*
- [ ] **US-07** — Como MEI, quero ver os requisitos de senha forte antes de enviar o formulário, para não errar repetidamente. *(pendente — hoje aparecem como erro após o submit)*
- [ ] **US-08** — Como MEI com baixa visão, quero rótulos de acessibilidade nos campos, para usar leitores de tela. *(pendente — `accessibilityLabel` ausente nos inputs)*
- [ ] **US-09** — Como MEI, quero receber o link de recuperação por e-mail em produção por padrão, para um fluxo completo sem configuração manual. *(pendente — depende de provedor SMTP configurado)*

## Épico 2 — Descoberta e Busca de Editais

- [x] **US-10** — Como MEI, quero buscar editais por palavra-chave, para achar oportunidades do meu ramo. *(busca com debounce de 350ms)*
- [x] **US-11** — Como MEI, quero filtrar por município/UF, para ver oportunidades da minha região. *(filtro de localização)*
- [x] **US-12** — Como MEI, quero filtrar por modalidade de licitação, para focar nos tipos que me interessam. *(seletor de modalidade)*
- [x] **US-13** — Como MEI, quero filtrar por faixa de valor estimado, para ver licitações compatíveis com meu porte. *(presets de faixa de valor)*
- [x] **US-14** — Como MEI, quero ver apenas oportunidades adequadas a MEI/ME-EPP, para não perder tempo com editais fora do meu alcance. *(filtro "Oportunidades MEI")*
- [x] **US-15** — Como MEI, quero combinar vários filtros ao mesmo tempo, para refinar a busca. *(painel de filtros combináveis + "Limpar")*
- [x] **US-16** — Como MEI, quero ver um score de compatibilidade com meu CNAE em cada edital, para priorizar os mais aderentes. *(badge por faixa Alta/Média/Baixa, score real — sem valores fabricados)*
- [x] **US-17** — Como MEI, quero que os editais mais compatíveis apareçam primeiro, para focar no que importa. *(ordenação por compatibilidade antes da paginação, dentro de um pool)*
- [x] **US-18** — Como MEI, quero atualizar a lista puxando a tela, para ver dados recentes. *(pull-to-refresh)*
- [x] **US-19** — Como MEI, quero ser avisado de novas oportunidades em tempo real, para não perder editais recém-publicados. *(streaming via WebSocket)*
- [ ] **US-20** — Como MEI, quero carregar mais resultados ao rolar a lista, para navegar por todos os editais. *(pendente — hoje a lista mostra um lote fixo de ~12 itens, sem scroll infinito/paginação na UI)*

## Épico 3 — Detalhe do Edital e Checklist de Habilitação

- [x] **US-21** — Como MEI, quero ver os detalhes do edital (objeto, órgão, valor, situação), para avaliar a oportunidade. *(tela de detalhe completa)*
- [x] **US-22** — Como MEI, quero um resumo do edital em linguagem simples, para entender sem juridiquês. *("Entenda este edital", tradução por glossário/regras)*
- [x] **US-23** — Como MEI, quero ver os requisitos e o amparo legal explicados, para saber o que é exigido. *(seção de requisitos)*
- [x] **US-24** — Como MEI, quero ver o cronograma do edital (abertura, encerramento, publicação, atualização), para controlar prazos. *(4 datas exibidas)*
- [x] **US-25** — Como MEI, quero saber se sou elegível (ME/EPP, limite de valor do MEI), para decidir se participo. *(indicador de elegibilidade)*
- [x] **US-26** — Como MEI, quero um checklist de habilitação específico para aquele edital, para me organizar. *(itens correlacionados ao edital)*
- [x] **US-27** — Como MEI, quero marcar/desmarcar itens do checklist e ver o progresso (X de Y), para acompanhar minha preparação. *(checkboxes + barra de progresso, salvamento otimista)*
- [x] **US-28** — Como MEI, quero registrar o status da minha participação (Em preparação, Enviada, Ganha, Perdida), para acompanhar o funil. *(seletor de status persistido)*
- [x] **US-29** — Como MEI, quero abrir os links oficiais do edital, para acessar a fonte. *(links oficiais com tratamento de indisponibilidade)*
- [ ] **US-30** — Como MEI, quero uma explicação gerada por IA dos requisitos jurídicos, para um detalhamento ainda mais personalizado. *(não implementado — por decisão de produto a alegação de IA foi removida; integração de LLM real fica para fase futura)*

## Épico 4 — Alertas e Prazos

- [x] **US-31** — Como MEI, quero ver alertas automáticos de prazos de propostas e de documentos, para não perder datas. *(geração automática no backend)*
- [x] **US-32** — Como MEI, quero receber notificações locais no celular próximas aos prazos, para ser lembrado mesmo fora do app. *(expo-notifications, agenda ~2 dias antes)*
- [x] **US-33** — Como MEI, quero ver alertas em tempo real, para reagir rápido a novidades. *(stream WebSocket)*
- [x] **US-34** — Como MEI, quero marcar alertas como lidos ou resolvidos, para organizar minha caixa. *(ações de ler/resolver)*
- [x] **US-35** — Como MEI, quero ver os alertas em lista e em calendário, para visualizar prazos do mês. *(visões lista/calendário)*
- [ ] **US-36** — Como MEI, quero receber notificação do sistema quando surgir uma nova oportunidade em tempo real, para não depender de estar com o app aberto. *(pendente — alertas de stream hoje só aparecem no app, não viram push do sistema)*
- [ ] **US-37** — Como MEI, quero receber notificações push remotas mesmo com o app fechado, para não perder nada. *(pendente — hoje apenas notificações locais)*

## Épico 5 — Documentos de Habilitação

- [x] **US-38** — Como MEI, quero cadastrar meus documentos de habilitação organizados por categoria, para ter um checklist do que preciso. *(CRUD por categorias)*
- [x] **US-39** — Como MEI, quero ver a validade/vencimento e o status de cada documento (em dia, a vencer, vencido), para manter tudo regular. *(status automático: expired/attention/ok/pending)*
- [x] **US-40** — Como MEI, quero ver um indicador de saúde dos meus documentos, para saber o quanto estou pronto. *(card de saúde com %)*
- [x] **US-41** — Como MEI, quero ser alertado quando um documento estiver perto de vencer, para renovar a tempo. *(integra com o motor de alertas)*
- [ ] **US-42** — Como MEI, quero anexar e visualizar o arquivo de cada documento, para guardar tudo num só lugar. *(fora de escopo — a API externa do PNCP não fornece os documentos a serem entregues; o módulo é um checklist inteligente, não um cofre de arquivos)*
- [ ] **US-43** — Como MEI, quero editar o nome e a validade de um documento já cadastrado, para corrigir informações. *(pendente)*
- [ ] **US-44** — Como MEI, quero escolher a data de vencimento por um seletor de calendário, para evitar erro de digitação. *(pendente — hoje é texto AAAA-MM-DD)*
- [ ] **US-45** — Como MEI, quero ver a contagem de documentos vencidos direto na aba Documentos, para priorizar ações. *(pendente — hoje só no Perfil)*

## Épico 6 — Painel / Perfil

- [x] **US-46** — Como MEI, quero um painel com métricas (editais compatíveis, saúde de documentos, alertas, pendências), para ter uma visão geral. *(tiles de métricas)*
- [x] **US-47** — Como MEI, quero ver meu funil de participação (Em preparação, Enviadas, Ganhos, Perdidos), para acompanhar meu progresso. *(funil visual com barras proporcionais)*
- [x] **US-48** — Como MEI, quero ver meu histórico de participações por mês, para entender minha evolução. *(histórico mensal)*
- [x] **US-49** — Como MEI, quero editar meus dados e preferências de notificação, para manter o perfil atualizado. *(modal de edição)*
- [x] **US-50** — Como MEI, quero sair da conta (logout), para proteger meus dados. *(logout com estado de carregamento)*
- [ ] **US-51** — Como MEI, quero alterar minha senha pela tela de perfil, para gerenciar minha segurança. *(pendente — hoje só via recuperação de senha)*
- [ ] **US-52** — Como MEI, quero adicionar uma foto/avatar ao perfil, para personalizar minha conta. *(pendente)*
- [ ] **US-53** — Como MEI, quero ver uma mensagem clara quando o painel falhar ao carregar, para saber que houve erro e tentar de novo. *(pendente — falha do dashboard hoje é silenciosa no app)*
- [ ] **US-54** — Como MEI, quero que minha preferência de "push" tenha efeito real, para controlar os avisos que recebo. *(pendente — preferência salva, mas push remoto não implementado)*

## Épico 7 — Dados, Qualidade e Operação (Equipe / Avaliador)

- [x] **US-55** — Como Equipe, quero extrair contratações reais do PNCP e persistir no MongoDB, para alimentar o app com dados reais. *(extração + camada bronze `contratacoes_brutas`)*
- [x] **US-56** — Como Equipe, quero transformar os dados preservando campos aninhados e gravar a coleção limpa consumida pela API, para a integração funcionar ponta a ponta. *(`contratacoes_limpas`)*
- [x] **US-57** — Como Equipe, quero a camada relacional no MySQL (gold) via PySpark/Prefect, para atender os requisitos da disciplina. *(PySpark + orquestração Prefect mantidos)*
- [x] **US-58** — Como Equipe, quero agendar a atualização do pipeline (cron diário) e usar janela de datas móvel, para manter os dados frescos. *(`serve_prefect.py` / `prefect.yaml`, `ETL_JANELA_DIAS`)*
- [x] **US-59** — Como Equipe, quero uma chave de deduplicação robusta no upsert, para evitar registros duplicados/parciais. *(chave composta)*
- [x] **US-60** — Como Equipe, quero testes automatizados no ETL e no backend, para evitar regressões. *(pytest + Vitest/Supertest)*
- [x] **US-61** — Como Equipe, quero o backend resiliente (sobe sem Mongo, reconecta) e seguro (helmet, rate limit, validação, JWT, CORS avisando em prod), para uma operação confiável. 
- [x] **US-62** — Como Avaliador, quero rodar o app facilmente apontando para a API pública, ou subir a stack local com docker-compose, para avaliar sem fricção. *(default público + `docker-compose.yml`)*
- [ ] **US-63** — Como Equipe, quero que a extração cubra mais de ~100 registros por execução e leia a paginação total da API, para ampliar a cobertura de editais. *(pendente — extração ainda limitada e focada em Recife)*
- [ ] **US-64** — Como Equipe, quero a coleção de contratações indexada na origem (ETL) também, para garantir performance independente do boot do backend. *(parcial — índices criados pelo backend; alinhar com o ETL fica pendente)*
- [ ] **US-65** — Como Equipe, quero a carga MySQL incremental em vez de recriar a tabela a cada execução, para preservar histórico. *(pendente — hoje `if_exists='replace'`)*
- [ ] **US-66** — Como Equipe, quero integrar o chatbot (Groq/Llama) e o MCP server ao produto, para oferecer assistência por IA aos usuários. *(pendente — existem isolados; não conectados ao app)*

---

## Resumo

| Épico | Implementadas | Pendentes |
|---|---|---|
| 1. Onboarding e Autenticação | 5 | 4 |
| 2. Descoberta e Busca | 10 | 1 |
| 3. Detalhe e Checklist | 9 | 1 |
| 4. Alertas e Prazos | 5 | 2 |
| 5. Documentos | 4 | 4 |
| 6. Painel / Perfil | 5 | 4 |
| 7. Dados, Qualidade e Operação | 8 | 4 |
| **Total** | **46** | **20** |

> As pendências marcadas como *(fora de escopo)* refletem decisões de produto (ex.: upload de arquivos — a API do PNCP não fornece os documentos da licitação) e não são consideradas dívidas obrigatórias para o MVP. A história de IA (US-30/US-66) foi adiada por decisão de produto.
