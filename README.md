<div align="center">

# 🌿 EcoMed

**Descarte certo, planeta saudável**

PWA educativo com mapa inteligente, IA e gamificação para o descarte correto de medicamentos no Brasil.

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3E8C8C.svg)](https://supabase.com)
[![Ollama](https://img.shields.io/badge/IA-Ollama%20%2B%20Llama%203-1A736A.svg)](https://ollama.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Acessar o EcoMed](https://ecomed.eco.br) · [Reportar Bug](https://github.com/ivonsmatos/ecomed/issues/new?template=bug_report.md) · [Sugerir Feature](https://github.com/ivonsmatos/ecomed/issues/new?template=feature_request.md)

</div>

---

## 📋 Sobre o Projeto

**91% dos brasileiros** descartam medicamentos de forma incorreta. **30 mil toneladas/ano** vão para o lixo comum ou esgoto. **1 comprimido** pode contaminar até **450 mil litros de água**. Existem **7.500+ pontos de coleta** em farmácias (LogMed), mas quase ninguém sabe que eles existem.

O EcoMed resolve isso com 3 funcionalidades:

| Funcionalidade | Descrição |
|---|---|
| 🗺️ **Mapa Inteligente** | Encontre farmácias próximas que aceitam medicamentos. Filtre por tipo, veja horário e abra a rota. |
| 🤖 **EcoBot (Chat com IA)** | Tire dúvidas sobre descarte 24h. IA local (Ollama + Llama 3), sem envio de dados a terceiros. |
| 🪙 **EcoCoins (Gamificação)** | Ganhe EcoCoins por cada ação: descarte, quiz, leitura, indicação. Suba de nível e troque por recompensas. |

> **Projeto acadêmico interdisciplinar** coordenado pelo Prof. Ivon Matos — 70 alunos, 3 turmas, 12 grupos.

---

## 🚀 Funcionalidades

- ✅ **PWA** — funciona no navegador, instala na tela, funciona offline (sem download na loja)
- ✅ **Mapa de pontos de coleta** — 7.500+ pontos LogMed com filtro, popup e rota (OpenStreetMap)
- ✅ **Chat com IA educativa** — Ollama + Llama 3 local, guardrails de 4 camadas, LGPD compliant
- ✅ **Sistema de EcoCoins** — ledger imutável, 5 níveis (🌱→⭐), missões diárias, streaks, anti-fraude
- ✅ **Quizzes educativos** — perguntas reais com score server-side e EcoCoins
- ✅ **Artigos educativos** — base de conhecimento curada com SEO (pilar/cluster)
- ✅ **Indicações** — código pessoal ECOMED-XXXXX, +20 EcoCoins por amigo
- ✅ **Ranking semanal** — top 10 por EcoCoins ganhos na semana
- ✅ **Certificado Eco-Cidadão** — PDF com QR Code de verificação
- ✅ **Dashboard de impacto** — litros protegidos, descartes, pessoas educadas

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Uso |
|---|---|---|
| **Frontend** | Next.js 15 (App Router) | PWA, SSR, routing, API Routes |
| **Estilização** | Tailwind CSS v4 + shadcn/ui | Design system, componentes acessíveis |
| **Banco de Dados** | Supabase (PostgreSQL + Auth + pgvector) | CRUD, autenticação, busca semântica RAG |
| **IA** | Ollama + Llama 3 (via FastAPI) | Chat educativo local, sem API paga |
| **CDN / WAF** | Cloudflare | DNS, SSL, cache, proteção DDoS |
| **Mapa** | OpenStreetMap + Leaflet | Tiles gratuitos, cache offline |
| **Cache** | Upstash Redis | Rate limiting, cache de sessões |
| **CMS** | Sanity | Blog e artigos educativos |
| **Deploy** | Cloudflare Pages | Frontend (alternativa: Vercel) |
| **Monitoramento** | UptimeRobot | Uptime + alertas |
| **Pacotes** | pnpm | Gerenciador de pacotes |

**Custo operacional do MVP: ~R$ 4/mês** (free tiers).

---

## 📁 Estrutura do Projeto

```
ecomed/
├── app/                    # Next.js App Router
│   ├── (app)/              # Rotas autenticadas
│   │   ├── chat/           # Chat com EcoBot
│   │   ├── mapa/           # Mapa de pontos de coleta
│   │   ├── educacao/       # Artigos e quizzes
│   │   ├── perfil/         # Perfil + EcoCoins + impacto
│   │   ├── ranking/        # Ranking semanal
│   │   ├── recompensas/    # Catálogo de resgates
│   │   └── quiz/           # Quizzes educativos
│   ├── (auth)/             # Login, cadastro, recuperar senha
│   ├── (public)/           # Páginas públicas (sobre, parceiros)
│   ├── api/                # API Routes (coins, quiz, ranking)
│   ├── layout.tsx          # Layout global + metadata
│   ├── sitemap.ts          # Sitemap automático
│   └── robots.ts           # Robots.txt
├── components/             # Componentes React
│   ├── coins/              # EcoCoins: toast, display, progress
│   ├── chat/               # Interface do EcoBot
│   ├── map/                # Mapa + markers
│   └── ui/                 # shadcn/ui components
├── lib/                    # Lógica de negócio
│   ├── coins/              # creditCoins, checkLimits, streak
│   ├── supabase/           # Client + server Supabase
│   └── utils/              # Helpers
├── ia/                     # Microserviço de IA (FastAPI + Ollama)
│   ├── main.py             # API FastAPI
│   ├── prompts/            # System prompts versionados
│   └── Dockerfile          # Container da IA
├── supabase/               # Migrações e seeds
│   ├── migrations/         # SQL de criação de tabelas
│   └── seed.sql            # Dados iniciais (pontos, quizzes)
├── ecomed-knowledge/       # Base de conhecimento RAG
│   ├── articles/           # Artigos educativos (.md)
│   ├── faq/                # Perguntas frequentes (.md)
│   ├── data/               # Estatísticas e dados (.md)
│   └── legislation/        # Legislação resumida (.md)
├── docs/                   # Documentação do projeto (30 documentos)
├── public/                 # Assets estáticos (logos, favicons)
├── .github/                # GitHub Actions, templates, Dependabot
├── .env.example            # Variáveis de ambiente (sem valores)
├── CONTRIBUTING.md         # Guia de contribuição
├── CHANGELOG.md            # Histórico de versões
├── CODE_OF_CONDUCT.md      # Código de conduta
├── SECURITY.md             # Política de segurança
├── LICENSE                 # MIT License
└── README.md               # Este arquivo
```

---

## ⚡ Início Rápido

### Pré-requisitos

- [Node.js](https://nodejs.org) 20+
- [pnpm](https://pnpm.io) 9+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Ollama](https://ollama.com) (para IA local)
- [Docker](https://docker.com) (opcional, para IA via container)

### 1. Clone o repositório

```bash
git clone https://github.com/ivonsmatos/ecomed.git
cd ecomed
```

### 2. Instale as dependências

```bash
pnpm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Ollama (IA local)
OLLAMA_BASE_URL=http://localhost:11434

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configure o banco de dados

```bash
# Iniciar Supabase local (opcional)
supabase start

# Aplicar migrações
supabase db push

# Inserir seed data (pontos de coleta + quizzes)
supabase db seed
```

### 5. Inicie o Ollama (IA)

```bash
# Instalar modelo
ollama pull llama3

# Verificar que está rodando
curl http://localhost:11434/api/generate -d '{"model":"llama3","prompt":"Olá"}'
```

### 6. Inicie o servidor de desenvolvimento

```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000) 🎉

---

## 🧪 Testes

```bash
# Rodar todos os testes
pnpm test

# Testes com coverage
pnpm test:coverage

# Lint
pnpm lint

# Type check
pnpm type-check
```

---

## 📦 Deploy

### Cloudflare Pages (recomendado)

```bash
pnpm build
# Deploy via Cloudflare Pages dashboard ou Wrangler CLI
```

### Vercel (alternativa)

```bash
# Conectar repo no dashboard Vercel
# Deploy automático a cada push para main
```

### Docker (IA microserviço)

```bash
cd ia/
docker build -t ecomed-ia .
docker run -p 8000:8000 ecomed-ia
```

---

## 🪙 Sistema de EcoCoins

| Ação | EcoCoins | Limite |
|---|---|---|
| Criar conta | +20 | Única vez |
| Completar perfil | +10 | Única vez |
| Registrar descarte (com GPS) | +15 | 3/dia |
| Registrar descarte (sem GPS) | +10 | 3/dia |
| Completar quiz (100%) | +10 | 3/dia |
| Completar quiz (<100%) | +5 | 3/dia |
| Ler artigo completo | +2 | 5/dia |
| Perguntar ao EcoBot | +1 | 10/dia |
| Indicar amigo | +20 | 5/mês |
| Streak 7 dias | +15 | 1/semana |
| Streak 30 dias | +50 | 1/mês |
| **Teto diário** | **120** | — |

### Níveis

| Nível | EcoCoins | Ícone |
|---|---|---|
| Semente | 0–100 | 🌱 |
| Broto | 101–500 | 🌿 |
| Árvore | 501–2.000 | 🌳 |
| Guardião | 2.001–5.000 | 🌍 |
| Lenda Eco | 5.001+ | ⭐ |

---

## 🌍 Impacto

O EcoMed está alinhado com **6 Objetivos de Desenvolvimento Sustentável** da ONU:

| ODS | Contribuição |
|---|---|
| **3** Saúde | Reduz contaminação por fármacos → menos doenças |
| **4** Educação | Artigos + quizzes + IA educativa |
| **6** Água | 1 descarte = 450.000L protegidos |
| **9** Inovação | IA local + open source + 70 alunos |
| **12** Consumo | Logística reversa de medicamentos |
| **17** Parcerias | Farmácias + escolas + governo + ONGs |

---

## 📖 Documentação

Toda a documentação do projeto está na pasta `/docs` e inclui:

| Documento | Descrição |
|---|---|
| Identidade Organizacional | Missão, visão, valores, tom de voz |
| Modelo de Negócio | Canvas, custos, receitas, SWOT |
| Análise Estratégica | Mercado, benchmark, impacto ambiental |
| Gamificação EcoCoin | Regras, níveis, missões, anti-fraude |
| Documentos Legais | LGPD, Termos de Uso, Cookies, Disclaimer |
| Pitch Deck | 12 slides para apresentações |
| Personas e Jornada | 4 personas + jornada 6 estágios |
| Brand Guide | Cores, tipografia, logos, componentes |
| Marketing e Growth | Flywheel, redes sociais, calendário |
| Dashboard KPI | Painel React interativo |
| Estratégia SEO | Keywords, schema markup, Next.js code |
| Governança de IA | Guardrails, auditoria, feedback loop |
| Análise Financeira | TCO, comparativo stacks, financiamento |
| Onboarding e Retenção | Fluxo, e-mails, A/B testing |
| Impacto Social | Theory of Change, ODS, fórmulas |
| Parcerias | Prospecção, CRM, pitch, modelos |
| Go-to-Market | Checklist lançamento, OKRs, contingência |
| Continuidade | Handoff, governança OSS, Squad |

---

## 👥 Equipe

| Turma | Foco | Grupos |
|---|---|---|
| **3TA** | Farmácia e Negócios | Pesquisa, Conteúdo, Negócio, Marketing |
| **3TB** | IA e Ética | Ollama, RAG, Guardrails, Prompts |
| **3TC** | Frontend | Setup, Chat, Mapa, Telas |

**Coordenação:** Prof. Ivon Matos — Escola Técnica Estadual

---

## 🤝 Como Contribuir

Contribuições são bem-vindas! Leia o [Guia de Contribuição](CONTRIBUTING.md) para começar.

1. Faça fork do projeto
2. Crie sua branch (`git checkout -b feat/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adicionar nova feature'`)
4. Push para a branch (`git push origin feat/nova-feature`)
5. Abra um Pull Request

---

## 📄 Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE) para mais informações.

---

## 📬 Contato

- **Site:** [ecomed.eco.br](https://ecomed.eco.br)
- **E-mail:** contato@ecomed.eco.br
- **Parcerias:** parcerias@ecomed.eco.br
- **Instagram:** [@ecomed.eco.br](https://instagram.com/ecomed.eco.br)
- **GitHub:** [github.com/ivonsmatos/ecomed](https://github.com/ivonsmatos/ecomed)

---

<div align="center">

**Feito com 🌿 por 70 alunos que acreditam que tecnologia pode salvar o planeta.**

</div>
