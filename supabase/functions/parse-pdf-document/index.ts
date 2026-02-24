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

    // Check size (base64 is ~33% larger than binary, so 20MB binary ≈ 27MB base64)
    if (fileBase64.length > 28 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "File too large. Maximum 20MB." }),
        {
          status: 413,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `[parse-pdf-document] Processing: ${fileName}, base64 length: ${fileBase64.length}`
    );

    // Decode base64 to Uint8Array
    const binaryString = atob(fileBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Extract text from PDF using pdf-parse
    const pdfParse = (await import("https://esm.sh/pdf-parse@1.1.1")).default;

    const result = await pdfParse(bytes);

    const text = result.text || "";
    const pageCount = result.numpages || 0;

    console.log(
      `[parse-pdf-document] Extracted ${text.length} chars from ${pageCount} pages`
    );

    // Build markdown-like output
    const markdown = text
      .split(/\n{3,}/)
      .map((section: string) => section.trim())
      .filter((s: string) => s.length > 0)
      .join("\n\n");

    return new Response(
      JSON.stringify({
        text,
        pages: pageCount,
        markdown: markdown || text,
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
        error: "Failed to parse PDF",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
