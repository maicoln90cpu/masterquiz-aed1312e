import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-trace-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BodySchema = z.object({
  fileName: z.string().min(1).max(500).optional(),
  fileBase64: z.string().min(100),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const traceId = getTraceId(req);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse('UNAUTHORIZED', 'Authorization required', traceId, corsHeaders);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return errorResponse('UNAUTHORIZED', 'Invalid token', traceId, corsHeaders);
  }

  const parsed = await parseBody(req, BodySchema, traceId);
  if (parsed instanceof Response) return parsed;
  const { fileName, fileBase64 } = parsed.data;

  if (fileBase64.length > 28 * 1024 * 1024) {
    return errorResponse('VALIDATION_FAILED', 'FILE_TOO_LARGE: maximum 20MB', traceId, corsHeaders);
  }

  try {
    let bytes: Uint8Array;
    try {
      const binaryString = atob(fileBase64);
      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    } catch {
      return errorResponse('VALIDATION_FAILED', 'INVALID_BASE64: failed to decode base64', traceId, corsHeaders);
    }

    const header = new TextDecoder().decode(bytes.slice(0, 5));
    if (!header.startsWith('%PDF')) {
      return errorResponse('VALIDATION_FAILED', 'INVALID_PDF: file is not a valid PDF', traceId, corsHeaders);
    }

    const { getDocumentProxy, extractText } = await import('https://esm.sh/unpdf@0.12.1');

    let pdf: any;
    try {
      pdf = await getDocumentProxy(bytes);
    } catch (loadErr: any) {
      const errMsg = String(loadErr?.message || loadErr);
      if (errMsg.includes('password') || errMsg.includes('encrypted')) {
        return errorResponse('VALIDATION_FAILED', 'PDF_PROTECTED: PDF is password-protected', traceId, corsHeaders);
      }
      return errorResponse('VALIDATION_FAILED', `PDF_LOAD_FAILED: ${errMsg}`, traceId, corsHeaders);
    }

    const numPages = Math.min(pdf.numPages, 50);
    const { totalPages, text } = await extractText(pdf, { mergePages: true });

    if (text.trim().length < 50) {
      return errorResponse(
        'VALIDATION_FAILED',
        'LOW_TEXT_DENSITY: PDF contains very little extractable text (may be scanned/image-based)',
        traceId,
        corsHeaders,
      );
    }

    const markdown = `## Conteúdo extraído (${numPages} páginas)\n\n${text}`;
    console.log(`[parse-pdf-document] ${fileName || 'unnamed'}: ${text.length} chars from ${totalPages} pages`);

    return okResponse({ text, pages: numPages, markdown }, traceId, corsHeaders);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[parse-pdf-document]', message);
    return errorResponse('INTERNAL_ERROR', `PARSE_FAILED: ${message}`, traceId, corsHeaders);
  }
});
