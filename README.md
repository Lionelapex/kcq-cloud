# KCQ Cloud

KCQ Cloud is a shared quiz-question library. The web app organizes uploaded images into modules, while the Chrome extension saves quiz questions and marked answers from Moodle review pages. Both use the same Supabase project.

## Features

- Organize photos into modules and browse them in the web app.
- Upload photos individually, import a module folder, or import a ZIP of module folders.
- Save question text, answer options, selected answers, and grades from Moodle review pages with the Chrome extension.
- Search saved questions in the extension and use saved answers in the attempt-page helper.
- Optionally configure an OpenAI-compatible answer endpoint and module study guides in the extension.

The website's current image upload flow stores and displays photos; it does not OCR them. The extension reads quiz text from Moodle pages. It does not import arbitrary `.txt` question files.

## Technology

- React 18 and Vite for the web app.
- Supabase JS, Supabase Postgres/PostgREST, and Supabase Storage for cloud data and images.
- Chrome Extension Manifest V3 for Moodle integration, background messaging, and the lookup side panel.
- JSZip for ZIP image imports.
- Web Crypto API (SHA-256) for matching repeat question text within a module.
- Optional OpenAI-compatible chat completions endpoint for answer suggestions.

The repository also contains a Node/Express server and maintenance scripts. The current web client connects directly to Supabase.

## Requirements

- Node.js and npm.
- A Supabase project.
- Google Chrome or a Chromium-based browser to install the extension.

## Supabase setup

1. Create a Supabase project.
2. In the Supabase SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql). This creates the `modules` and `questions` tables and the `screenshots` storage bucket.
3. Copy the project URL and anon/public key from the Supabase project settings.

**Access warning:** The included starter schema grants public read/write access to the database and screenshots. Anyone with the app and project details can access or change this shared data. Do not use this configuration for private or sensitive content; add authentication and restrictive row-level/storage policies before doing so. Never put a Supabase service-role key in the browser or extension.

## Run the web app

Create `client/.env` with your project settings:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Then, from the repository root:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite. Use the app to create a module, then upload photos or import a folder/ZIP. For folder and ZIP imports, place each module's images inside a folder named for that module.

## Install the Chrome extension

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Select **Load unpacked** and choose this repository's `extension/` directory.
3. Open the extension's **Options** page and enter the same Supabase project URL and anon key.
4. On a Moodle quiz review page, select **Save to KCQ Cloud**, confirm the module name, and wait for the save result.
5. Open the extension side panel or use the in-page lookup to search saved questions. On a quiz attempt page, the helper checks for a confirmed saved answer before requesting an optional AI suggestion.

AI suggestions are optional. Configure an HTTPS OpenAI-compatible chat-completions endpoint, model, and API key in extension Options. You can also add a study guide by pasting text or loading a `.txt`/`.md` guide file. The extension stores these settings and guides in Chrome local storage. A saved cloud answer takes priority over an AI request; uncertain suggestions are marked for checking.

## Useful commands

Run from the repository root:

```powershell
npm run dev
npm run build
npm run test:extension
npm run supabase:check
```

`npm run supabase:check` uses the server workspace's Supabase configuration. The extension tests cover question saving/merging, lookup behavior, parsing, and answer-suggestion behavior.

## Data flow

- **Website images:** The browser uploads image files to Supabase Storage and writes their module and storage-path metadata to `questions`. The app loads images with signed URLs.
- **Moodle quiz text:** The review-page content script reads question text, options, selected choice, and score. The extension service worker uses Supabase REST to create or update question rows. It hashes normalized question text to avoid duplicates within a module and keeps wrong picks so later results can update the saved record.
- **Saved questions:** The web app and extension read the same Supabase tables. The extension's attempt helper uses a matching confirmed cloud answer before its optional AI fallback.

## Deployment

The repository includes Vercel configuration in [`vercel.json`](vercel.json). Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project environment, then deploy the client build.