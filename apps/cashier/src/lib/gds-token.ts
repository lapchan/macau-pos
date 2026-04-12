// In-process access-token cache for GDS (gds.org.cn / ANCC) lookups.
//
// We obtain access tokens via OIDC refresh_token grant against
// passport.gds.org.cn. The long-lived refresh_token is provisioned
// out-of-band (one-time browser login → copied from localStorage)
// and lives in the GDS_REFRESH_TOKEN env var. It does NOT rotate.
//
// Access tokens last 6h. We refresh ~60s before expiry, and serialize
// concurrent refreshes through a single in-flight promise so a burst
// of scans only triggers one token request.

const TOKEN_URL = "https://passport.gds.org.cn/connect/token";
const DEFAULT_CLIENT_ID = "vuejs_code_client";
const REFRESH_SAFETY_MS = 60_000;
const TOKEN_FETCH_TIMEOUT_MS = 5_000;

let cached: { value: string; expiresAt: number } | null = null;
let inflight: Promise<string | null> | null = null;

export async function getGdsAccessToken(): Promise<string | null> {
  const now = Date.now();
  if (cached && cached.expiresAt - REFRESH_SAFETY_MS > now) {
    return cached.value;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    const refreshToken = process.env.GDS_REFRESH_TOKEN;
    if (!refreshToken) return null;
    const clientId = process.env.GDS_CLIENT_ID || DEFAULT_CLIENT_ID;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TOKEN_FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: clientId,
          refresh_token: refreshToken,
        }),
        cache: "no-store",
        signal: ctrl.signal,
      });
      if (!res.ok) return null;
      const json = (await res.json()) as {
        access_token?: string;
        expires_in?: number;
      };
      if (!json.access_token) return null;
      cached = {
        value: json.access_token,
        expiresAt: Date.now() + (json.expires_in ?? 21600) * 1000,
      };
      return json.access_token;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
      inflight = null;
    }
  })();

  return inflight;
}
