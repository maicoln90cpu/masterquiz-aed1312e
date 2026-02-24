import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { fileName, fileBase64 } = body;

    if (!fileBase64 || typeof fileBase64 !== "string") {
      return new Response(
        JSON.stringify({ error: "fileBase64 is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check size (~20MB after base64 encoding ≈ 28MB in base64)
    if (fileBase64.length > 28 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "FILE_TOO_LARGE", details: "Maximum 20MB." }),
        {
          status: 413,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `[parse-pdf-document] Processing: ${fileName}, base64 length: ${fileBase64.length}`
    );

    // Step 1: Decode base64 to Uint8Array
    let bytes: Uint8Array;
    try {
      const binaryString = atob(fileBase64);
      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      console.log(`[parse-pdf-document] ✅ Base64 decoded: ${bytes.length} bytes`);
    } catch (decodeErr) {
      console.error("[parse-pdf-document] ❌ Base64 decode failed:", decodeErr);
      return new Response(
        JSON.stringify({ error: "INVALID_BASE64", details: "Failed to decode base64 data." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Validate PDF signature
    const header = new TextDecoder().decode(bytes.slice(0, 5));
    if (!header.startsWith("%PDF")) {
      console.error(`[parse-pdf-document] ❌ Invalid PDF signature: "${header}"`);
      return new Response(
        JSON.stringify({ error: "INVALID_PDF", details: "File does not appear to be a valid PDF." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    console.log("[parse-pdf-document] ✅ PDF signature valid");

    // Step 3: Use unpdf — serverless-compatible PDF parser (no workers needed)
    const { getDocumentProxy, extractText } = await import("https://esm.sh/unpdf@0.12.1");

    let pdf: any;
    try {
      pdf = await getDocumentProxy(bytes);
      console.log(`[parse-pdf-document] ✅ PDF loaded: ${pdf.numPages} pages`);
    } catch (loadErr: any) {
      const errMsg = String(loadErr?.message || loadErr);
      console.error("[parse-pdf-document] ❌ PDF load failed:", errMsg);

      if (errMsg.includes("password") || errMsg.includes("encrypted")) {
        return new Response(
          JSON.stringify({ error: "PDF_PROTECTED", details: "PDF is password-protected." }),
          {
            status: 422,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: "PDF_LOAD_FAILED", details: errMsg }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const numPages = Math.min(pdf.numPages, 50);

    // Step 4: Extract text using unpdf
    const { totalPages, text } = await extractText(pdf, { mergePages: true });
    console.log(
      `[parse-pdf-document] ✅ Extracted ${text.length} chars from ${totalPages} pages`
    );

    // Step 5: Check text density
    if (text.trim().length < 50) {
      console.warn("[parse-pdf-document] ⚠️ Very low text density");
      return new Response(
        JSON.stringify({
          error: "LOW_TEXT_DENSITY",
          details: "PDF contains very little extractable text. It may be a scanned/image-based document.",
          text: text.trim(),
          pages: numPages,
        }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build markdown (split by double newlines as page approximation)
    const markdown = `## Conteúdo extraído (${numPages} páginas)\n\n${text}`;

    return new Response(
      JSON.stringify({
        text,
        pages: numPages,
        markdown,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[parse-pdf-document] Error:", error);
    return new Response(
      JSON.stringify({
        error: "PARSE_FAILED",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
