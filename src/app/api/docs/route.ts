import { NextResponse } from "next/server"

const spec = {
  openapi: "3.1.0",
  info: {
    title: "EcoMed API",
    version: "1.0.0",
    description:
      "API do EcoMed — plataforma de mapeamento de pontos de coleta de medicamentos no Brasil.",
    contact: { name: "EcoMed", url: "https://ecomed.eco.br" },
  },
  servers: [{ url: "https://ecomed.eco.br/api", description: "Produção" }],
  tags: [
    { name: "health", description: "Status da API" },
    { name: "pontos", description: "Pontos de coleta" },
    { name: "checkin", description: "Check-in presencial" },
    { name: "coins", description: "EcoCoins e carteira" },
    { name: "chat", description: "EcoBot com IA" },
    { name: "auth", description: "Autenticação" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["health"],
        summary: "Verificar status da API",
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
    "/pontos/proximos": {
      get: {
        tags: ["pontos"],
        summary: "Listar pontos de coleta próximos",
        parameters: [
          { name: "lat", in: "query", required: true, schema: { type: "number" }, description: "Latitude" },
          { name: "lng", in: "query", required: true, schema: { type: "number" }, description: "Longitude" },
          { name: "raio", in: "query", schema: { type: "number", default: 5000 }, description: "Raio em metros" },
        ],
        responses: {
          200: { description: "Lista de pontos ordenados por distância" },
          429: { description: "Rate limit excedido" },
        },
      },
    },
    "/pontos/{id}": {
      get: {
        tags: ["pontos"],
        summary: "Detalhes de um ponto de coleta",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Dados do ponto" },
          404: { description: "Ponto não encontrado" },
        },
      },
    },
    "/checkin": {
      post: {
        tags: ["checkin"],
        summary: "Registrar check-in em um ponto de coleta",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["pointId"],
                properties: {
                  pointId: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Check-in registrado, EcoCoins creditados" },
          401: { description: "Não autenticado" },
          429: { description: "Limite diário de check-ins atingido" },
        },
      },
    },
    "/coins/saldo": {
      get: {
        tags: ["coins"],
        summary: "Consultar saldo da carteira",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Saldo e nível do usuário" },
          401: { description: "Não autenticado" },
        },
      },
    },
    "/chat": {
      post: {
        tags: ["chat"],
        summary: "Enviar pergunta ao EcoBot",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["question"],
                properties: { question: { type: "string", minLength: 10 } },
              },
            },
          },
        },
        responses: {
          200: { description: "Resposta do EcoBot (SSE ou JSON)" },
          429: { description: "Rate limit excedido" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", description: "JWT de sessão NextAuth" },
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
