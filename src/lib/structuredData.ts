/**
 * Helpers para gerar JSON-LD (Schema.org) de páginas SEO.
 *
 * Esta versão NÃO inclui aggregateRating nem review (decisão do produto:
 * adicionar somente quando houver depoimentos reais autorizados).
 */

const SITE_URL = "https://masterquiz.com.br";

export function buildCompareJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "MasterQuiz",
    description:
      "Plataforma brasileira de quizzes interativos para qualificação de leads, com CRM integrado, IA, vídeo hospedado, analytics avançado e 8 integrações nativas. A partir de R$ 37/mês.",
    brand: {
      "@type": "Brand",
      name: "MasterQuiz",
    },
    url: `${SITE_URL}/compare`,
    image: `${SITE_URL}/og-image.png`,
    offers: {
      "@type": "Offer",
      price: "37.00",
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/precos`,
      priceValidUntil: new Date(new Date().getFullYear() + 1, 11, 31)
        .toISOString()
        .split("T")[0],
    },
  };
}

/** Serializa qualquer objeto JSON-LD com escape seguro contra XSS via </script>. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
