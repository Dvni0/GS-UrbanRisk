# UrbanRisk

**Plataforma Integrada de Inteligência e Monitoramento de Riscos Urbanos**

UrbanRisk é um projeto de Engenharia de Software desenvolvido para o trabalho **GS2 — Global Solution 2026.2 (CitizenTech)**. A aplicação concentra informações sobre alagamentos, ilhas de calor e falhas de energia, água e transporte em uma experiência geoespacial única.

Este repositório contém o protótipo web navegável da solução. Os dados apresentados são simulados e demonstram o fluxo definido no documento de requisitos; a aplicação ainda não possui integração com sensores, APIs públicas ou banco de dados em produção.

## Contexto e objetivo

Informações sobre riscos urbanos costumam estar fragmentadas entre órgãos públicos, sensores meteorológicos e redes sociais. Isso dificulta a priorização de ocorrências e pode atrasar a tomada de decisão de moradores, agentes da Defesa Civil e operadores de serviços essenciais.

O UrbanRisk foi planejado para combinar três tipos de evidência:

- sensores IoT, como pluviômetros e termohigrômetros;
- bases públicas oficiais, como Defesa Civil, CEMADEN e CGE;
- relatos comunitários geolocalizados.

A interface demonstra como a plataforma pode cruzar essas fontes, informar o nível de confiança de cada evento, classificar o risco e registrar a origem das decisões.

## Público-alvo

- **Moradores e trabalhadores urbanos:** acompanham riscos próximos, planejam deslocamentos e registram ocorrências.
- **Agentes da Defesa Civil e gestores municipais:** validam incidentes, priorizam respostas e monitoram áreas vulneráveis.
- **Operadores de concessionárias:** correlacionam eventos climáticos com falhas em energia, água e transporte.

## Personas contempladas

- **Mariana Costa:** moradora da Zona Leste de São Paulo que precisa de alertas confiáveis e pode reportar ocorrências de forma anônima.
- **Carlos Eduardo Mendes:** agente da Defesa Civil responsável por separar relatos válidos de duplicidades ou falsos positivos.
- **Fernanda Almeida:** engenheira de operações que monitora impactos em subestações, hospitais e corredores de transporte.

## Funcionalidades do protótipo

- Login demonstrativo com seleção de perfil e consentimento LGPD.
- Mapa geoespacial com marcadores classificados por nível de risco.
- Filtros por categoria, região e estado do evento.
- Lista priorizada de alertas e painel de indicadores.
- Detalhamento de ocorrências, áreas afetadas e ações preventivas.
- Linha do tempo do ciclo de vida do evento.
- Auditoria visual da origem e da confiança dos dados.
- Registro comunitário com localização aproximada e descrição.
- Central de notificações e preferências de região.
- Fila de triagem para confirmação ou descarte de relatos.
- Histórico de riscos e painel de direitos LGPD.
- Exportação demonstrativa de dados em JSON ou CSV.

## Telas implementadas

| Tela | Finalidade |
| --- | --- |
| Login e consentimento | Entrada, perfil e aceite de coleta mínima |
| Painel geoespacial | Mapa, filtros, KPIs e última sincronização |
| Lista de alertas | Priorização e filtros por categoria e estado |
| Detalhamento | Descrição, impacto, orientações e ciclo de vida |
| Origem e confiança | Fontes, pontuação e registro de auditoria |
| Registro comunitário | Categoria, mapa, descrição e foto |
| Central de notificações | Histórico e preferências por região |
| Triagem operacional | Aprovação ou descarte de eventos |
| Histórico e LGPD | Análises e exportação ou exclusão de dados |

## Estado atual da implementação

| Área | Situação atual |
| --- | --- |
| Interface Next.js | Implementada como protótipo navegável |
| Navegação entre telas | Implementada em estado local do React |
| Dados de alertas | Dados estáticos e simulados |
| Persistência | Não implementada |
| APIs externas e MQTT | Não implementados |
| Sensores IoT | Representados apenas na interface |
| Auditoria com SHA-256 | Demonstrativa; não gera hash criptográfico persistido |
| Consentimento LGPD | Interface demonstrativa; sem fluxo jurídico ou backend |
| Exportação de dados | Gera arquivos locais no navegador |

## Requisitos funcionais

O projeto adota os requisitos RF-01 a RF-11 do documento oficial:

1. Autenticação e consentimento LGPD.
2. Painel geoespacial em tempo real.
3. Ingestão e consolidação de dados multi-fonte.
4. Lista de alertas priorizada e filtrável.
5. Detalhamento do alerta e ações preventivas.
6. Rastreamento do ciclo de vida do evento.
7. Auditoria da origem e da confiança.
8. Registro comunitário geolocalizado.
9. Central de notificações e gatilhos.
10. Triagem operacional por agentes locais.
11. Análises históricas e direitos LGPD.

## Requisitos não funcionais

O desenho da solução está alinhado aos critérios de qualidade ISO/IEC 25010 definidos no briefing:

- atualização do painel em até 15 segundos;
- APIs com resposta P95 inferior a 500 ms;
- disponibilidade mínima de 99,5%;
- suporte planejado a 10.000 usuários simultâneos;
- processamento planejado de 2.500 eventos por minuto;
- interfaces em conformidade com WCAG 2.1 AA;
- comunicação por TLS 1.3 e dados sensíveis cifrados com AES-256;
- remoção automática de metadados EXIF de fotos;
- auditoria de transições e cálculos com hash SHA-256;
- interoperabilidade por JSON, GeoJSON, HTTPS REST e MQTT;
- degradação graciosa em caso de indisponibilidade de uma API externa.

## Cálculo de confiança

O índice de confiança varia de 0% a 100%.

| Origem | Confiança base |
| --- | --- |
| Base pública oficial | 90% |
| Sensor IoT calibrado | 85% |
| Relato comunitário único | 30% |

Relatos comunitários adicionais somam 15% cada, até o limite de 65% sem confirmação técnica. A convergência entre fontes heterogêneas adiciona 20%, até 100%. Aprovação humana credenciada fixa a confiança em 100%; descarte humano fixa em 0%.

- **Baixa:** 0% a menos de 50%.
- **Média:** 50% a menos de 80%.
- **Alta:** 80% a 100%.

## Cálculo e disparo de risco

O índice de priorização é calculado por:

```text
I_risco = S × M × (C / 100)
```

- `S` é a severidade física, de 1 a 4.
- `M` é 1,25 quando infraestrutura crítica está próxima em até 500 m; caso contrário, é 1,00.
- `C` é o índice de confiança em percentual.

As classificações são:

- **Baixo:** índice menor que 1,5.
- **Moderado:** índice de 1,5 a 2,49.
- **Alto:** índice de 2,5 a 3,99.
- **Crítico:** índice maior ou igual a 4,0.

Alertas automáticos são disparados somente quando a confiança é alta e o risco é alto ou crítico. Eventos com risco elevado e confiança média permanecem em validação até análise humana.

## Tecnologias

- [Next.js 16](https://nextjs.org/) com App Router
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [pnpm](https://pnpm.io/)

## Pré-requisitos

- Node.js 20 ou superior
- pnpm 10 ou superior

Caso o pnpm ainda não esteja instalado:

```bash
npm install -g pnpm
```

## Como executar localmente

Clone o repositório e acesse o diretório da aplicação:

```bash
git clone <URL_DO_REPOSITORIO>
cd urban-risk
```

Instale as dependências:

```bash
pnpm install
```

Inicie o servidor de desenvolvimento:

```bash
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

Para gerar e testar uma versão de produção:

```bash
pnpm build
pnpm start
```

## Scripts disponíveis

```bash
pnpm dev      # servidor de desenvolvimento
pnpm build    # build de produção
pnpm start    # servidor da build de produção
pnpm lint     # execução do ESLint
```

## Estrutura do projeto

```text
urban-risk/
├── app/
│   ├── layout.tsx       # Layout global e metadados
│   ├── page.tsx         # Telas e navegação do protótipo
│   └── globals.css      # Estilos globais
├── public/              # Arquivos estáticos
├── package.json         # Dependências e scripts
├── pnpm-lock.yaml       # Versões bloqueadas das dependências
└── README.md
```

## Fluxo principal de uso

1. O usuário aceita o consentimento e escolhe o perfil.
2. O painel apresenta eventos simulados e seus níveis de risco.
3. O usuário seleciona um alerta para consultar origem, confiança e localização.
4. Moradores podem enviar relatos geolocalizados.
5. Agentes locais podem conferir ou descartar eventos em validação.
6. Eventos confirmados são registrados no histórico e podem gerar notificação.
7. O usuário consulta seus dados e controla consentimento ou exclusão.

## Privacidade e segurança

No protótipo, não existem dados pessoais reais, armazenamento em servidor ou integrações externas. A interface demonstra os controles exigidos pelo planejamento LGPD:

- escolha explícita de perfil;
- consentimento granular;
- minimização de dados;
- anonimização de relatos;
- remoção de metadados EXIF em uma implementação real;
- exportação e exclusão de dados;
- registro de origem e auditoria.

Para uso em produção, os dados devem ser tratados por serviços seguros com TLS 1.3, criptografia AES-256, políticas de retenção, controle de acesso, registro imutável de auditoria e revisão técnica da conformidade com a LGPD.

## Desenvolvimento para GitHub

Antes de enviar o projeto:

```bash
pnpm lint
pnpm build
```

Não faça commit de credenciais, chaves de API, dados pessoais reais ou arquivos gerados localmente. A pasta `.next/` e dependências devem permanecer fora do versionamento conforme o `.gitignore` do projeto.

## Limitações conhecidas

- Não há backend, autenticação real ou banco de dados.
- Os indicadores e eventos são estáticos.
- Não há geolocalização real nem integração com mapas.
- Não há envio real de notificações push ou SMS.
- Os hashes, logs de auditoria e exportações são demonstrações da interface.
- Os requisitos de escalabilidade e disponibilidade dependem de uma arquitetura futura.

## Referência do projeto

Os requisitos foram derivados de **Documentação de Requisitos — UrbanRisk**, elaborado para a disciplina Engenharia de Software — Global Solution 2026.2 (CitizenTech).
