# Changelog - EcoMed

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [2026.04.11] - Estabilização e Validação

Esta atualização focou em estabilizar a base de código, validar as funcionalidades existentes e preparar o ambiente para a implementação do sistema de gamificação EcoCoin.

### 🚀 Melhorias

- **Baseline de QA:** Adicionada configuração para testes unitários (Vitest) e E2E (Playwright).
- **Documentação de Gamificação:** Adicionado o documento `prompt-implementacao-ecocoin.md` como a fonte da verdade para a implementação do sistema EcoCoin.
- **Documentação Estratégica:** Adicionados novos documentos de planejamento de negócio, onboarding, parcerias e personas no diretório `/docs`.

### 🐛 Correções

- **Linting Geral:**
  - Corrigidos erros críticos de lint que impediam a validação do código.
  - O arquivo de service worker gerado (`app/public/sw.js`) foi ignorado no ESLint para prevenir falsos positivos.
  - Corrigidos erros de `set-state-in-effect` em componentes React (`MapContainer`, `useGeolocation`) ao adiar atualizações de estado, melhorando a performance e estabilidade.
- **Testes E2E:**
  - Adicionado passo de instalação dos navegadores Playwright (`pnpm exec playwright install chromium`) para garantir que os testes E2E possam rodar em qualquer ambiente.
- **Testes Unitários:**
  - A suíte de testes unitários foi executada com sucesso, confirmando que a lógica de negócio (especialmente dos quizzes) permanece estável.

### ✅ Validação

- **Testes Unitários:** 100% de aprovação (34/34 testes passaram).
- **Testes E2E:** 100% de aprovação nos testes de smoke, validando o carregamento da home e o status do health check.
- **Build de Produção:** O projeto compila com sucesso para produção (`pnpm build`).
- **Lint:** O linter agora executa sem erros, restando apenas avisos não-bloqueantes.
