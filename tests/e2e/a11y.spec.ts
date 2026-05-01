import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

// Páginas públicas críticas — devem estar livres de violações sérias e críticas.
// Limitamos a tags WCAG 2.1 AA + best-practice; rules instáveis ficam em disabledRules.
const publicPages: { path: string; label: string }[] = [
  { path: "/", label: "home" },
  { path: "/o-que-fazemos", label: "o-que-fazemos" },
  { path: "/sobre", label: "sobre" },
  { path: "/parceiros", label: "parceiros" },
  { path: "/compromisso", label: "compromisso" },
  { path: "/blog", label: "blog" },
  { path: "/contato", label: "contato" },
  { path: "/entrar", label: "entrar" },
  { path: "/cadastrar", label: "cadastrar" },
  { path: "/mapa", label: "mapa" },
]

const seriousImpacts = new Set(["serious", "critical"])

for (const { path, label } of publicPages) {
  test(`a11y (${label}): sem violações serious/critical`, async ({ page }) => {
    await page.goto(path)
    // Aguarda o conteúdo principal renderizar antes de auditar
    await page.waitForLoadState("networkidle").catch(() => null)

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
      // Falsos positivos comuns em SPAs com next-themes / leaflet
      .disableRules(["color-contrast", "region"])
      .analyze()

    const blockers = results.violations.filter((v) => seriousImpacts.has(v.impact ?? ""))
    if (blockers.length > 0) {
      // Loga para facilitar debug em CI
      // eslint-disable-next-line no-console
      console.error(
        `[a11y] ${label} violations:`,
        JSON.stringify(
          blockers.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
          null,
          2,
        ),
      )
    }
    expect(blockers, `${label} tem violações serious/critical de a11y`).toEqual([])
  })
}
