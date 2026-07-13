# Rivalry Arena ⚔️

Built for the DEV Weekend Challenge: Passion Edition.

Type in two things people love fiercely — teams, fandoms, hobbies, anything — and Gemini (Google AI) generates a live head-to-head: creative stats, dramatic ringside commentary, and a trash-talk exchange, ending in a verdict.
https://rivalry-arena.vercel.app/
## Run it locally

No build tools needed — it's plain HTML/CSS/JS.

1. Open this folder in VS Code.
2. Install the **Live Server** extension (if you don't have it).
3. Right-click `index.html` → **Open with Live Server**.
   (Or just double-click `index.html` to open it in your browser directly.)

## Add your Google AI API key

1. Get a free key at **https://aistudio.google.com/apikey**
2. In the app, click **"API Key"** in the top right.
3. Paste your key and click **Save**.

The key is stored only in your browser's `localStorage` — it never touches any server of ours, it only calls Google's API directly from your browser.

## Deploying (for your DEV.to submission)

You can deploy this for free on any static host:

- **Netlify / Vercel**: drag-and-drop the folder, or connect the GitHub repo.
- **GitHub Pages**: push this folder to a repo, enable Pages in settings.

Since the API key is entered client-side by each visitor, you don't need to worry about exposing your own key when you deploy — just note in your submission post that visitors need their own free Gemini key.

## Tech

- Vanilla HTML/CSS/JS (no framework, no build step)
- Google AI (Gemini API) — `gemini-2.0-flash` model
- Fonts: Anton (display), Inter (body), Space Mono (labels)

## Files

```
rivalry-arena/
├── index.html   → structure
├── style.css    → the fight-poster look (red/black theme)
├── script.js    → Gemini API calls + rendering
└── README.md    → this file
```
