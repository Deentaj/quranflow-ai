import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const CLIENT_ID = Deno.env.get('QURAN_FOUNDATION_CLIENT_ID') ?? '';
const CLIENT_SECRET = Deno.env.get('QURAN_FOUNDATION_CLIENT_SECRET') ?? '';
const TOKEN_URL = 'https://oauth2.quran.foundation/oauth2/token';
const API_BASE = 'https://apis.quran.foundation/content/api/v4';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }
  const basic = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const body = new URLSearchParams({ grant_type: 'client_credentials', scope: 'content' });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token fetch failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return cachedToken.token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('Quran Foundation credentials not configured');
    }
    const { path, query } = await req.json();
    if (!path || typeof path !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing path' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const qs = query && typeof query === 'object'
      ? '?' + new URLSearchParams(query as Record<string, string>).toString()
      : '';
    const token = await getToken();
    const upstream = await fetch(`${API_BASE}${cleanPath}${qs}`, {
      headers: {
        Accept: 'application/json',
        'x-auth-token': token,
        'x-client-id': CLIENT_ID,
      },
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('quran-api error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});