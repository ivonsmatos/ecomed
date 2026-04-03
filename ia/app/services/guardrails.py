"""
Guardrails do assistente EcoMed.

Responsabilidades:
  1. Bloquear perguntas fora do escopo (dosagem, automedicação, dados pessoais)
  2. Detectar emergências e encaminhar para serviços adequados (SAMU/CVV)
  3. Detectar tentativas de prompt injection
  4. Retornar respostas específicas por categoria de violação

A verificação ocorre ANTES de acionar o LLM, sem custo de tokens.
"""

import re
from dataclasses import dataclass
from enum import Enum, auto


# ---------------------------------------------------------------------------
# Categorias de violação
# ---------------------------------------------------------------------------


class ViolacaoCategoria(Enum):
    EMERGENCIA = auto()  # ingestão acidental, superdosagem, envenenamento
    CLINICA = auto()  # dosagem, posologia, diagnóstico, tratamento
    AUTOMEDICACAO = auto()  # recomendar remédio, bula, interação
    DADOS_PESSOAIS = auto()  # CPF, RG, endereço, telefone de terceiros
    PROMPT_INJECTION = auto()  # tentativas de contornar o sistema
    FORA_ESCOPO = auto()  # qualquer outro tema não relacionado ao EcoMed


@dataclass
class GuardrailResult:
    bloqueada: bool
    categoria: ViolacaoCategoria | None
    resposta: str | None  # None = prosseguir com o RAG normalmente


# ---------------------------------------------------------------------------
# Padrões (compilados uma vez — desempenho)
# ---------------------------------------------------------------------------

# Emergência: ingestão acidental / superdosagem / envenenamento
_EMERGENCIA = re.compile(
    r"\b("
    r"ingeri|tomei|bebi|engoli|meu filho tomou|criança tomou|acidentalmente tomei"
    r"|superdos|superdosagem|overdose|envenenamento|intoxicado|intoxicação"
    r"|remédio demais|tomei muito"
    r")\b",
    re.IGNORECASE | re.UNICODE,
)

# Perguntas clínicas: dosagem, posologia, diagnóstico, tratamento
_CLINICA = re.compile(
    r"\b("
    r"dose|dosagem|posologia|quantos comprimidos|quantas cápsulas|quantos ml"
    r"|de quantas em quantas horas|por quantos dias tomar"
    r"|diagnóstico|diagnosticar|diagnostico"
    r"|sintoma|sintomas de|estou sentindo"
    r"|tratamento para|tratar|cura[r]?"
    r"|prescrição|prescrever|receita médica"
    r"|exame|exames de sangue"
    r")\b",
    re.IGNORECASE | re.UNICODE,
)

# Automedicação: recomendar remédio, bula, interação
_AUTOMEDICACAO = re.compile(
    r"\b("
    r"qual remédio|que remédio|qual medicamento|que medicamento"
    r"|me indica|me indique|me recomend[ae]|pode recomendar"
    r"|bula d[eo]|bula do|efeito colateral"
    r"|interação medicamentosa|interação com|misturar com"
    r"|posso tomar|devo tomar|devo usar|posso usar"
    r"|comprar (remédio|medicamento|antibiótico|analgésico)"
    r")\b",
    re.IGNORECASE | re.UNICODE,
)

# Dados pessoais: pedidos de CPF, RG, endereço ou dados de terceiros
_DADOS_PESSOAIS = re.compile(
    r"\b("
    r"cpf|rg|carteira de identidade"
    r"|meu endereço|minha (rua|avenida|cidade)"
    r"|número do (passaporte|título de eleitor)"
    r"|dados pessoais|informações pessoais"
    r"|dados? (de )?terceiros|dados? (de )?outra pessoa"
    r")\b",
    re.IGNORECASE | re.UNICODE,
)

# Prompt injection
_INJECTION = re.compile(
    r"("
    r"ignore (as )?(instruções|regras|restrições|sistema)"
    r"|esqueça (as )?(instruções|regras|restrições|tudo)"
    r"|novo prompt|new prompt|system prompt"
    r"|você agora é|you are now|act as|atue como"
    r"|DAN |jailbreak|sem restrições|without restrictions"
    r"|finja que|pretend that|role[ -]?play"
    r")",
    re.IGNORECASE | re.UNICODE,
)


# ---------------------------------------------------------------------------
# Respostas prontas por categoria
# ---------------------------------------------------------------------------

RESPOSTA_EMERGENCIA = (
    "🚨 **Situação de emergência — ligue agora:**\n\n"
    "- **SAMU:** 192\n"
    "- **Centro de Informações Toxicológicas:** 0800 722 6001\n"
    "- **CVV (Crise emocional):** 188\n\n"
    "Posso ajudar com informações sobre descarte correto de medicamentos, "
    "mas para emergências médicas procure atendimento imediatamente."
)

RESPOSTA_CLINICA = (
    "Não posso fornecer informações sobre dosagem, diagnóstico ou tratamento médico — "
    "isso é responsabilidade de um profissional de saúde habilitado.\n\n"
    "Sou especializado em **descarte correto de medicamentos**.\n"
    "Posso ajudar com:\n"
    "- Onde descartar medicamentos vencidos ou sem uso\n"
    "- Impacto ambiental do descarte incorreto\n"
    "- Legislação sobre resíduos de saúde\n\n"
    "Para dúvidas médicas, consulte um **farmacêutico ou médico**."
)

RESPOSTA_AUTOMEDICACAO = (
    "Não posso recomendar, indicar ou orientar o uso de medicamentos — "
    "isso envolve riscos à saúde e deve ser feito por um profissional.\n\n"
    "Posso ajudar com o **descarte seguro** de medicamentos que você já não usa. "
    "Procure um farmacêutico ou médico para orientações de tratamento."
)

RESPOSTA_DADOS_PESSOAIS = (
    "Não solicito nem processo dados pessoais como CPF, RG ou informações de terceiros.\n\n"
    "Se precisar localizar um ponto de coleta de medicamentos próximo a você, "
    "use o mapa disponível em **ecomed.eco.br/mapa** — não é necessário informar dados pessoais."
)

RESPOSTA_INJECTION = (
    "Só posso responder perguntas sobre descarte correto de medicamentos no Brasil. 🌿\n"
    "Como posso ajudar com isso?"
)

RESPOSTA_FORA_ESCOPO = (
    "Meu escopo é o descarte correto de medicamentos no Brasil. 🌿\n\n"
    "Posso ajudar com:\n"
    "- Onde descartar medicamentos vencidos ou sem uso\n"
    "- Tipos de resíduos aceitos em pontos de coleta\n"
    "- Legislação ambiental sobre resíduos farmacêuticos\n\n"
    "Tem alguma dúvida sobre descarte de medicamentos?"
)


# ---------------------------------------------------------------------------
# Função principal
# ---------------------------------------------------------------------------


def verificar_guardrails(pergunta: str) -> GuardrailResult:
    """
    Verifica se a pergunta deve ser bloqueada antes de acionar o LLM.

    Ordem de prioridade (da mais crítica para menos):
      1. Emergência  (risco de vida — resposta imediata com CIT/SAMU)
      2. Injection   (segurança do sistema)
      3. Clínica     (dosagem, diagnóstico, sintomas)
      4. Automedicação
      5. Dados pessoais
      6. Fora do escopo geral

    Retorna GuardrailResult(bloqueada=False) se a pergunta for permitida.
    """
    texto = pergunta.strip()

    if _EMERGENCIA.search(texto):
        return GuardrailResult(
            bloqueada=True,
            categoria=ViolacaoCategoria.EMERGENCIA,
            resposta=RESPOSTA_EMERGENCIA,
        )

    if _INJECTION.search(texto):
        return GuardrailResult(
            bloqueada=True,
            categoria=ViolacaoCategoria.PROMPT_INJECTION,
            resposta=RESPOSTA_INJECTION,
        )

    if _CLINICA.search(texto):
        return GuardrailResult(
            bloqueada=True,
            categoria=ViolacaoCategoria.CLINICA,
            resposta=RESPOSTA_CLINICA,
        )

    if _AUTOMEDICACAO.search(texto):
        return GuardrailResult(
            bloqueada=True,
            categoria=ViolacaoCategoria.AUTOMEDICACAO,
            resposta=RESPOSTA_AUTOMEDICACAO,
        )

    if _DADOS_PESSOAIS.search(texto):
        return GuardrailResult(
            bloqueada=True,
            categoria=ViolacaoCategoria.DADOS_PESSOAIS,
            resposta=RESPOSTA_DADOS_PESSOAIS,
        )

    return GuardrailResult(bloqueada=False, categoria=None, resposta=None)
