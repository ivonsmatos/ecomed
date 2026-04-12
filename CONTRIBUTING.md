# 🤝 Guia de Contribuição — EcoMed

Obrigado por querer contribuir com o EcoMed! Este guia explica como participar do projeto de forma organizada.

---

## 📋 Antes de Começar

1. **Leia o [README.md](README.md)** para entender o projeto
2. **Leia o [Código de Conduta](CODE_OF_CONDUCT.md)** — respeito é obrigatório
3. **Verifique as [issues abertas](https://github.com/ivonsmatos/ecomed/issues)** para ver se alguém já está trabalhando no que você quer fazer
4. **Configure o ambiente local** seguindo as instruções do README

---

## 🌿 Fluxo de Trabalho

### Branches

| Branch | Uso |
|---|---|
| `main` | Produção. Sempre estável. **Nunca commitar direto.** |
| `develop` | Desenvolvimento. Features em progresso. Merge para `main` via PR. |
| `feat/nome` | Nova funcionalidade. Ex: `feat/ranking-semanal` |
| `fix/descricao` | Correção de bug. Ex: `fix/coins-nao-creditam` |
| `docs/o-que` | Documentação. Ex: `docs/atualizar-faq` |
| `chore/o-que` | Manutenção. Ex: `chore/atualizar-dependencias` |
| `refactor/o-que` | Refatoração sem mudança de comportamento |
| `test/o-que` | Testes novos ou melhorias em testes |

### Passo a Passo

```bash
# 1. Fork o repositório no GitHub

# 2. Clone seu fork
git clone https://github.com/SEU-USUARIO/ecomed.git
cd ecomed

# 3. Adicione o repo original como upstream
git remote add upstream https://github.com/ivonsmatos/ecomed.git

# 4. Crie branch a partir do develop
git checkout develop
git pull upstream develop
git checkout -b feat/minha-feature

# 5. Faça suas mudanças + commits
git add .
git commit -m "feat: adicionar ranking semanal"

# 6. Push para seu fork
git push origin feat/minha-feature

# 7. Abra Pull Request no GitHub (base: develop)
```

---

## 📝 Convenção de Commits

Usamos **Conventional Commits** para manter o histórico organizado:

```
tipo(escopo opcional): descrição curta

corpo opcional (explica o "por quê")

rodapé opcional (breaking changes, issues fechadas)
```

### Tipos

| Tipo | Quando Usar | Exemplo |
|---|---|---|
| `feat` | Nova funcionalidade | `feat: adicionar sistema de missões diárias` |
| `fix` | Correção de bug | `fix: corrigir cálculo de streak no fuso BRT` |
| `docs` | Documentação | `docs: adicionar artigo sobre perfurocortantes` |
| `style` | Formatação (sem mudança de lógica) | `style: ajustar espaçamento do card de coins` |
| `refactor` | Refatoração (sem mudança de comportamento) | `refactor: extrair lógica de coins para hook` |
| `test` | Testes | `test: adicionar testes para creditCoins` |
| `chore` | Manutenção | `chore: atualizar dependências do Next.js` |
| `perf` | Performance | `perf: lazy load do mapa com dynamic import` |
| `ci` | CI/CD | `ci: adicionar workflow de Lighthouse CI` |

### Regras

- **Tudo em português** (commits, PRs, issues, comentários)
- **Primeira letra minúscula** na descrição: `feat: adicionar`, não `feat: Adicionar`
- **Sem ponto final** na descrição
- **Máximo 72 caracteres** na primeira linha
- Se o commit fecha uma issue: adicionar `Closes #123` no rodapé

---

## 🔀 Pull Requests

### Antes de abrir um PR

- [ ] Código compila sem erros (`pnpm build`)
- [ ] Lint passa (`pnpm lint`)
- [ ] Type check passa (`pnpm type-check`)
- [ ] Testes passam (`pnpm test`)
- [ ] Testou manualmente no navegador (mobile + desktop)
- [ ] Não quebra funcionalidades existentes

### Template do PR

Ao abrir o PR, preencha:

```markdown
## O que muda?
Descrição clara do que foi implementado/corrigido.

## Por quê?
Contexto: qual problema resolve ou qual feature adiciona.

## Como testar?
1. Acessar /app/ranking
2. Verificar que os 10 primeiros aparecem
3. Clicar em "Ver meu posição"

## Screenshots (se visual)
Antes | Depois

## Checklist
- [ ] Código compila (`pnpm build`)
- [ ] Lint passa (`pnpm lint`)
- [ ] Testes passam (`pnpm test`)
- [ ] Testei em mobile (320px)
- [ ] Não quebra nada existente
```

### Revisão

- Todo PR para `develop` precisa de **pelo menos 1 review** de um maintainer
- Todo PR para `main` precisa de **pelo menos 2 reviews**
- Maintainers podem pedir mudanças — não leve para o lado pessoal, é para melhorar o código
- Depois de aprovado, o maintainer faz o merge (nunca o autor)

---

## 🐛 Reportar Bugs

Use o template de [Bug Report](https://github.com/ivonsmatos/ecomed/issues/new?template=bug_report.md):

```markdown
## Descrição do Bug
O que aconteceu vs o que deveria ter acontecido.

## Passos para Reproduzir
1. Acessar '...'
2. Clicar em '...'
3. Ver erro

## Comportamento Esperado
O que deveria acontecer.

## Screenshots
Se aplicável.

## Ambiente
- Navegador: Chrome 120
- Dispositivo: iPhone 13
- Sistema: iOS 17
```

---

## 💡 Sugerir Features

Use o template de [Feature Request](https://github.com/ivonsmatos/ecomed/issues/new?template=feature_request.md):

```markdown
## Problema
Qual problema essa feature resolve?

## Solução Proposta
Como você imagina a solução?

## Alternativas Consideradas
Outras formas de resolver.

## Contexto Adicional
Screenshots, referências, etc.
```

**Regra:** abra a issue ANTES de implementar. Discuta com a equipe. Depois implemente.

---

## 🎨 Padrões de Código

### TypeScript

- **Strict mode** habilitado (`strict: true` no tsconfig)
- Sempre tipar parâmetros e retornos de funções
- Preferir `interface` sobre `type` para objetos
- Usar `const` por padrão, `let` só quando necessário, **nunca `var`**

### React

- **Functional components** apenas (nunca class components)
- Hooks no topo do componente
- Nomes de componentes em PascalCase: `CoinToast`, não `coinToast`
- 1 componente por arquivo
- Componentes em `/components`, páginas em `/app`

### Estilização

- **Tailwind CSS** para estilos inline
- **CSS Variables** do Design System para cores: `var(--eco-teal)`, nunca hex direto
- **Sem gradientes** — todas as cores são sólidas
- **Mobile-first**: estilizar para 320px primeiro

### Acessibilidade

- **Alt text** em todas as imagens
- **Min-height 44px** em todos os elementos clicáveis
- **Contraste WCAG AA** (4.5:1 mínimo para texto)
- **Semantic HTML**: `<nav>`, `<main>`, `<article>`, `<button>` (nunca `<div onClick>`)
- Testar com tab navigation

### Nomenclatura

- **Arquivos**: kebab-case (`coin-toast.tsx`, não `CoinToast.tsx`)
- **Componentes**: PascalCase (`export function CoinToast()`)
- **Hooks**: camelCase com prefixo `use` (`useCoins`, `useStreak`)
- **Constantes**: UPPER_SNAKE_CASE (`DAILY_COIN_CAP = 120`)
- **Variáveis e funções**: camelCase (`creditCoins`, `userWallet`)

---

## 🗂️ Labels das Issues

| Label | Cor | Uso |
|---|---|---|
| `good-first-issue` | 🟢 Verde | Fácil, ideal para novatos |
| `help-wanted` | 🟡 Amarelo | Média dificuldade, precisa de ajuda |
| `feature` | 🔵 Azul | Nova funcionalidade |
| `bug` | 🔴 Vermelho | Bug confirmado |
| `docs` | ⚪ Cinza | Documentação |
| `research` | 🟣 Roxo | Pesquisa necessária antes de implementar |
| `duplicate` | ⬜ Branco | Duplicada de outra issue |
| `wontfix` | ⬛ Preto | Decidido não implementar |
| `3ta` | 🟢 Verde escuro | Responsabilidade da turma 3TA |
| `3tb` | 🔵 Azul escuro | Responsabilidade da turma 3TB |
| `3tc` | 🟤 Teal | Responsabilidade da turma 3TC |
| `priority-high` | 🔴 Vermelho | Prioridade alta |
| `priority-low` | 🟡 Amarelo | Prioridade baixa |

---

## 🔐 Segurança

Se você encontrar uma **vulnerabilidade de segurança**, NÃO abra uma issue pública. Envie e-mail para **contato@ecomed.eco.br** com:

- Descrição da vulnerabilidade
- Passos para reproduzir
- Impacto potencial

Respondemos em até 48h. Veja [SECURITY.md](SECURITY.md) para mais detalhes.

---

## 📚 Recursos Úteis

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Ollama Docs](https://ollama.com)
- [Conventional Commits](https://www.conventionalcommits.org/pt-br)
- [Design System do EcoMed](docs/ecomed-design-system.jsx)
- [Brand Guide do EcoMed](docs/ecomed-brand-guide.docx)

---

## ❓ Dúvidas?

- Abra uma [Discussion](https://github.com/ivonsmatos/ecomed/discussions) no GitHub
- Pergunte no grupo do WhatsApp (alunos)
- Envie e-mail para contato@ecomed.eco.br

---

**Obrigado por contribuir! Cada PR faz diferença para o meio ambiente. 🌿**
