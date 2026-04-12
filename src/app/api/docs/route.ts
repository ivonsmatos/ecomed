import { NextResponse } from "next/server"

const spec = {
  openapi: "3.1.0",
  info: {
    title: "EcoMed API",
    version: "2.0.0",
    description:
      "API do EcoMed — plataforma de mapeamento de pontos de coleta de medicamentos no Brasil. Construída com Hono sobre Next.js App Router.",
    contact: { name: "EcoMed", url: "https://ecomed.eco.br" },
    license: { name: "MIT" },
  },
  servers: [
    { url: "https://ecomed.eco.br/api", description: "Produção" },
    { url: "http://localhost:3010/api", description: "Desenvolvimento local" },
  ],
  tags: [
    { name: "health", description: "Status da API" },
    { name: "pontos", description: "Pontos de coleta aprovados" },
    { name: "checkin", description: "Check-in presencial via QR Code" },
    { name: "qr", description: "Geração de QR Code do cidadão" },
    { name: "coins", description: "EcoCoins — carteira e transações" },
    { name: "chat", description: "EcoBot — IA com RAG sobre descarte de medicamentos" },
    { name: "quiz", description: "Quizzes educativos com recompensas" },
    { name: "missions", description: "Missões diárias e semanais" },
    { name: "rewards", description: "Catálogo de recompensas resgatáveis" },
    { name: "favoritos", description: "Pontos favoritados pelo usuário" },
    { name: "reportes", description: "Reportar problemas em pontos de coleta" },
    { name: "push", description: "Notificações push (Web Push / VAPID)" },
    { name: "notificacoes", description: "Central de notificações do usuário" },
    { name: "onboarding", description: "Fluxo de boas-vindas e crédito inicial" },
    { name: "parceiro", description: "Gestão de parceiros e pontos de coleta" },
    { name: "auth", description: "Autenticação (NextAuth.js)" },
  ],
  paths: {
    // ── HEALTH ─────────────────────────────────────────────────────
    "/health": {
      get: {
        tags: ["health"],
        summary: "Verificar status da API",
        operationId: "getHealth",
        responses: {
          200: {
            description: "API operacional",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    service: { type: "string", example: "ecomed-app" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── PONTOS ─────────────────────────────────────────────────────
    "/pontos/proximos": {
      get: {
        tags: ["pontos"],
        summary: "Listar pontos de coleta próximos",
        operationId: "getPontosProximos",
        parameters: [
          { name: "lat", in: "query", required: true, schema: { type: "number", minimum: -90, maximum: 90 }, description: "Latitude" },
          { name: "lng", in: "query", required: true, schema: { type: "number", minimum: -180, maximum: 180 }, description: "Longitude" },
          { name: "raio", in: "query", schema: { type: "number", default: 5000, minimum: 500, maximum: 50000 }, description: "Raio de busca em metros (padrão: 5000)" },
        ],
        responses: {
          200: {
            description: "Lista de até 30 pontos aprovados ordenados por distância",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      address: { type: "string" },
                      city: { type: "string" },
                      state: { type: "string" },
                      latitude: { type: "number" },
                      longitude: { type: "number" },
                      phone: { type: "string", nullable: true },
                      photoUrl: { type: "string", nullable: true },
                      residueTypes: { type: "array", items: { type: "string" } },
                      distancia_metros: { type: "number" },
                    },
                  },
                },
              },
            },
          },
          429: { description: "Rate limit excedido" },
        },
      },
    },
    "/pontos/{id}": {
      get: {
        tags: ["pontos"],
        summary: "Detalhes de um ponto de coleta",
        operationId: "getPontoById",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "ID (CUID) do ponto" }],
        responses: {
          200: { description: "Dados completos do ponto incluindo horários" },
          404: { description: "Ponto não encontrado ou não aprovado" },
        },
      },
    },

    // ── QR CODE ────────────────────────────────────────────────────
    "/qr/meu-codigo": {
      get: {
        tags: ["qr"],
        summary: "Gerar token QR do cidadão",
        operationId: "getQrMeuCodigo",
        description: "Retorna um token HMAC assinado com validade para ser exibido como QR Code. O parceiro escaneia este token no check-in.",
        security: [{ sessionCookie: [] }],
        responses: {
          200: {
            description: "Token gerado com sucesso",
            content: {
              "application/json": {
                schema: { type: "object", properties: { token: { type: "string" } } },
              },
            },
          },
          401: { description: "Não autenticado" },
        },
      },
    },

    // ── CHECK-IN ───────────────────────────────────────────────────
    "/checkin": {
      post: {
        tags: ["checkin"],
        summary: "Registrar check-in presencial (parceiro escaneia QR do cidadão)",
        operationId: "postCheckin",
        description: "Apenas usuários com role PARTNER ou ADMIN. Valida token HMAC, verifica ownership do ponto, aplica anti-abuso (1 check-in/usuário/ponto/dia) e credita EcoCoins ao cidadão.",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "pointId"],
                properties: {
                  token: { type: "string", minLength: 10, description: "Token HMAC do QR Code do cidadão" },
                  pointId: { type: "string", description: "CUID do ponto de coleta" },
                  hasGps: { type: "boolean", default: false, description: "Se o dispositivo confirmou presença via GPS" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Check-in registrado com sucesso, EcoCoins creditados ao cidadão" },
          400: { description: "Token inválido ou expirado" },
          401: { description: "Não autenticado" },
          403: { description: "Usuário não é parceiro ou admin" },
          404: { description: "Ponto não encontrado ou sem permissão" },
          409: { description: "Usuário já realizou check-in neste ponto hoje (DUPLICATE_CHECKIN)" },
          429: { description: "Rate limit excedido" },
        },
      },
    },

    // ── COINS ──────────────────────────────────────────────────────
    "/coins": {
      get: {
        tags: ["coins"],
        summary: "Consultar carteira — saldo, nível, streak e histórico",
        operationId: "getCoins",
        security: [{ sessionCookie: [] }],
        responses: {
          200: {
            description: "Dados da carteira do usuário",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    balance: { type: "number" },
                    totalEarned: { type: "number" },
                    level: { type: "string", enum: ["SEMENTE", "BROTO", "ARVORE", "GUARDIAO", "LENDA_ECO"] },
                    streakCurrent: { type: "number" },
                    streakBest: { type: "number" },
                    weeklyCoins: { type: "number" },
                    lastActivityAt: { type: "string", format: "date-time", nullable: true },
                    transactions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          amount: { type: "number" },
                          event: { type: "string" },
                          note: { type: "string", nullable: true },
                          createdAt: { type: "string", format: "date-time" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Não autenticado" },
        },
      },
    },
    "/coins/article-read": {
      post: {
        tags: ["coins"],
        summary: "Registrar leitura de artigo e creditar EcoCoin",
        operationId: "postCoinsArticleRead",
        description: "Credita 3 EcoCoins por artigo lido. Requer mínimo de 120 segundos de leitura e 90% de scroll. Respeita limite diário.",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["articleSlug", "secondsRead", "scrollPct"],
                properties: {
                  articleSlug: { type: "string" },
                  secondsRead: { type: "number", minimum: 120, description: "Tempo de leitura em segundos (mínimo 120)" },
                  scrollPct: { type: "number", minimum: 90, description: "Porcentagem de scroll (mínimo 90)" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Coins creditados ou limite diário atingido",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean" },
                    reason: { type: "string", enum: ["limite_diario"], nullable: true },
                    newBalance: { type: "number" },
                  },
                },
              },
            },
          },
          401: { description: "Não autenticado" },
          422: { description: "Tempo de leitura ou scroll insuficiente" },
          429: { description: "Rate limit excedido" },
        },
      },
    },

    // ── CHAT (EcoBot) ──────────────────────────────────────────────
    "/chat": {
      post: {
        tags: ["chat"],
        summary: "Enviar pergunta ao EcoBot",
        operationId: "postChat",
        description: "Proxy para o microserviço de IA (FastAPI + RAG + Groq). Inclui rate limiting por IP. Credita 1 EcoCoin por pergunta (limite diário). Retorna `messageId` para feedback posterior.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["pergunta"],
                properties: { pergunta: { type: "string", minLength: 3, maxLength: 1000 } },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Resposta do EcoBot",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    resposta: { type: "string" },
                    messageId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          429: { description: "Rate limit excedido" },
          502: { description: "Erro de conexão com o microserviço de IA" },
          503: { description: "Serviço de IA não configurado" },
          504: { description: "Timeout — EcoBot demorou acima de 55s" },
        },
      },
    },
    "/chat/feedback": {
      post: {
        tags: ["chat"],
        summary: "Avaliar resposta do EcoBot (👍/👎)",
        operationId: "postChatFeedback",
        description: "Registra avaliação positiva ou negativa de uma resposta. Credita 1 EcoCoin por avaliação (apenas usuários autenticados). Impede avaliação duplicada do mesmo messageId.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["messageId", "pergunta", "resposta", "rating"],
                properties: {
                  messageId: { type: "string", maxLength: 36 },
                  pergunta: { type: "string", maxLength: 1000 },
                  resposta: { type: "string", maxLength: 5000 },
                  rating: { type: "string", enum: ["positive", "negative"] },
                  comment: { type: "string", maxLength: 500 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Feedback registrado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean" },
                    reason: { type: "string", enum: ["ja_avaliado"], nullable: true },
                  },
                },
              },
            },
          },
          429: { description: "Rate limit excedido" },
        },
      },
    },

    // ── QUIZ ───────────────────────────────────────────────────────
    "/quiz": {
      get: {
        tags: ["quiz"],
        summary: "Listar quizzes ativos com status da tentativa do usuário",
        operationId: "getQuizzes",
        security: [{ sessionCookie: [] }],
        responses: {
          200: { description: "Lista de quizzes com tentativas do usuário" },
          401: { description: "Não autenticado" },
        },
      },
    },
    "/quiz/{id}": {
      get: {
        tags: ["quiz"],
        summary: "Detalhes de um quiz com perguntas (sem revelar respostas)",
        operationId: "getQuizById",
        security: [{ sessionCookie: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Quiz com lista de perguntas e opções" },
          401: { description: "Não autenticado" },
          404: { description: "Quiz não encontrado ou inativo" },
        },
      },
    },
    "/quiz/{id}/submit": {
      post: {
        tags: ["quiz"],
        summary: "Submeter respostas do quiz e receber resultado",
        operationId: "postQuizSubmit",
        description: "Calcula pontuação, credita EcoCoins (5 por aprovação, 10 por quiz perfeito), salva tentativa. Respeita limite diário de coins.",
        security: [{ sessionCookie: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["answers"],
                properties: {
                  answers: { type: "array", items: { type: "integer", minimum: 0 }, description: "Índice da opção escolhida para cada pergunta" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Resultado do quiz",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    score: { type: "number" },
                    total: { type: "number" },
                    perfect: { type: "boolean" },
                    coinsEarned: { type: "number" },
                    limiteDiario: { type: "boolean" },
                    correctAnswers: { type: "array", items: { type: "number" } },
                    newBalance: { type: "number" },
                    levelUp: { type: "string", nullable: true },
                  },
                },
              },
            },
          },
          401: { description: "Não autenticado" },
          404: { description: "Quiz não encontrado" },
          429: { description: "Rate limit excedido" },
        },
      },
    },

    // ── MISSIONS ───────────────────────────────────────────────────
    "/missions": {
      get: {
        tags: ["missions"],
        summary: "Missões diárias e semanais do usuário",
        operationId: "getMissions",
        description: "Retorna 3 missões diárias (sorteadas automaticamente se não existirem) e missões semanais com progresso atual.",
        security: [{ sessionCookie: [] }],
        responses: {
          200: { description: "Missões diárias e semanais com progresso" },
          401: { description: "Não autenticado" },
        },
      },
    },
    "/missions/{id}/progress": {
      post: {
        tags: ["missions"],
        summary: "Registrar progresso em uma missão",
        operationId: "postMissionsProgress",
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "cuid" },
            description: "ID da missão do usuário",
          },
        ],
        responses: {
          200: { description: "Progresso atualizado, coins creditados se missão completada" },
          401: { description: "Não autenticado" },
        },
      },
    },

    // ── REWARDS ────────────────────────────────────────────────────
    "/rewards": {
      get: {
        tags: ["rewards"],
        summary: "Catálogo de recompensas disponíveis",
        operationId: "getRewards",
        description: "Retorna recompensas ativas com indicação de elegibilidade (saldo, nível, cooldown, estoque).",
        security: [{ sessionCookie: [] }],
        responses: {
          200: {
            description: "Catálogo com saldo e nível do usuário",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    balance: { type: "number" },
                    level: { type: "string" },
                    rewards: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
          401: { description: "Não autenticado" },
        },
      },
    },
    "/rewards/my": {
      get: {
        tags: ["rewards"],
        summary: "Histórico de resgates do usuário",
        operationId: "getMyRewards",
        security: [{ sessionCookie: [] }],
        responses: {
          200: { description: "Lista de resgates em ordem decrescente" },
          401: { description: "Não autenticado" },
        },
      },
    },
    "/rewards/{id}/redeem": {
      post: {
        tags: ["rewards"],
        summary: "Resgatar uma recompensa",
        operationId: "postRewardRedeem",
        description: "Debita EcoCoins, verifica nível mínimo, estoque e cooldown. Cria registro de resgate com status PENDING.",
        security: [{ sessionCookie: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "CUID da recompensa" }],
        responses: {
          200: { description: "Resgate realizado com sucesso" },
          402: { description: "Saldo insuficiente" },
          403: { description: "Nível mínimo não atingido" },
          404: { description: "Recompensa não encontrada ou inativa" },
          409: { description: "Estoque esgotado ou em cooldown" },
          401: { description: "Não autenticado" },
        },
      },
    },

    // ── FAVORITOS ──────────────────────────────────────────────────
    "/favoritos": {
      get: {
        tags: ["favoritos"],
        summary: "Listar pontos favoritados",
        operationId: "getFavoritos",
        security: [{ sessionCookie: [] }],
        responses: {
          200: { description: "Lista de pontos favoritados em ordem de criação" },
          401: { description: "Não autenticado" },
        },
      },
      post: {
        tags: ["favoritos"],
        summary: "Adicionar ponto aos favoritos",
        operationId: "postFavoritos",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["pontoId"], properties: { pontoId: { type: "string" } } },
            },
          },
        },
        responses: {
          201: { description: "Ponto adicionado aos favoritos (idempotente)" },
          401: { description: "Não autenticado" },
          404: { description: "Ponto não encontrado ou não aprovado" },
        },
      },
      delete: {
        tags: ["favoritos"],
        summary: "Remover ponto dos favoritos",
        operationId: "deleteFavoritos",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["pontoId"], properties: { pontoId: { type: "string" } } },
            },
          },
        },
        responses: {
          200: { description: "Favorito removido com sucesso" },
          401: { description: "Não autenticado" },
        },
      },
    },

    // ── REPORTES ───────────────────────────────────────────────────
    "/reportes": {
      post: {
        tags: ["reportes"],
        summary: "Reportar problema em ponto de coleta",
        operationId: "postReportes",
        description: "Cria reporte anônimo ou autenticado. Tipos: CLOSED, WRONG_ADDRESS, NOT_ACCEPTING, OTHER.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["pontoId", "tipo"],
                properties: {
                  pontoId: { type: "string" },
                  tipo: { type: "string", enum: ["CLOSED", "WRONG_ADDRESS", "NOT_ACCEPTING", "OTHER"] },
                  descricao: { type: "string", maxLength: 500 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Reporte criado com sucesso" },
          404: { description: "Ponto não encontrado" },
          429: { description: "Rate limit excedido" },
        },
      },
    },

    // ── PUSH NOTIFICATIONS ─────────────────────────────────────────
    "/push/subscribe": {
      post: {
        tags: ["push"],
        summary: "Registrar subscription de push notification",
        operationId: "postPushSubscribe",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["endpoint", "keys"],
                properties: {
                  endpoint: { type: "string", format: "uri" },
                  keys: {
                    type: "object",
                    properties: { p256dh: { type: "string" }, auth: { type: "string" } },
                  },
                  expirationTime: { type: "number", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Subscription salva (upsert por endpoint)" },
          401: { description: "Não autenticado" },
        },
      },
    },
    "/push/unsubscribe": {
      delete: {
        tags: ["push"],
        summary: "Cancelar subscription de push notification",
        operationId: "deletePushUnsubscribe",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["endpoint"], properties: { endpoint: { type: "string", format: "uri" } } },
            },
          },
        },
        responses: {
          200: { description: "Subscription removida" },
          401: { description: "Não autenticado" },
        },
      },
    },

    // ── NOTIFICAÇÕES ───────────────────────────────────────────────
    "/notificacoes": {
      get: {
        tags: ["notificacoes"],
        summary: "Listar notificações do usuário (últimas 50)",
        operationId: "getNotificacoes",
        security: [{ sessionCookie: [] }],
        responses: {
          200: { description: "Lista de notificações em ordem decrescente" },
          401: { description: "Não autenticado" },
        },
      },
    },
    "/notificacoes/{id}/ler": {
      post: {
        tags: ["notificacoes"],
        summary: "Marcar notificação como lida",
        operationId: "postNotificacaoLer",
        security: [{ sessionCookie: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Notificação marcada como lida" },
          401: { description: "Não autenticado" },
          404: { description: "Notificação não encontrada" },
        },
      },
    },
    "/notificacoes/ler-todas": {
      post: {
        tags: ["notificacoes"],
        summary: "Marcar todas as notificações como lidas",
        operationId: "postNotificacoesLerTodas",
        security: [{ sessionCookie: [] }],
        responses: {
          200: { description: "Todas as notificações marcadas como lidas" },
          401: { description: "Não autenticado" },
        },
      },
    },

    // ── ONBOARDING ─────────────────────────────────────────────────
    "/onboarding/concluir": {
      post: {
        tags: ["onboarding"],
        summary: "Concluir onboarding e receber EcoCoins de boas-vindas",
        operationId: "postOnboardingConcluir",
        description: "Credita SIGNUP (+20 coins) e ONBOARDING_SCREENS (+10 coins) se ainda não creditados. Operação idempotente.",
        security: [{ sessionCookie: [] }],
        responses: {
          200: { description: "Onboarding concluído", content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" } } } } } },
          401: { description: "Não autenticado" },
        },
      },
    },

    // ── PARCEIRO ───────────────────────────────────────────────────
    "/parceiro/cadastro": {
      post: {
        tags: ["parceiro"],
        summary: "Solicitar cadastro como parceiro",
        operationId: "postParceiroCadastro",
        description: "Cria solicitação de parceria com status PENDING. Envia e-mail de confirmação. Requer CNPJ único.",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["cnpj", "companyName"],
                properties: {
                  cnpj: { type: "string" },
                  companyName: { type: "string" },
                  tradeName: { type: "string" },
                  phone: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Solicitação criada" },
          401: { description: "Não autenticado" },
          409: { description: "Parceiro já cadastrado ou CNPJ duplicado" },
          429: { description: "Rate limit excedido" },
        },
      },
    },
    "/parceiro/pontos": {
      get: {
        tags: ["parceiro"],
        summary: "Listar pontos de coleta do parceiro autenticado",
        operationId: "getParceirosPontos",
        security: [{ sessionCookie: [] }],
        responses: {
          200: { description: "Lista de pontos do parceiro" },
          401: { description: "Não autenticado" },
          403: { description: "Usuário não é parceiro aprovado" },
        },
      },
      post: {
        tags: ["parceiro"],
        summary: "Cadastrar novo ponto de coleta",
        operationId: "postParceiroPonto",
        security: [{ sessionCookie: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: {
          201: { description: "Ponto criado com status PENDING" },
          401: { description: "Não autenticado" },
          403: { description: "Usuário não é parceiro aprovado" },
        },
      },
    },
    "/parceiro/pontos/{id}": {
      patch: {
        tags: ["parceiro"],
        summary: "Atualizar ponto de coleta do parceiro",
        operationId: "patchParceiroPonto",
        security: [{ sessionCookie: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: {
          200: { description: "Ponto atualizado" },
          401: { description: "Não autenticado" },
          403: { description: "Sem permissão para editar este ponto" },
          404: { description: "Ponto não encontrado" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "authjs.session-token",
        description: "Cookie de sessão gerenciado pelo NextAuth.js (Auth.js v5). Obtido após login via /auth/signin.",
      },
    },
  },
}

// GET /api/docs — Scalar UI (CDN)
export async function GET() {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>EcoMed API Docs</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
  <script id="api-reference" type="application/json">
    ${JSON.stringify(spec, null, 2)}
  </script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
