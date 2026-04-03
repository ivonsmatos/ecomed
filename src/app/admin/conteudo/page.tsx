import { requireAdmin } from "@/lib/auth/session";
import { buttonVariants } from "@/components/ui/button-variants";
import { getArticles } from "@/lib/sanity/queries";
import { Badge } from "@/components/ui/badge";
import { PenLine, ExternalLink } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Conteúdo | Admin EcoMed" };

const CATEGORY_LABEL: Record<string, string> = {
  descarte: "Descarte",
  legislacao: "Legislação",
  "saude-ambiental": "Saúde Ambiental",
  dicas: "Dicas",
  ecomed: "EcoMed",
};

export default async function AdminConteudoPage() {
  await requireAdmin();

  const articles = await getArticles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Conteúdo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Artigos gerenciados via Sanity CMS.
          </p>
        </div>
        <Link
          href="/studio"
          target="_blank"
          className={buttonVariants({ size: "sm" })}
        >
          <PenLine className="mr-1.5 size-4" />
          Abrir editor (Studio)
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="rounded-xl border border-dashed flex flex-col items-center justify-center gap-3 py-20 text-center">
          <PenLine className="size-10 text-muted-foreground" />
          <div>
            <p className="font-medium">Nenhum artigo publicado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crie artigos no Sanity Studio e marque como publicado.
            </p>
          </div>
          <Link href="/studio" target="_blank" className={buttonVariants()}>
            Abrir Sanity Studio
          </Link>
        </div>
      ) : (
        <div className="divide-y rounded-xl border overflow-hidden">
          {articles.map((article) => (
            <div
              key={article._id}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/40 transition-colors"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="font-medium truncate">{article.title}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {article.category && (
                    <Badge variant="secondary" className="text-xs">
                      {CATEGORY_LABEL[article.category] ?? article.category}
                    </Badge>
                  )}
                  {article.publishedAt && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(article.publishedAt).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/blog/${article.slug}`}
                  target="_blank"
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                  title="Ver no blog"
                >
                  <ExternalLink className="size-3.5" />
                </Link>
                <Link
                  href="/studio"
                  target="_blank"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {articles.length} artigo{articles.length !== 1 ? "s" : ""} publicado
        {articles.length !== 1 ? "s" : ""} · edite em{" "}
        <Link href="/studio" target="_blank" className="underline">
          /studio
        </Link>
      </p>
    </div>
  );
}
