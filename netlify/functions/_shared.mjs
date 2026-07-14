// Shared logic for talking to WeatherAI. Used by the Netlify Functions in
// this folder, and re-used by ../../server.js for local development, so
// there's exactly one place that knows how to call the upstream API,
// cache it, and translate its error codes.

const API_BASE = "https://api.weather-ai.co";

// NOTE on the cache: Netlify Functions are stateless per-invocation in the
// general case, but a "warm" function container does keep module-level
// state (this Map) between back-to-back invocations, so this still cuts
// real request volume in practice — just don't rely on it being durable
// or shared across concurrent cold starts the way a real cache (Redis,
// Netlify Blobs, etc.) would be. Good enough for this project's scale.
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value) {
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function friendlyError(res) {
  switch (res.status) {
    case 401:
      return "The API key was rejected. Check WEATHERAI_API_KEY in your environment.";
    case 403:
      return "This endpoint isn't included in the current plan.";
    case 429:
      return "Monthly request quota reached. Try again once it resets.";
    case 400:
      return "That request was missing something the API needs.";
    case 503:
      return "WeatherAI's data source is temporarily unreachable.";
    default:
      return "WeatherAI returned an unexpected error.";
  }
}

export async function callWeatherAI(pathname, searchParams, { retries = 2 } = {}) {
  const apiKey = process.env.WEATHERAI_API_KEY;
  if (!apiKey) {
    const err = new Error(
      "WEATHERAI_API_KEY is not set in this environment's variables."
    );
    err.status = 500;
    throw err;
  }

  const url = new URL(pathname, API_BASE);
  for (const [k, v] of Object.entries(searchParams)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    } catch (networkErr) {
      if (attempt === retries) {
        const err = new Error("Could not reach WeatherAI.");
        err.status = 502;
        throw err;
      }
      await sleep(300 * 2 ** attempt);
      continue;
    }

    if (res.ok) {
      const data = await res.json();
      return {
        data,
        rateLimit: {
          limit: res.headers.get("x-ratelimit-limit"),
          remaining: res.headers.get("x-ratelimit-remaining"),
          reset: res.headers.get("x-ratelimit-reset"),
        },
        geo: {
          country: res.headers.get("x-country"),
          region: res.headers.get("x-region"),
          city: res.headers.get("x-city"),
        },
      };
    }

    if ((res.status === 500 || res.status === 503) && attempt < retries) {
      await sleep(300 * 2 ** attempt);
      continue;
    }

    const bodyText = await res.text().catch(() => "");
    console.error(
      `[isobar] WeatherAI ${res.status} on ${pathname} — raw body: ${bodyText.slice(0, 500)}`
    );
    const err = new Error(await friendlyError(res));
    err.status = res.status;
    err.raw = bodyText;
    throw err;
  }
}

export { cacheGet, cacheSet };
