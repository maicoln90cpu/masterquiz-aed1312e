import { useEffect } from "react";
import { serializeJsonLd } from "@/lib/structuredData";

interface UseDocumentMetaOptions {
  title?: string;
  description?: string;
  /** Objeto JSON-LD (Schema.org). Será injetado em <script type="application/ld+json"> com id estável. */
  jsonLd?: unknown;
  /** ID único para o <script> JSON-LD (permite múltiplos no mesmo head sem colisão). */
  jsonLdId?: string;
}

/**
 * Hook simples para gerenciar título, meta description e JSON-LD da página.
 *
 * Restaura o título anterior ao desmontar (evita "vazar" para outras rotas).
 * Não substitui um SEO library completo, mas atende páginas estáticas como /compare.
 */
export function useDocumentMeta({
  title,
  description,
  jsonLd,
  jsonLdId = "page-jsonld",
}: UseDocumentMetaOptions) {
  useEffect(() => {
    const previousTitle = document.title;

    if (title) {
      document.title = title;
    }

    let descriptionEl: HTMLMetaElement | null = null;
    let previousDescription: string | null = null;
    if (description) {
      descriptionEl = document.querySelector('meta[name="description"]');
      if (!descriptionEl) {
        descriptionEl = document.createElement("meta");
        descriptionEl.setAttribute("name", "description");
        document.head.appendChild(descriptionEl);
      } else {
        previousDescription = descriptionEl.getAttribute("content");
      }
      descriptionEl.setAttribute("content", description);
    }

    let scriptEl: HTMLScriptElement | null = null;
    if (jsonLd) {
      scriptEl = document.getElementById(jsonLdId) as HTMLScriptElement | null;
      if (!scriptEl) {
        scriptEl = document.createElement("script");
        scriptEl.type = "application/ld+json";
        scriptEl.id = jsonLdId;
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = serializeJsonLd(jsonLd);
    }

    return () => {
      document.title = previousTitle;
      if (descriptionEl && previousDescription !== null) {
        descriptionEl.setAttribute("content", previousDescription);
      }
      if (scriptEl && scriptEl.parentNode) {
        scriptEl.parentNode.removeChild(scriptEl);
      }
    };
  }, [title, description, jsonLd, jsonLdId]);
}
