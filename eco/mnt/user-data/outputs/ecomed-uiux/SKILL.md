---
name: ecomed-uiux
description: >
  Skill de UI/UX para o projeto EcoMed. Use sempre que for criar ou revisar componentes
  de interface, telas, fluxos de navegação, responsividade, animações, design system,
  ou quando precisar garantir consistência visual. Inclui tokens de design, padrões de
  componentes shadcn/ui com @base-ui/react, estratégias mobile-first, Tailwind v4,
  acessibilidade visual, e guia de experiência do usuário por perfil (cidadão, parceiro, admin).
---

# EcoMed — UI/UX e Design System

## Stack de UI

| Tecnologia | Versão | Papel |
|---|---|---|
| Tailwind CSS | v4 | Estilização utility-first |
| shadcn/ui | latest (@base-ui/react) | Componentes acessíveis |
| Leaflet + react-leaflet | latest | Mapa interativo |
| Recharts | latest | Gráficos do dashboard |
| Serwist | v9 | PWA offline UX |

> ⚠️ **Atenção — Tailwind v4:** A configuração mudou. Não existe mais `tailwind.config.js`.
> As customizações ficam no CSS via `@theme` e `@layer`. Ver `references/tailwind-v4.md`.

---

## Design Tokens — Cores EcoMed

```css
/* app/src/app/globals.css */
@import "tailwindcss";

@theme {
  /* Marca */
  --color-primary:       #2D7D46;   /* Verde EcoMed — CTAs, links ativos */
  --color-primary-light: #4CAF73;   /* Hover states */
  --color-primary-dark:  #1B5C32;   /* Texto sobre fundo claro */
  --color-secondary:     #4A90D9;   /* Azul — ícones de mapa, info */
  --color-accent:        #F5A623;   /* Laranja — alertas, badges, EcoCoin */
  --color-danger:        #D94A4A;   /* Vermelho — erros, reportes */

  /* Superfícies */
  --color-bg:            #F7F9F8;   /* Background da página */
  --color-surface:       #FFFFFF;   /* Cards, modais */
  --color-border:        #E5E7EB;   /* Bordas padrão */
  --color-border-strong: #9CA3AF;   /* Bordas em campos ativos */

  /* Texto */
  --color-text:          #1A1A1A;   /* Texto principal */
  --color-text-muted:    #6B7280;   /* Texto secundário */

  /* EcoCoin */
  --color-coin:          #F5A623;   /* Laranja do EcoCoin */
  --color-coin-bg:       #FEF3C7;   /* Fundo claro para badges de coin */
}
```

## Tipografia

```css
@theme {
  --font-display: "Plus Jakarta Sans", sans-serif;  /* títulos */
  --font-body:    "Inter", sans-serif;              /* corpo */
  --font-mono:    "JetBrains Mono", monospace;      /* código */
}
```

Importar no `layout.tsx`:
```typescript
import { Plus_Jakarta_Sans, Inter } from "next/font/google"

const display = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display" })
const body = Inter({ subsets: ["latin"], variable: "--font-body" })
```

---

## Mobile-First — Breakpoints

```css
/* Tailwind v4 — definidos no @theme */
@theme {
  --breakpoint-xs: 375px;   /* smartphone pequeno */
  --breakpoint-sm: 640px;   /* smartphone grande */
  --breakpoint-md: 768px;   /* tablet */
  --breakpoint-lg: 1024px;  /* desktop pequeno */
  --breakpoint-xl: 1280px;  /* desktop padrão */
}
```

**Regra:** sempre codificar mobile primeiro, adicionar `md:` e `lg:` para telas maiores.

```tsx
// ✅ Mobile-first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ❌ Desktop-first (evitar)
<div className="grid grid-cols-3 max-md:grid-cols-1">
```

---

## Navegação — Bottom Nav (mobile) + Sidebar (desktop)

```tsx
// Estrutura de navegação responsiva
// Mobile: Bottom Navigation fixa
// Desktop: Sidebar lateral

const MAIN_NAV = [
  { href: "/mapa",        label: "Mapa",       icon: MapPin      },
  { href: "/blog",        label: "Aprender",   icon: BookOpen    },
  { href: "/app/perfil",  label: "Perfil",     icon: User        },
  { href: "/app/coins",   label: "EcoCoins",   icon: Coins       },
]

// Touch targets mínimos: 44x44px
// Ícone ativo com cor primary, inativo com text-muted
// Badge de notificação no ícone de Perfil quando há notificações não lidas
```

---

## Componentes Chave — Padrões

### PointCard — Card do ponto de coleta

```tsx
interface PointCardProps {
  point: {
    id: string
    name: string
    address: string
    distancia_km?: number
    residueTypes: string[]
    photoUrl?: string | null
    schedules: Schedule[]
  }
  onFavorite?: () => void
  isFavorited?: boolean
  className?: string
}

// Elementos obrigatórios no card:
// 1. Nome do ponto (h3)
// 2. Endereço com ícone MapPin
// 3. Distância em km (se disponível)
// 4. Tipos de resíduo (badges coloridos)
// 5. Horário do dia atual
// 6. Botão "Como chegar" (abre Google Maps)
// 7. Botão favoritar (coração toggle)
// 8. Botão reportar problema
```

### CoinBadge — Exibição de coins

```tsx
// Usar em: perfil, histórico, tela de EcoCoins
// Sempre mostrar o ícone de moeda + número + "EcoCoins"
// Animação ao ganhar: número incrementa suavemente

export function CoinBadge({ amount, size = "md" }: { amount: number; size?: "sm" | "md" | "lg" }) {
  return (
    <span className="inline-flex items-center gap-1 font-medium text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">
      <span className="text-amber-500">◈</span>
      {amount.toLocaleString("pt-BR")}
      {size !== "sm" && <span className="text-xs text-amber-600">EcoCoins</span>}
    </span>
  )
}
```

### LevelBadge — Nível do usuário

```tsx
const LEVELS = {
  SEMENTE:  { emoji: "🌱", label: "Semente",  color: "text-green-700 bg-green-50" },
  BROTO:    { emoji: "🌿", label: "Broto",    color: "text-emerald-700 bg-emerald-50" },
  ARVORE:   { emoji: "🌳", label: "Árvore",   color: "text-teal-700 bg-teal-50" },
  GUARDIAO: { emoji: "🌍", label: "Guardião", color: "text-blue-700 bg-blue-50" },
}
```

---

## Fluxos por Perfil — UX críticos

### Cidadão — fluxo principal

```
1. Acessa ecomed.eco.br/mapa (público, sem login)
2. Permite geolocalização → mapa centraliza
   OU digita CEP → mapa atualiza
3. Clica em ponto → drawer/card lateral abre
4. Lê detalhes → clica "Como chegar" → Google Maps abre
5. Tenta favoritar → se não logado → prompt de login (não redirect abrupto)
6. Cadastro → verifica email → volta ao mapa → favorita → ganha 20 EcoCoins
```

**Regra UX:** nunca redirecionar para login sem explicar por quê. Usar modal/toast
"Faça login para salvar seus pontos favoritos" com botão de ação.

### Parceiro — cadastro de ponto

```
1. /parceiro/cadastro-ponto
2. Step 1: CNPJ → validação instantânea → auto-fill do nome da empresa
3. Step 2: Endereço → CEP → auto-fill via ViaCEP → pin no mini-mapa
4. Step 3: Horários (grid dias da semana) + tipos de resíduo (checkboxes)
5. Step 4: Foto do ponto (drag & drop ou click)
6. Step 5: Revisão + envio
7. Confirmação visual + email automático
8. Status "Em análise" no dashboard do parceiro
```

**Regra UX:** formulários multi-step devem sempre mostrar progresso (1 de 5).
Salvar rascunho automaticamente no localStorage entre steps.

### Admin — aprovação

```
1. /admin/dashboard → badge vermelho com N pendentes
2. Clica na notificação → /admin/pontos?status=PENDING
3. Tabela com: nome, CNPJ, cidade, data de cadastro
4. Clica na linha → painel lateral com todos os dados + foto
5. Mini-mapa com o pin na localização do ponto
6. Botão Aprovar (verde) ou Rejeitar (vermelho → modal pede motivo)
7. Feedback instantâneo (toast) + atualização na tabela
```

---

## PWA — Experiência de Instalação

```tsx
// hooks/usePWAInstall.ts
// Capturar evento beforeinstallprompt
// Mostrar banner "Adicionar à tela inicial" após segunda visita
// Localização do banner: bottom sheet no mobile, tooltip no desktop

// iOS: Safari não dispara beforeinstallprompt
// → Detectar iOS e mostrar instrução manual:
//   "Toque em [compartilhar] e depois 'Adicionar à Tela de Início'"

// Ícones necessários (gerar em https://pwabuilder.com/imageGenerator):
// 72, 96, 128, 144, 152, 192, 384, 512 (maskable), favicon 32, favicon 16
```

---

## Tela de EcoCoins — Estrutura

```
/app/coins

┌─────────────────────────────────────┐
│  Seu saldo              [◈ 247]     │
│  Nível: Broto  🌿  ████░░ 253 p/próx│
├─────────────────────────────────────┤
│  MISSÕES DO DIA                     │
│  ○ Leia 3 artigos      [+8 coins]   │
│  ● Reporte 1 problema  [✓ feito]    │
│                                     │
│  CONQUISTAS (badges)                │
│  [Curioso] [Primeiro artigo] [...]  │
├─────────────────────────────────────┤
│  HISTÓRICO                          │
│  +2  Artigo lido · há 2h            │
│  +20 Cadastro   · 3/4/26            │
├─────────────────────────────────────┤
│  RESGATAR                           │
│  [Certificado · 100 ◈] [Relatório · 200 ◈]
└─────────────────────────────────────┘
```

---

## Referências

- **`references/tailwind-v4.md`** — migração Tailwind v3 → v4, @theme, novos utilitários
- **`references/shadcn-base-ui.md`** — mudanças do shadcn/ui com @base-ui/react vs radix
