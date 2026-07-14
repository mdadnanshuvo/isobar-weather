# Isobar Weather Dashboard

A lightweight weather dashboard built with Node.js, Express, and a simple frontend. It shows weather details, an AI-generated summary, and usage information for the WeatherAI API.

Live demo: https://isobar-weather-ai.netlify.app/

Clone repository: https://github.com/mdadnanshuvo/isobar-weather.git

## Prerequisites

Before you start, make sure you have:

- Node.js 18 or newer
- npm
- Git

## Clone and run locally

1. Clone the repository

```bash
git clone https://github.com/mdadnanshuvo/isobar-weather.git
cd isobar-weather
```

2. Install dependencies

```bash
npm install
```

3. Create your environment file

Copy the example file and add your WeatherAI API key:

```bash
cp .env.example .env
```

If you are using PowerShell on Windows, run:

```powershell
Copy-Item .env.example .env
```

Then open the `.env` file and set:

```env
WEATHERAI_API_KEY=your_api_key_here
```

4. Start the app

```bash
npm start
```

5. Open the project in your browser

Visit:

```text
http://localhost:3000
```

## Development mode

If you want auto-reload while editing, run:

```bash
npm run dev
```

## What the app does

- Detects your location or lets you search for a city
- Shows current conditions and a 7-day forecast
- Displays an AI summary powered by WeatherAI
- Includes a metric/imperial toggle
- Shows API usage information

## Project structure

- `server.js` — local Express server
- `netlify/functions/` — Netlify serverless functions
- `public/` — frontend HTML, CSS, and JavaScript
- `.env.example` — environment variable template

## Deploy to Netlify

This project is already configured for Netlify. In deployment settings, publish the `public` folder and use the `netlify/functions` folder for serverless functions.

Set the environment variable in Netlify:

```text
WEATHERAI_API_KEY=your_api_key_here
```
