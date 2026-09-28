# Nexus-Lab Agent Showcase — Português

[Voltar para o README principal em inglês](README.md)

Projeto de portfólio focado em engenharia de agentes de IA local-first.

O repositório demonstra, de forma pequena e reproduzível:

- roteamento de intenção;
- tool calling;
- validação de argumentos;
- loop limitado a 3 rodadas;
- tracing de execução;
- I/O real dentro de sandbox;
- tratamento de timeout e retry;
- testes determinísticos;
- avaliação com 10 casos;
- providers para Ollama e API compatível com OpenAI;
- CI com GitHub Actions.

## Observatory — painel visual de controle

O repositório também inclui o **Nexus Observatory**, um front-end React que torna o runtime visível: roteamento de intenção, loop limitado de ferramentas, contratos validados, sandbox somente-leitura, traces de execução completos, avaliação de 10 casos e telemetria da sessão.

Ele é standalone. O mesmo runtime determinístico é reimplementado em JavaScript, permitindo executar um agente e inspecionar cada decisão sem Python, Ollama ou chave de API.

```bash
cd observatory
npm install
npm run dev
```

Documentação completa: [observatory/README.pt-BR.md](observatory/README.pt-BR.md).

## Execução rápida

```powershell
python -m pip install -r showcase/requirements.txt
python -m pytest showcase/tests -q
python showcase/evaluate.py
```

Teste com Ollama:

```powershell
$env:NEXUS_LAB_MODEL = "qwen3.5:9b"
python showcase/nexus_agent.py "Liste os arquivos do sandbox e leia project_notes.txt."
```

Avaliação live:

```powershell
python showcase/evaluate.py --live --provider ollama
```

A implementação principal está em [showcase/nexus_agent.py](showcase/nexus_agent.py).
