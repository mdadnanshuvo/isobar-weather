// ISOBAR — local development server.
//
// This is a thin Express wrapper around the same logic used in production
// (see netlify/functions/_shared.mjs). Locally you get a normal long-running
// Node server; deployed to Netlify, the app instead uses the Functions in
// netlify/functions/ — both call the same callWeatherAI() so there's one
// place that knows how to talk to WeatherAI, cache it, and handle its
// error codes. See netlify.toml for the production routing.

import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { callWeatherAI, cacheGet, cacheSet } from "./netlify/functions/_shared.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.WEATHERAI_API_KEY) {
  console.warn(
    "[isobar] WEATHERAI_API_KEY is not set. Copy .env.example to .env and add your key."
  );
}

const app = express();
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/weather", async (req, res) => {
  const { lat, lon, units = "metric", days = "7", ai = "true" } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: "lat and lon are required." });
  }

  const cacheKey = `w:${Number(lat).toFixed(2)}:${Number(lon).toFixed(
    2
  )}:${units}:${days}:${ai}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.json({ ...cached, cached: true });

  try {
    const result = await callWeatherAI("/v1/weather", { lat, lon, units, days, ai });
    cacheSet(cacheKey, result);
    res.json({ ...result, cached: false });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, raw: err.raw });
  }
});

app.get("/api/geo", async (req, res) => {
  try {
    const result = await callWeatherAI("/v1/weather-geo", { ip: "auto", ai: "false" });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, raw: err.raw });
  }
});

app.get("/api/usage", async (req, res) => {
  try {
    const result = await callWeatherAI("/v1/usage", {});
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, raw: err.raw });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[isobar] listening on http://localhost:${PORT}`);
});
