# Nexus Observatory

[![CI](https://img.shields.io/badge/testes-31%20passando-4ade80?style=for-the-badge)](#testes)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**Um command deck em espaço profundo para observar, traçar e avaliar agentes de IA.**

O Nexus Observatory é a camada visual do runtime do
[Nexus-Lab Agent Showcase](https://github.com/r4i0extr3m0/Nexus-Lab-Agent-Showcase).
Ele transforma um runtime de agentes compacto em Python em algo que você consegue *ver*:
roteamento de intenção, loop de ferramentas limitado, contratos de ferramentas declarativos,
sandbox somente-leitura e trace de execução completo — tudo em uma única interface com identidade
visual própria.

Este app fica no diretório `observatory/` do repositório Nexus-Lab.

> Leia em [English](README.md).

---

## Por que este projeto existe

A maioria dos demos de agentes esconde a parte interessante dentro de um framework. Este projeto faz
o contrário: torna o fluxo de controle visível. O Observatory é um front-end de nível portfólio para
um runtime construído para expor *decisões de engenharia*, não mágica.

Ele é intencionalmente **standalone**. O runtime determinístico que move a interface é
reimplementado em JavaScript para que o avaliador abra o site, execute um agente e inspecione cada
decisão sem instalar Python, Ollama, GPU ou chave de API. O runtime em Python continua sendo a
fonte de verdade; o runtime no navegador o espelha passo a passo.

```
requisição do usuário
    │
    ▼
IntentRouter                         ← roteamento determinístico e inspecionável
    │
    ▼
NexusAgentRuntime
    ├── ToolRegistry + validação     ← fronteira de capacidades
    ├── loop de ferramentas (max 3)  ← orçamento explícito de execução
    └── ExecutionTrace               ← request id, rodadas, chamadas, latência, status
            │
            ▼
       ChatProvider
   (planner determinístico · Ollama · OpenAI-compatible)
```

---

## Painéis

| Painel | O que mostra |
|---|---|
| **Mission Control** | Compor uma requisição, executá-la e ler a resposta do agente com rota, confiança, rodadas e cadeia de ferramentas. |
| **Trace Timeline** | A execução completa como uma linha do tempo: scores do roteador, ferramentas planejadas, cada rodada, cada chamada validada com argumentos/resultados/duração, resposta final e o `ExecutionTrace` bruto. |
| **Tool Registry** | As cinco ferramentas registradas, seus schemas JSON e a validação de obrigatórios/desconhecidos/tipos aplicada antes do dispatch. |
| **Sandbox Explorer** | A fronteira de I/O somente-leitura. Navegue pelos arquivos do sandbox e teste path traversal ao vivo para ver a fronteira rejeitar escapes. |
| **Evaluation** | A suíte determinística de 10 casos, com acurácia de rota/ferramenta e execução opcional gerando traces reais. |
| **Telemetry** | Métricas da sessão: execuções, taxa de sucesso, latência média, uso de ferramentas e distribuição de rotas. |

---

## Identidade visual

O Observatory evita deliberadamente o visual morno e documental dos chats. Sua assinatura é um
**laboratório de espaço profundo**:

- fundo azul-marinho quase preto com nebulosas em violeta aurora e ciano;
- grade de blueprint sutil e starfield à deriva;
- painéis de instrumentação em vidro, com arestas finas e telemetria monoespaçada;
- gradiente de destaque que vai do ciano `pulse` ao violeta `aurora`;
- cores de sinal semânticas: verde (sucesso), âmbar (executando), vermelho (falha).

Os tokens de design ficam em `tailwind.config.js`. A marca está em `public/nexus-mark.svg`.

---

## Início rápido

```bash
# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```

Abra `http://localhost:5173`.

Nenhum arquivo `.env`, GPU, modelo ou chave de API é necessário.

---

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor Vite com HMR. |
| `npm run build` | Gera o build de produção em `dist/`. |
| `npm run preview` | Serve o build de produção localmente. |
| `npm test` | Executa a suíte Vitest (31 testes) sobre o runtime. |
| `npm run lint` | Lint do código com ESLint (zero warnings permitidos). |

---

## Testes

O runtime é coberto por uma suíte determinística em Vitest. Nenhum modelo é necessário.

```bash
npm test
```

A cobertura inclui:

- roteamento para intenções de testing, tools, project e core;
- validação do registry (ferramenta não registrada, argumentos ausentes/desconhecidos, tipos inválidos);
- o parser da calculadora, incluindo divisão por zero e operações não suportadas;
- rejeição de path traversal e leitura de arquivos do sandbox;
- o loop limitado, incluindo esgotamento de orçamento e falha de ferramenta;
- a suíte de avaliação de 10 casos.

```
Test Files  5 passed (5)
     Tests  31 passed (31)
```

---

## Estrutura do projeto

```
.
├── public/
│   └── nexus-mark.svg
├── src/
│   ├── components/          Painéis (layout, console, trace, tools, sandbox, eval, telemetry)
│   ├── config/nav.js        Navegação + metadados do app
│   ├── data/                Fixture do sandbox + casos de avaliação
│   ├── runtime/             Router, registry, tools, provider, trace, runtime, evaluation
│   ├── state/store.jsx      Estado da sessão persistido em localStorage
│   ├── lib/                 Helpers de formatação
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── tailwind.config.js
├── vite.config.js
└── vitest.config.js
```

O diretório `src/runtime/` é um espelho fiel em JavaScript do showcase Python
(`showcase/nexus_agent.py`): mesmas regras de roteamento, mesmos contratos de ferramentas, mesmo
loop limitado, mesmo formato de trace. Manter esse espelho explícito é o que torna a interface
confiável.

---

## Stack

- React 18 + Vite 5
- Tailwind CSS 3
- Ícones lucide-react
- Vitest para testes
- ESLint para lint

---

## Próximos passos

- modo ao vivo conectando ao runtime Python via um pequeno adaptador HTTP;
- traces em streaming para renderizar execuções longas progressivamente;
- exportação de traces (JSON) para compartilhar uma execução;
- novas ferramentas e casos de avaliação.

---

## Licença

MIT — veja [LICENSE](LICENSE).
