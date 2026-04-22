import { errorResponse, getTraceId } from '../_shared/envelope.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-trace-id',
};

/**
 * DEPRECATED: Use bunny-upload-video-multipart instead.
 * Mantido apenas como gateway de erro padronizado (envelope P11).
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const traceId = getTraceId(req);
  return errorResponse(
    'VALIDATION_FAILED',
    'This endpoint is deprecated. Use bunny-upload-video-multipart instead.',
    traceId,
    corsHeaders,
    410,
  );
});
