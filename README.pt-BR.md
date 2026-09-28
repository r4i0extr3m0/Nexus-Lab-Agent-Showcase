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
