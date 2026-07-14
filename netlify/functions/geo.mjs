import { callWeatherAI } from "./_shared.mjs";

// Note: because this call is made server-side, `ip=auto` resolves to
// *this function's* egress IP, not the site visitor's. That's an inherent
// limitation of proxying through a backend rather than calling WeatherAI
// directly from the browser. It's an acceptable fallback here since the
// primary path is the browser's own Geolocation API — this only runs when
// that's denied or unavailable, and a rough regional guess beats nothing.

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const handler = async () => {
  try {
    const result = await callWeatherAI("/v1/weather-geo", { ip: "auto", ai: "false" });
    return json(200, result);
  } catch (err) {
    return json(err.status || 500, { error: err.message, raw: err.raw });
  }
};
