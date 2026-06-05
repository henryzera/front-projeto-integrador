# Documentação do Projeto: Plataforma de Apoio à Concorrência Pública para MEIs

## 📋 Contexto e Metadados do Projeto
* **Tema Principal:** Plataforma de apoio à concorrência pública para Microempreendedores Individuais (MEIs).
* **Base Legal de Referência:** Lei nº 14.133/2021 (Nova Lei de Licitações e Contratos Administrativos).
* **Escopo Técnico:** Aplicativo mobile multiplataforma desenvolvido com **React Native** e **Expo CLI**.
* **Abordagem de Design:** *Mobile-first*, focado em acessibilidade, usabilidade simplificada e fluxos diretos.
* **Objetivo do Documento:** Servir como especificação técnica, de produto e de negócio para orientação do time de desenvolvimento e contexto para Agentes de Inteligência Artificial (IAs).

---

## 1. Visão Geral do Desafio
O projeto visa solucionar um gargalo social e econômico: a assimetria de informação e a complexidade burocrática que afastam os Microempreendedores Individuais (MEIs) dos processos de compras públicas e licitações no Brasil, amparados pelas diretrizes de incentivo da Lei nº 14.133/2021.

### 1.1 Definição do Problema Central
Os MEIs enfrentam barreiras severas para acessar o mercado de contratações públicas, sintetizadas em:
1. **Assimetria de Informação:** Dificuldade extrema para localizar e centralizar oportunidades e editais pertinentes ao seu nicho de atuação em portais governamentais fragmentados.
2. **Barreira Linguística e Burocrática:** Complexidade na interpretação dos requisitos jurídicos e técnicos descritos nos editais.
3. **Gestão Operacional Deficiente:** Falta de ferramentas acessíveis para organização de documentos habilitatórios, controle rigoroso de prazos e acompanhamento de fases recursais ou de lances.

### 1.2 Objetivo da Solução
Democratizar, simplificar e desmistificar a participação de MEIs em licitações públicas. A solução centraliza, traduz e gerencia o ciclo de vida de uma licitação através de uma interface mobile intuitiva, provendo ferramentas de engajamento como checklists automatizados, alertas de prazos e repositório inteligente de documentos.

---

## 2. Escopo do MVP (Minimum Viable Product) Mobile
O MVP deve contemplar os seguintes fluxos e jornadas de usuário estruturados de forma nativa e integrada:

### 🔐 Fluxo 1: Onboarding e Autenticação
* **Objetivo:** Introduzir a proposta de valor do aplicativo e realizar o login/cadastro do usuário de forma segura.
* **Componentes de Tela:** Telas de introdução (carrossel de benefícios), tela de login, cadastro de usuário e recuperação de senha.
* **Requisito Técnico:** Integração com serviços de autenticação do backend e persistência segura de tokens de sessão.

### 🔎 Fluxo 2: Lista e Busca de Editais (Descobrimento)
* **Objetivo:** Permitir a busca ativa e a filtragem de oportunidades abertas de forma otimizada para telas mobile.
* **Componentes de Tela:** Barra de pesquisa por palavras-chave, filtros avançados (por região/município, valor estimado, modalidade de licitação, categoria de atuação do MEI) e listagem em formato de cartões (*cards*) dinâmicos.

### 📋 Fluxo 3: Detalhe do Edital e Checklist de Habilitação
* **Objetivo:** Exibir de forma mastigada as informações do edital e criar um plano de ação para o MEI.
* **Componentes de Tela:** Tela de detalhes contendo resumo de objeto, cronograma, valor e elegibilidade. Integração com um sistema de checklist interativo (Itens Concluídos vs. Pendentes) correlacionado com as exigências da fase de habilitação.
