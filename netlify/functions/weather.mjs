import { callWeatherAI, cacheGet, cacheSet } from "./_shared.mjs";

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  const { lat, lon, units = "metric", days = "7", ai = "true" } =
    event.queryStringParameters || {};

  if (!lat || !lon) return json(400, { error: "lat and lon are required." });

  const cacheKey = `w:${Number(lat).toFixed(2)}:${Number(lon).toFixed(
    2
  )}:${units}:${days}:${ai}`;
  const cached = cacheGet(cacheKey);
  if (cached) return json(200, { ...cached, cached: true });

  try {
    const result = await callWeatherAI("/v1/weather", { lat, lon, units, days, ai });
    cacheSet(cacheKey, result);
    return json(200, { ...result, cached: false });
  } catch (err) {
    return json(err.status || 500, { error: err.message, raw: err.raw });
  }
};
