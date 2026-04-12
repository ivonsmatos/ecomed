# PROMPT DE IMPLEMENTAÇÃO: Sistema de Gamificação EcoCoin — EcoMed

> **Instrução para a IA:** Este prompt descreve TUDO que precisa ser implementado para o sistema de gamificação do EcoMed funcionar. Implemente cada seção na ordem apresentada. O projeto usa **Next.js 15 (App Router) + Supabase (PostgreSQL + Auth) + TypeScript + Tailwind CSS + shadcn/ui**.

---

## CONTEXTO DO PROJETO

O EcoMed é um PWA educativo sobre descarte correto de medicamentos no Brasil. O sistema de gamificação usa uma moeda virtual chamada **EcoCoin**. Os usuários ganham EcoCoins realizando ações educativas e ambientais, sobem de nível, completam missões e resgatam recompensas.

**Stack:** Next.js 15 (App Router), TypeScript, Supabase (PostgreSQL + Auth + Realtime), Tailwind CSS, shadcn/ui.

**Princípios:**
- EcoCoins NÃO têm valor monetário real (são pontos virtuais)
- Gastar EcoCoins em recompensas NÃO reduz o nível (nível é baseado em `lifetime_earned`)
- Todas as transações são registradas em um ledger imutável (nunca deletar, estornos são transações negativas)
- Anti-fraude é nativo: limites diários, cooldowns, validação de ações

---

## PARTE 1: BANCO DE DADOS (Supabase/PostgreSQL)

Crie as seguintes tabelas com migrations do Supabase. Todas devem ter Row Level Security (RLS) habilitado.

### Tabela: `user_wallet`
Cada usuário tem uma carteira. Criada automaticamente no cadastro via trigger.

```sql
CREATE TABLE user_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0,
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_spent INTEGER NOT NULL DEFAULT 0,
  level TEXT NOT NULL DEFAULT 'semente',
  streak_current INTEGER NOT NULL DEFAULT 0,
  streak_best INTEGER NOT NULL DEFAULT 0,
  streak_last_action_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: usuário só vê/edita sua própria wallet
ALTER TABLE user_wallet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet" ON user_wallet FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON user_wallet FOR UPDATE USING (auth.uid() = user_id);
```

### Tabela: `coin_transaction` (Ledger Imutável)
Registro de cada movimentação de EcoCoins. NUNCA deletar ou alterar registros.

```sql
CREATE TYPE transaction_type AS ENUM ('EARN', 'SPEND', 'ADJUSTMENT');

CREATE TABLE coin_transaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- positivo para EARN, negativo para SPEND/ADJUSTMENT
  type transaction_type NOT NULL,
  action TEXT NOT NULL, -- ex: 'article_read', 'quiz_complete', 'disposal', 'referral', 'streak_bonus', 'reward_redeem'
  description TEXT, -- ex: 'Leu artigo: Como descartar medicamentos'
  metadata JSONB DEFAULT '{}', -- dados extras (article_id, quiz_id, reward_id, etc.)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE coin_transaction ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON coin_transaction FOR SELECT USING (auth.uid() = user_id);
-- INSERT apenas via server-side (service_role key) para prevenir fraude
```

### Tabela: `daily_limit_tracker`
Controla limites diários por categoria de ação.

```sql
CREATE TABLE daily_limit_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  action TEXT NOT NULL, -- 'article_read', 'quiz_complete', 'chat_question', 'chat_rating', 'share_article', 'share_achievement', 'disposal'
  count INTEGER NOT NULL DEFAULT 0,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  last_action_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date, action)
);

ALTER TABLE daily_limit_tracker ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own limits" ON daily_limit_tracker FOR SELECT USING (auth.uid() = user_id);
```

### Tabela: `reward_catalog`
Catálogo de recompensas disponíveis para resgate.

```sql
CREATE TABLE reward_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  cost INTEGER NOT NULL, -- custo em EcoCoins
  min_level TEXT NOT NULL DEFAULT 'semente', -- nível mínimo para resgatar
  category TEXT NOT NULL DEFAULT 'digital', -- 'digital', 'physical', 'partner'
  cooldown_days INTEGER NOT NULL DEFAULT 0, -- dias entre resgates do mesmo item
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed data (inserir as 7 recompensas do MVP)
INSERT INTO reward_catalog (name, description, cost, min_level, cooldown_days, category) VALUES
  ('Badge personalizado', 'Ícone exclusivo no perfil por 30 dias', 30, 'semente', 30, 'digital'),
  ('Tema visual exclusivo', 'Tema de cores alternativo na interface', 50, 'semente', 0, 'digital'),
  ('Certificado Eco-Cidadão', 'PDF com nome, data e impacto acumulado', 100, 'broto', 90, 'digital'),
  ('Destaque no ranking', 'Nome com moldura especial no ranking semanal', 80, 'broto', 7, 'digital'),
  ('Selo verificado', 'Badge permanente de usuário verificado', 200, 'arvore', 0, 'digital'),
  ('Certificado Premium com QR', 'Certificado com validação online via QR Code', 300, 'arvore', 90, 'digital'),
  ('Nome no Hall da Fama', 'Presença permanente na página de honra', 500, 'guardiao', 0, 'digital');
```

### Tabela: `user_reward`
Histórico de resgates.

```sql
CREATE TYPE reward_status AS ENUM ('PENDING', 'DELIVERED', 'CANCELLED');

CREATE TABLE user_reward (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reward_id UUID REFERENCES reward_catalog(id) NOT NULL,
  status reward_status NOT NULL DEFAULT 'DELIVERED',
  redeemed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_reward ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own rewards" ON user_reward FOR SELECT USING (auth.uid() = user_id);
```

### Tabela: `daily_mission`
Missões diárias atribuídas ao usuário (3 por dia).

```sql
CREATE TABLE daily_mission (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mission_type TEXT NOT NULL, -- 'read_article', 'ask_chatbot_3', 'complete_quiz', 'register_disposal', 'share_content', 'explore_point', 'rate_chatbot_3', 'early_bird'
  mission_label TEXT NOT NULL, -- texto amigável: 'Leitor do dia', 'Quiz relâmpago', etc.
  bonus_coins INTEGER NOT NULL DEFAULT 3,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, date, mission_type)
);

ALTER TABLE daily_mission ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own missions" ON daily_mission FOR SELECT USING (auth.uid() = user_id);
```

### Tabela: `user_badge`
Badges conquistados pelo usuário.

```sql
CREATE TABLE user_badge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_type TEXT NOT NULL, -- 'level_broto', 'level_arvore', 'streak_7', 'streak_30', 'first_disposal', etc.
  badge_label TEXT NOT NULL,
  badge_icon TEXT, -- emoji ou URL do ícone
  earned_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ, -- NULL = permanente
  UNIQUE(user_id, badge_type)
);

ALTER TABLE user_badge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own badges" ON user_badge FOR SELECT USING (auth.uid() = user_id);
```

### Tabela: `quiz`
Quizzes educativos com perguntas e respostas.

```sql
CREATE TABLE quiz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'descarte', 'legislacao', 'impacto', 'tipos_medicamento'
  difficulty TEXT NOT NULL DEFAULT 'facil', -- 'facil', 'medio', 'dificil'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE quiz_question (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quiz(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- ["opção A", "opção B", "opção C", "opção D"]
  correct_index INTEGER NOT NULL, -- 0, 1, 2 ou 3
  explanation TEXT, -- explicação da resposta correta
  order_num INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE quiz_attempt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quiz_id UUID REFERENCES quiz(id) NOT NULL,
  score INTEGER NOT NULL, -- porcentagem 0-100
  answers JSONB NOT NULL, -- [{"question_id": "...", "selected": 2, "correct": true}, ...]
  coins_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE quiz_attempt ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own attempts" ON quiz_attempt FOR SELECT USING (auth.uid() = user_id);
```

### Tabela: `article_read`
Rastreia leitura de artigos (para dar EcoCoins).

```sql
CREATE TABLE article_read (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  article_slug TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ, -- NULL = não finalizou
  scroll_percentage INTEGER DEFAULT 0, -- 0-100
  time_spent_seconds INTEGER DEFAULT 0,
  coins_earned INTEGER DEFAULT 0,
  UNIQUE(user_id, article_slug)
);

ALTER TABLE article_read ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reads" ON article_read FOR SELECT USING (auth.uid() = user_id);
```

### Tabela: `referral`
Sistema de indicação.

```sql
CREATE TABLE referral (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  referral_code TEXT NOT NULL,
  coins_earned INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE referral ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own referrals" ON referral FOR SELECT USING (auth.uid() = referrer_id);
```

### Trigger: Criar wallet automaticamente no cadastro

```sql
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_wallet (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_wallet();
```

### Função: Calcular nível baseado em lifetime_earned

```sql
CREATE OR REPLACE FUNCTION calculate_level(total_coins INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF total_coins >= 5001 THEN RETURN 'lenda';
  ELSIF total_coins >= 2001 THEN RETURN 'guardiao';
  ELSIF total_coins >= 501 THEN RETURN 'arvore';
  ELSIF total_coins >= 101 THEN RETURN 'broto';
  ELSE RETURN 'semente';
  END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## PARTE 2: API DE CRÉDITO DE ECOCOINS (Server Actions / Route Handlers)

Crie um módulo central `lib/coins/credit-coins.ts` que valida e credita EcoCoins. TODA ação que gera coins passa por essa função.

### Regras de negócio OBRIGATÓRIAS:

```typescript
// lib/coins/config.ts

export const COIN_RULES = {
  // Ações de onboarding (única vez)
  onboarding: {
    create_account: { coins: 20, once: true },
    complete_profile: { coins: 10, once: true },
    complete_onboarding: { coins: 5, once: true },
    enable_geolocation: { coins: 5, once: true },
    enable_push: { coins: 5, once: true },
  },

  // Ações de descarte
  disposal: {
    simple: { coins: 10, dailyLimit: 3 },
    with_gps: { coins: 15, dailyLimit: 3 },
    first_of_month: { coins: 5, monthlyLimit: 1 },
    new_point: { coins: 5, unlimited: true },
  },

  // Ações educativas
  education: {
    article_read: { coins: 2, dailyLimit: 5, minTimeSeconds: 120, minScrollPercent: 90 },
    quiz_any: { coins: 5, dailyLimit: 3 },
    quiz_perfect: { coins: 10, dailyLimit: 3 }, // substitui quiz_any se 100%
    chat_question: { coins: 1, dailyLimit: 10, minChars: 10 },
    chat_rating: { coins: 1, dailyLimit: 10 },
  },

  // Ações sociais
  social: {
    referral: { coins: 20, monthlyLimit: 5 },
    share_article: { coins: 3, dailyLimit: 2 },
    share_achievement: { coins: 2, dailyLimit: 1 },
  },

  // Streaks
  streak: {
    daily_action: { coins: 1, dailyLimit: 1 },
    streak_3: { coins: 5, weeklyLimit: 1 },
    streak_7: { coins: 15, weeklyLimit: 1 },
    streak_30: { coins: 50, monthlyLimit: 1 },
  },

  // Limites globais
  global: {
    dailyCap: 120, // teto de coins por dia
    cooldownSeconds: 60, // entre ações do mesmo tipo
  },

  // Níveis
  levels: {
    semente: { min: 0, max: 100, icon: '🌱', color: '#C7D93D', multiplier: 1.0 },
    broto: { min: 101, max: 500, icon: '🌿', color: '#24A645', multiplier: 1.0 },
    arvore: { min: 501, max: 2000, icon: '🌳', color: '#3E8C8C', multiplier: 1.0 },
    guardiao: { min: 2001, max: 5000, icon: '🌍', color: '#1A736A', multiplier: 1.2 },
    lenda: { min: 5001, max: Infinity, icon: '⭐', color: '#D4A017', multiplier: 1.5 },
  },
} as const;
```

### Função central de crédito:

```typescript
// lib/coins/credit-coins.ts
// Esta função é a ÚNICA forma de creditar EcoCoins. Ela:
// 1. Verifica se o usuário não ultrapassou o teto diário (120 coins)
// 2. Verifica se o limite por ação não foi atingido
// 3. Verifica cooldown (60s entre ações do mesmo tipo)
// 4. Aplica multiplicador de nível (Guardião: 1.2x, Lenda: 1.5x)
// 5. Registra a transação no ledger (coin_transaction)
// 6. Atualiza o saldo e lifetime_earned na wallet
// 7. Recalcula o nível
// 8. Atualiza o streak
// 9. Verifica se alguma missão diária foi completada
// 10. Retorna { success, coinsEarned, newBalance, newLevel, missionsCompleted[], badgesEarned[] }

// Implementar como Server Action do Next.js ("use server") ou Route Handler
// NUNCA expor essa lógica no client-side — toda validação é server-side
```

---

## PARTE 3: TRIGGERS DE GANHO DE ECOCOINS

### 3.1 Leitura de Artigo (+2 EcoCoins)

**Condição:** scroll ≥ 90% + tempo na página ≥ 2 minutos.

**Frontend (componente de artigo):**
- Ao abrir artigo, registrar `started_at` no state
- Listener de scroll que calcula `scrollPercentage` = (scrollTop + viewportHeight) / totalHeight * 100
- Quando `scrollPercentage >= 90` E `timeSpent >= 120 segundos`, chamar Server Action `creditArticleRead(articleSlug)`
- Mostrar toast animado "+2 EcoCoins 🪙" ao confirmar
- Limite: 5 artigos/dia. Se já atingiu, não mostrar indicador de coins no artigo

**Server Action `creditArticleRead`:**
1. Verificar se artigo já foi lido por esse usuário (tabela `article_read`)
2. Verificar limite diário (5/dia) via `daily_limit_tracker`
3. Se válido: inserir em `article_read`, chamar `creditCoins('article_read', 2, { article_slug })`
4. Verificar missão diária "Leitor do dia"

### 3.2 Quiz Educativo (+5 ou +10 EcoCoins)

**Quizzes devem ser criados e armazenados na tabela `quiz` + `quiz_question`.** Cada quiz tem 5-10 perguntas de múltipla escolha com 4 alternativas.

**Conteúdo dos quizzes (criar pelo menos 5 para o MVP):**
1. "Descarte Básico" — como descartar diferentes tipos de medicamentos
2. "Mitos e Verdades" — desmistificar crenças sobre descarte
3. "Legislação" — Decreto 10.388, PNRS, LogMed
4. "Impacto Ambiental" — efeitos da contaminação farmacêutica
5. "Tipos de Medicamentos" — sólidos, líquidos, controlados, perfurocortantes

**Frontend (página /app/quiz):**
- Listar quizzes disponíveis com cards (título, categoria, dificuldade, coins possíveis)
- Tela de quiz: uma pergunta por vez, 4 botões de resposta, barra de progresso
- Ao selecionar resposta: feedback visual imediato (verde/vermelho) + explicação
- Ao finalizar: tela de resultado com score, coins ganhos, botão de compartilhar
- Animação de "+X EcoCoins" na conclusão

**Server Action `submitQuizAttempt`:**
1. Receber quiz_id + array de respostas do usuário
2. Calcular score server-side (NUNCA confiar no score enviado pelo client)
3. Verificar limite diário (3/dia) via `daily_limit_tracker`
4. Se score == 100%: creditar 10 coins (substitui os 5 base)
5. Se score < 100%: creditar 5 coins
6. Registrar em `quiz_attempt`
7. Chamar `creditCoins('quiz_complete', coins, { quiz_id, score })`
8. Verificar missão "Quiz relâmpago"

### 3.3 Registrar Descarte (+10 a +15 EcoCoins)

**Frontend (página /app/mapa ou botão "Registrar Descarte"):**
- Botão "Registrei um descarte" no mapa, próximo ao popup do ponto de coleta
- Se geolocalização ativa: verificar se usuário está a ≤ 200m do ponto (usar Haversine formula)
  - Se sim: descarte com GPS = +15 coins
  - Se não: descarte simples = +10 coins (sem validação GPS)
- Se geolocalização desativada: descarte simples = +10 coins
- Limite: 3 descartes/dia
- Bônus: +5 se for o primeiro descarte do mês (verificar via query)
- Bônus: +5 se for um ponto nunca visitado antes pelo usuário (verificar via query)

**Server Action `registerDisposal`:**
1. Receber point_id, coordenadas do usuário (opcionais)
2. Se coordenadas fornecidas: calcular distância Haversine até o ponto
3. Verificar limite diário (3/dia)
4. Calcular coins: base (10 ou 15) + bônus primeiro do mês + bônus ponto inédito
5. Chamar `creditCoins('disposal', totalCoins, { point_id, with_gps, bonuses })`
6. Verificar missão "Eco-descarte"

### 3.4 Perguntas ao EcoBot (+1 EcoCoin por pergunta)

**Frontend (componente de chat):**
- Após enviar mensagem com ≥ 10 caracteres E receber resposta da IA
- Chamar Server Action `creditChatQuestion(messageLength)`
- Limite: 10/dia
- Toast discreto "+1 EcoCoin" (não interromper a conversa)

### 3.5 Avaliar Resposta do EcoBot (+1 EcoCoin)

**Frontend (componente de chat):**
- Botões 👍 / 👎 abaixo de cada resposta da IA
- Ao clicar, chamar Server Action `creditChatRating(messageId, rating)`
- Limite: 10/dia
- Além de dar coins, salvar o feedback para melhorar a IA

### 3.6 Indicar Amigo (+20 EcoCoins)

**Sistema:**
- Cada usuário tem um código de indicação único (gerar no cadastro): `ECOMED-{primeiros6charsDoUserId}`
- Página /app/perfil com seção "Indique amigos" mostrando o código + botão de compartilhar (Web Share API)
- Link gerado: `ecomed.eco.br/cadastro?ref=ECOMED-XXXXXX`
- Quando alguém se cadastra com o código:
  1. Registrar na tabela `referral`
  2. Creditar +20 EcoCoins ao indicador (NÃO ao indicado — o indicado ganha os coins de onboarding normais)
  3. Verificar limite mensal (5/mês)
  4. Verificar missão "Embaixador"

### 3.7 Compartilhar Conteúdo (+3 EcoCoins por artigo, +2 por conquista)

**Frontend:**
- Botão de compartilhar em cada artigo e em cada conquista/badge
- Usar Web Share API: `navigator.share({ title, text, url })`
- SÓ creditar coins se `navigator.share()` foi efetivamente chamada (verificar retorno da Promise)
- Limites: 2 shares de artigo/dia, 1 share de conquista/dia

### 3.8 Streak (+1 a +50 EcoCoins)

**Lógica (executar na função central `creditCoins`):**
- A cada ação creditada, verificar `user_wallet.streak_last_action_date`
- Se `streak_last_action_date == hoje`: streak já contabilizado hoje, não fazer nada
- Se `streak_last_action_date == ontem`: incrementar `streak_current`, atualizar data
  - Se `streak_current == 3`: creditar bônus de 5 coins
  - Se `streak_current == 7`: creditar bônus de 15 coins
  - Se `streak_current == 30`: creditar bônus de 50 coins + badge "Streak 30 dias 🔥"
- Se `streak_last_action_date < ontem` (ou NULL): resetar streak para 1
- Creditar +1 coin de "ação diária" (manter streak)
- Atualizar `streak_best` se `streak_current > streak_best`

**IMPORTANTE:** Usar fuso horário de Brasília (America/Sao_Paulo) para cálculo de "hoje" e "ontem". Reset à meia-noite BRT.

---

## PARTE 4: SISTEMA DE MISSÕES DIÁRIAS

### Geração de missões

Criar uma Edge Function (Supabase) ou Cron Job que roda todo dia à 00:01 (BRT):
- Para cada usuário ativo (login nos últimos 7 dias)
- Selecionar 3 missões aleatórias do pool abaixo
- Inserir na tabela `daily_mission`

**Pool de missões:**

| mission_type | mission_label | Critério de conclusão | bonus_coins |
|---|---|---|---|
| read_article | Leitor do dia | Ler 1 artigo completo | 3 |
| ask_chatbot_3 | Pergunta do dia | Fazer 3 perguntas ao EcoBot | 3 |
| complete_quiz | Quiz relâmpago | Completar 1 quiz com score ≥ 70% | 5 |
| register_disposal | Eco-descarte | Registrar 1 descarte | 5 |
| share_content | Compartilhador | Compartilhar 1 conteúdo | 3 |
| explore_point | Explorador | Visualizar 1 ponto de coleta inédito no mapa | 5 |
| rate_chatbot_3 | Avaliador | Avaliar 3 respostas do EcoBot | 3 |
| early_bird | Madrugador | Realizar qualquer ação antes das 9h BRT | 2 |

### Verificação de conclusão

Após cada `creditCoins`, verificar as missões do dia do usuário:
- Consultar `daily_mission WHERE user_id = X AND date = hoje AND completed = false`
- Para cada missão, verificar se o critério foi atingido (consultar `daily_limit_tracker` e `coin_transaction` do dia)
- Se atingido: marcar `completed = true`, creditar `bonus_coins`
- Se TODAS as 3 missões do dia foram completadas: bônus extra de +10 coins

### Frontend (componente de missões)

- Card no dashboard/home mostrando as 3 missões do dia
- Barra de progresso para cada missão (ex: "Perguntas: 2/3")
- Indicador visual quando completada (✅ + animação)
- Indicador de bônus total ao completar as 3
- Timer mostrando quanto tempo falta para reset (meia-noite BRT)

---

## PARTE 5: FRONTEND — COMPONENTES ESSENCIAIS

### 5.1 Toast de EcoCoins (global)

Componente que aparece sempre que o usuário ganha coins:
- Animação de "+X EcoCoins 🪙" que sobe e desaparece (fade up + fade out)
- Se subiu de nível, toast especial: "🎉 Parabéns! Você subiu para Broto! 🌿"
- Se completou missão, toast: "✅ Missão completada: Leitor do dia +3 EcoCoins"
- Usar React Context ou Zustand para disparar de qualquer componente

### 5.2 Perfil com EcoCoins (/app/perfil)

- Saldo atual de EcoCoins (número grande, animado)
- Nível atual com ícone e cor (🌱 Semente, 🌿 Broto, etc.)
- Barra de progresso para o próximo nível (ex: "320/500 para Árvore")
- Streak atual com ícone de fogo 🔥 ("7 dias consecutivos")
- Impacto pessoal: medicamentos descartados, litros de água protegidos
- Histórico de transações (lista com scroll, filtro por tipo)
- Código de indicação com botão de compartilhar
- Botão "Ver recompensas"

### 5.3 Catálogo de Recompensas (/app/recompensas)

- Grid de cards com as recompensas do catálogo
- Cada card: nome, descrição, custo, nível mínimo, botão "Resgatar"
- Botão desabilitado se saldo insuficiente ou nível insuficiente
- Modal de confirmação antes do resgate ("Gastar 100 EcoCoins?")
- Para certificados: gerar PDF com jsPDF no client-side (nome, data, impacto, QR code)

### 5.4 Ranking Semanal (/app/ranking)

- Top 10 usuários da semana (baseado em coins ganhos na semana corrente, NÃO no saldo total)
- Query: `SELECT user_id, SUM(amount) as weekly_coins FROM coin_transaction WHERE type = 'EARN' AND created_at >= inicio_da_semana GROUP BY user_id ORDER BY weekly_coins DESC LIMIT 10`
- Mostrar posição, nome, avatar, coins da semana, nível
- Destaque para o próprio usuário ("Você está em #4")
- Reset toda segunda-feira à 00:00 BRT

### 5.5 Widget de EcoCoins no Header

- Componente compacto no header: "🪙 320" (saldo atual)
- Ao clicar, abre dropdown rápido com: saldo, nível, streak, link para perfil
- Atualizar em tempo real usando Supabase Realtime (subscribe na tabela `user_wallet`)

---

## PARTE 6: ANTI-FRAUDE

Implementar TODAS estas validações no server-side (NUNCA confiar no client):

1. **Teto diário global:** se `daily_limit_tracker` do dia já soma 120+ coins, rejeitar
2. **Cooldown 60s:** se `daily_limit_tracker.last_action_at` para a mesma ação < 60 segundos, rejeitar
3. **Tempo mínimo de leitura:** artigo com `time_spent_seconds < 120` não ganha coins
4. **Validação de quiz:** recalcular score no server com as respostas corretas do banco
5. **Validação de GPS:** distância Haversine ≤ 200m do ponto de coleta
6. **Rate limiting:** máx 60 requests/minuto por usuário (usar Upstash Redis ou middleware)
7. **Validação de compartilhamento:** verificar que a ação veio de um clique real (não de script)
8. **Detecção de múltiplas contas:** logar fingerprint do dispositivo + IP; flag se padrão suspeito

---

## PARTE 7: SEED DATA

Criar script de seed (`supabase/seed.sql`) com:

1. 7 recompensas no catálogo (já fornecidas acima)
2. 5 quizzes com 5-8 perguntas cada:
   - "Descarte Básico" (fácil)
   - "Mitos e Verdades" (fácil)
   - "Legislação Ambiental" (médio)
   - "Impacto nos Rios" (médio)
   - "Tipos de Medicamentos" (difícil)
3. Perguntas reais e educativas sobre descarte de medicamentos, baseadas nos dados: 91% descartam errado, 30.000 ton/ano, 450.000L contaminados por comprimido, Decreto 10.388/2020, LogMed, PNRS, superbactérias, etc.

---

## RESUMO DE ARQUIVOS A CRIAR

```
lib/coins/config.ts          — constantes e regras do sistema
lib/coins/credit-coins.ts    — função central de crédito (server-side)
lib/coins/check-limits.ts    — verificação de limites diários
lib/coins/update-streak.ts   — lógica de streak
lib/coins/check-missions.ts  — verificação de missões
lib/coins/redeem-reward.ts   — resgate de recompensas

app/api/coins/credit/route.ts       — Route Handler para crédito
app/api/coins/history/route.ts      — Route Handler para histórico
app/api/quiz/[id]/submit/route.ts   — Route Handler para quiz
app/api/ranking/route.ts            — Route Handler para ranking

components/coins/coin-toast.tsx      — toast animado de +X EcoCoins
components/coins/coin-display.tsx    — widget do header
components/coins/level-badge.tsx     — badge de nível com ícone
components/coins/level-progress.tsx  — barra de progresso
components/coins/streak-counter.tsx  — contador de streak
components/coins/mission-card.tsx    — card de missão diária
components/coins/reward-card.tsx     — card de recompensa
components/coins/ranking-list.tsx    — lista de ranking
components/coins/transaction-list.tsx — histórico de transações

app/(app)/perfil/page.tsx            — página de perfil com EcoCoins
app/(app)/recompensas/page.tsx       — catálogo de recompensas
app/(app)/quiz/page.tsx              — lista de quizzes
app/(app)/quiz/[id]/page.tsx         — quiz individual
app/(app)/ranking/page.tsx           — ranking semanal

supabase/migrations/XXXX_create_gamification_tables.sql
supabase/seed.sql
```

---

## CHECKLIST DE VALIDAÇÃO

Após implementar, verificar:

- [ ] Usuário novo recebe +20 coins ao criar conta
- [ ] Ler artigo (scroll 90% + 2min) dá +2 coins, máximo 5/dia
- [ ] Quiz com 100% dá +10, quiz com menos dá +5, máximo 3/dia
- [ ] Descarte com GPS (+15) e sem GPS (+10) funcionam, máximo 3/dia
- [ ] Teto diário de 120 coins bloqueia ganhos extras
- [ ] Cooldown de 60s entre ações do mesmo tipo funciona
- [ ] Streak incrementa corretamente e reseta após 1 dia sem ação
- [ ] Bônus de streak (3, 7, 30 dias) creditam corretamente
- [ ] 3 missões diárias são geradas e verificadas
- [ ] Bônus de completar as 3 missões (+10) funciona
- [ ] Indicação credita +20 ao indicador, máximo 5/mês
- [ ] Resgate de recompensa debita coins e verifica nível mínimo
- [ ] Ranking semanal mostra top 10 e reseta na segunda
- [ ] Nível atualiza automaticamente baseado em lifetime_earned
- [ ] Toast de EcoCoins aparece em todas as ações
- [ ] Histórico de transações mostra todas as movimentações
