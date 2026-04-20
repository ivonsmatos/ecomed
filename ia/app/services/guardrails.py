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


class ViolacaoCategoria(Enum):
    EMERGENCIA = auto()
    CLINICA = auto()
    AUTOMEDICACAO = auto()
    DADOS_PESSOAIS = auto()
    PROMPT_INJECTION = auto()
    FORA_ESCOPO = auto()


@dataclass
class GuardrailResult:
    bloqueada: bool
    categoria: ViolacaoCategoria | None = None
    resposta: str | None = None


# ── Padrões de entrada ────────────────────────────────────────────────────────

_EMERGENCIA = re.compile(
    r"\b(ingeri|tomei|bebi|engoli|meu filho tomou|criança tomou|acidentalmente tomei"
    r"|superdos|superdosagem|overdose|envenenamento|intoxicado|intoxicação"
    r"|remédio demais|tomei muito)\b",
    re.IGNORECASE | re.UNICODE,
)

_CLINICA = re.compile(
    r"\b(dose|dosagem|posologia|quantos comprimidos|quantas cápsulas|quantos ml"
    r"|de quantas em quantas horas|por quantos dias tomar"
    r"|diagnóstico|diagnosticar|diagnostico|sintoma|sintomas de|estou sentindo"
    r"|tratamento para|tratar|cura[r]?|prescrição|prescrever|receita médica"
    r"|exame|exames de sangue)\b",
    re.IGNORECASE | re.UNICODE,
)

_AUTOMEDICACAO = re.compile(
    r"\b(qual remédio|que remédio|qual medicamento|que medicamento"
    r"|me indica|me indique|me recomend[ae]|pode recomendar"
    r"|bula d[eo]|efeito colateral|interação medicamentosa|interação com"
    r"|misturar com|posso tomar|devo tomar|devo usar|posso usar"
    r"|comprar (remédio|medicamento|antibiótico|analgésico))\b",
    re.IGNORECASE | re.UNICODE,
)

_DADOS_PESSOAIS = re.compile(
    r"\b(cpf|rg|carteira de identidade|meu endereço|minha (rua|avenida|cidade)"
    r"|número do (passaporte|título de eleitor)|dados pessoais|informações pessoais"
    r"|dados? (de )?terceiros|dados? (de )?outra pessoa)\b",
    re.IGNORECASE | re.UNICODE,
)

_INJECTION = re.compile(
    r"(ignore (as )?(instruções|regras|restrições|sistema)"
    r"|esqueça (as )?(instruções|regras|restrições|tudo)"
    r"|novo prompt|new prompt|system prompt"
    r"|você agora é|you are now|act as|atue como|DAN "
    r"|jailbreak|sem restrições|without restrictions"
    r"|finja que|pretend that|role[ -]?play)",
    re.IGNORECASE,
)

# ── Respostas por categoria ───────────────────────────────────────────────────

RESPOSTA_EMERGENCIA = (
    "🚨 **Situação de emergência — ligue agora:**\n\n"
    "- **SAMU:** 192\n"
    "- **Centro de Informações Toxicológicas:** 0800 722 6001\n"
    "- **CVV (Crise emocional):** 188\n\n"
    "Posso ajudar com informações sobre descarte correto de medicamentos, "
    "mas para emergências médicas procure atendimento imediatamente."
)

RESPOSTA_CLINICA = (
    "Não posso fornecer informações sobre dosagem, diagnóstico ou tratamento médico "
    "— isso é responsabilidade de um profissional de saúde habilitado.\n\n"
    "Sou especializado em **descarte correto de medicamentos**.\n"
    "Posso ajudar com:\n"
    "- Onde descartar medicamentos vencidos ou sem uso\n"
    "- Impacto ambiental do descarte incorreto\n"
    "- Legislação sobre resíduos de saúde\n\n"
    "Para dúvidas médicas, consulte um **farmacêutico ou médico**."
)

RESPOSTA_AUTOMEDICACAO = (
    "Não posso recomendar, indicar ou orientar o uso de medicamentos "
    "— isso envolve riscos à saúde e deve ser feito por um profissional.\n\n"
    "Posso ajudar com o **descarte seguro** de medicamentos que você já não usa. "
    "Procure um farmacêutico ou médico para orientações de tratamento."
)

RESPOSTA_DADOS_PESSOAIS = (
    "Não solicito nem processo dados pessoais como CPF, RG ou informações de terceiros.\n\n"
    "Se precisar localizar um ponto de coleta de medicamentos próximo a você, "
    "use o mapa disponível em **ecomed.eco.br** — não é necessário informar dados pessoais."
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


def verificar_guardrails(pergunta: str) -> GuardrailResult:
    """
    Verifica se a pergunta deve ser bloqueada antes de acionar o LLM.

    Ordem de prioridade (da mais crítica para menos):
      1. Emergência  (risco de vida — resposta imediata com CIT/SAMU)
      2. Injection   (segurança do sistema)
      3. Clínica     (dosagem, diagnóstico, sintomas)
      4. Automedicação
      5. Dados pessoais

    Retorna GuardrailResult(bloqueada=False) se a pergunta for permitida.
    """
    p = pergunta.strip()

    if _EMERGENCIA.search(p):
        return GuardrailResult(True, ViolacaoCategoria.EMERGENCIA, RESPOSTA_EMERGENCIA)

    if _INJECTION.search(p):
        return GuardrailResult(True, ViolacaoCategoria.PROMPT_INJECTION, RESPOSTA_INJECTION)

    if _CLINICA.search(p):
        return GuardrailResult(True, ViolacaoCategoria.CLINICA, RESPOSTA_CLINICA)

    if _AUTOMEDICACAO.search(p):
        return GuardrailResult(True, ViolacaoCategoria.AUTOMEDICACAO, RESPOSTA_AUTOMEDICACAO)

    if _DADOS_PESSOAIS.search(p):
        return GuardrailResult(True, ViolacaoCategoria.DADOS_PESSOAIS, RESPOSTA_DADOS_PESSOAIS)

    return GuardrailResult(bloqueada=False)


# ── Filtro de saída ───────────────────────────────────────────────────────────

# Nomes de marcas comerciais — serão substituídos por aviso genérico
_MARCAS = re.compile(
    r"\b(tylenol|paracetamol|dipirona|ibuprofeno|rivotril|ritalina|gardenal"
    r"|voltaren|cataflan|nimesulida|omeprazol|pantoprazol|losartana|sinvastatina"
    r"|metformina|amoxicilina|azitromicina|ciprofloxacino|dorflex|buscopan"
    r"|maalox|engov|benegrip|coristina|neosaldina|sempre livre|vick|fluimucil"
    r"|acetilcisteína)\b",
    re.IGNORECASE,
)

# Detecção de dosagem na saída
_DOSAGEM_SAIDA = re.compile(
    r"\b(\d+\s*(mg|mcg|µg|ml|g|comprimidos?|cápsulas?|gotas?)\b"
    r"|de \d+ em \d+ horas|por \d+ dias|dose (diária|máxima|recomendada))\b",
    re.IGNORECASE,
)

# Detecção de conselho médico explícito na saída
_CONSELHO_MEDICO_SAIDA = re.compile(
    r"\b(você (deve|pode|deveria) tomar|é recomendável (usar|tomar|ingerir)"
    r"|recomendo que (tome|use|ingira)|tome \d+ comprimido"
    r"|aplicar \d+ (vez|vezes) ao dia)\b",
    re.IGNORECASE,
)

DISCLAIMER_SAUDE = (
    "\n\n⚠️ *O EcoBot é um assistente educativo e não substitui "
    "orientação médica ou farmacêutica.*"
)

_AVISO_MARCA = " [nome do medicamento omitido — consulte um farmacêutico para orientações específicas]"


@dataclass
class FiltroSaidaResult:
    resposta_final: str
    modificada: bool
    motivo: str | None = None


def filtrar_saida(resposta: str) -> FiltroSaidaResult:
    """
    Camada de Filtro de Saída.

    Analisa a resposta gerada pelo LLM e:
    1. Bloqueia respostas com conselho médico explícito, substituindo por fallback
    2. Insere disclaimer quando detecta menção a dosagem ou área de saúde
    3. Remove nomes de marcas comerciais quando contexto é de uso (não descarte)

    Retorna sempre uma resposta segura.
    """
    motivos: list[str] = []

    # Prioridade 1 — conselho médico explícito na saída → fallback completo
    if _CONSELHO_MEDICO_SAIDA.search(resposta):
        return FiltroSaidaResult(
            resposta_final=(
                "Para orientações sobre uso de medicamentos, consulte um farmacêutico ou médico. "
                "Posso ajudar com o descarte correto de medicamentos! 🌿"
            ),
            modificada=True,
            motivo="conselho_medico_implicito",
        )

    # Prioridade 2 — dosagem detectada → adicionar disclaimer
    if _DOSAGEM_SAIDA.search(resposta):
        resposta = resposta + DISCLAIMER_SAUDE
        motivos.append("dosagem_detectada")

    # Prioridade 3 — marcas comerciais → substituir por aviso
    if _MARCAS.search(resposta):
        resposta = _MARCAS.sub(_AVISO_MARCA, resposta)
        motivos.append("marca_comercial")

    return FiltroSaidaResult(
        resposta_final=resposta,
        modificada=bool(motivos),
        motivo=",".join(motivos) if motivos else None,
    )
