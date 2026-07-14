import { callWeatherAI } from "./_shared.mjs";

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const handler = async () => {
  try {
    const result = await callWeatherAI("/v1/usage", {});
    return json(200, result);
  } catch (err) {
    return json(err.status || 500, { error: err.message, raw: err.raw });
  }
};
