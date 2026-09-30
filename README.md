# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Player 3: direct playback

Player 3 ports the supplied `get_stream.py` extraction into the Supabase
`extract-stream` Edge Function. It tries mgeb → nhdapi → superflix, preserving
TMDB ID/season/episode, and detects public HLS/MP4 URLs in HTML. Challenge pages
are skipped. Links are fetched afresh on each attempt; existing signatures are
preserved, never fabricated. Already-expired playlists are skipped.

The same function proxies playback (`GET ?proxy=…`), including relative HLS
variants, audio, keys and segments, and forwards byte ranges for MP4. Providers
and media hosts are restricted in `resolver.js`; a new CDN requires an explicit
allowlist update. Playback can still fail when providers change markup, block
server requests, or return unavailable media. Retry resolves a fresh source;
it does not guarantee the provider has renewed its token.

Deploy the backend as well as the frontend:

```sh
supabase functions deploy extract-stream --project-ref xfqocptliyukeypvylom
npm run build
```

`supabase/config.toml` already configures `verify_jwt = false` for this public
playback function. Set `VITE_SUPABASE_URL` if deploying to a different project.
The older `api/player3.js` is not used by this frontend.

Offline resolver checks: `node --test tests/player3.test.js`.
