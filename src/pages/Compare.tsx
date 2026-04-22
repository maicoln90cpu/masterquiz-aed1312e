import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, X, Gift, Layers, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { ABTestVariant, ABTestTracker } from "@/components/landing/ABTestVariant";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { buildCompareJsonLd } from "@/lib/structuredData";
import {
  COMPARE_ROWS,
  COMPARE_TABLE_FOOTNOTE,
  VS_INLEAD,
  type CompareValue,
} from "@/data/compareContent";
import { cn } from "@/lib/utils";

function CellValue({ value, highlight }: { value: CompareValue; highlight?: boolean }) {
  if (value.type === "yes") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Check
          className={cn(
            "h-4 w-4 shrink-0",
            highlight ? "text-primary" : "text-success",
          )}
        />
        <span className="text-sm">{value.text}</span>
      </span>
    );
  }
  if (value.type === "no") {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <X className="h-4 w-4 shrink-0 text-destructive" />
        <span className="text-sm">{value.text}</span>
      </span>
    );
  }
  if (value.type === "warn") {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <span className="text-warning">⚠️</span>
        <span className="text-sm">{value.text}</span>
      </span>
    );
  }
  return <span className="text-sm font-medium">{value.text}</span>;
}

export default function Compare() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useDocumentMeta({
    title: t("landing.compare.seo.title"),
    description: t("landing.compare.seo.description"),
    jsonLd: buildCompareJsonLd(),
    jsonLdId: "compare-jsonld",
  });

  const diffCards = [
    {
      icon: Gift,
      title: t("landing.compare.cards.free.title"),
      text: t("landing.compare.cards.free.text"),
    },
    {
      icon: Layers,
      title: t("landing.compare.cards.allInOne.title"),
      text: t("landing.compare.cards.allInOne.text"),
    },
    {
      icon: Globe,
      title: t("landing.compare.cards.brazil.title"),
      text: t("landing.compare.cards.brazil.text"),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      <main className="pt-24">
        {/* SEÇÃO 1 — HERO */}
        <section className="container mx-auto px-4 md:px-6 py-12 md:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              {t("landing.compare.hero.title")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              {t("landing.compare.hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                size="lg"
                variant="hero"
                onClick={() => navigate("/login")}
              >
                {t("landing.compare.hero.ctaPrimary")}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/precos")}
              >
                {t("landing.compare.hero.ctaSecondary")}
              </Button>
            </div>
          </div>
        </section>

        {/* SEÇÃO 2 — 3 CARDS */}
        <section className="container mx-auto px-4 md:px-6 py-12">
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {diffCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} variant="elevated" className="h-full">
                  <CardContent className="pt-6 space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {card.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {card.text}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* SEÇÃO 3 — TABELA COMPARATIVA */}
        <section className="container mx-auto px-4 md:px-6 py-16">
          <div className="text-center mb-10 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("landing.compare.table.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("landing.compare.table.subtitle")}
            </p>
          </div>

          <div className="max-w-6xl mx-auto rounded-lg border bg-card overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-foreground">
                    {t("landing.compare.table.feature")}
                  </TableHead>
                  <TableHead className="bg-primary text-primary-foreground font-bold text-center">
                    MasterQuiz
                  </TableHead>
                  <TableHead className="text-center font-semibold">InLead</TableHead>
                  <TableHead className="text-center font-semibold">Typeform</TableHead>
                  <TableHead className="text-center font-semibold">Outgrow</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {COMPARE_ROWS.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-foreground">
                      {row.feature}
                    </TableCell>
                    <TableCell className="bg-primary/5 text-center">
                      <CellValue value={row.masterquiz} highlight />
                    </TableCell>
                    <TableCell className="text-center">
                      <CellValue value={row.inlead} />
                    </TableCell>
                    <TableCell className="text-center">
                      <CellValue value={row.typeform} />
                    </TableCell>
                    <TableCell className="text-center">
                      <CellValue value={row.outgrow} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4 max-w-3xl mx-auto">
            {COMPARE_TABLE_FOOTNOTE}
          </p>
        </section>

        {/* SEÇÃO 4 — VS INLEAD EM DETALHE */}
        <section className="bg-muted/20 py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-10 space-y-3 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                {t("landing.compare.vsInlead.title")}
              </h2>
              <p className="text-muted-foreground">
                {t("landing.compare.vsInlead.subtitle")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* InLead */}
              <Card variant="elevated" className="h-full">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">
                      {VS_INLEAD.inlead.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {VS_INLEAD.inlead.subtitle}
                    </p>
                  </div>
                  <ul className="space-y-3">
                    {VS_INLEAD.inlead.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm">
                        <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* MasterQuiz — destacado */}
              <Card
                variant="elevated"
                className="h-full border-2 border-primary relative"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Recomendado
                </div>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-primary">
                      {VS_INLEAD.masterquiz.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {VS_INLEAD.masterquiz.subtitle}
                    </p>
                  </div>
                  <ul className="space-y-3">
                    {VS_INLEAD.masterquiz.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <p className="text-center text-muted-foreground max-w-3xl mx-auto mt-8 leading-relaxed">
              {VS_INLEAD.conclusion}
            </p>
          </div>
        </section>

        {/* SEÇÃO 5 — CTA FINAL */}
        <section className="bg-secondary/30 py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                {t("landing.compare.cta.title")}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t("landing.compare.cta.subtitle")}
              </p>
              <div className="pt-2">
                <ABTestTracker element="compare_cta_final" conversionType="signup">
                  {(track) => (
                    <ABTestVariant
                      element="compare_cta_final"
                      fallback={
                        <Button
                          size="xl"
                          variant="hero"
                          onClick={() => navigate("/login")}
                        >
                          {t("landing.compare.cta.button")}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      }
                    >
                      {(content) => (
                        <Button
                          size="xl"
                          variant="hero"
                          onClick={() => {
                            track();
                            navigate("/login");
                          }}
                        >
                          {content?.text || t("landing.compare.cta.button")}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </ABTestVariant>
                  )}
                </ABTestTracker>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("landing.compare.cta.loginHint")}{" "}
                <button
type="button"
onClick={() => navigate("/login")}
                  className="text-primary hover:underline font-medium"
                >
                  {t("landing.compare.cta.loginLink")}
                </button>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
