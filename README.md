# Client 360 — Insurance Dashboard

A Vite + React project. This wraps the dashboard component in a real,
buildable app — the bare `.jsx` file alone can't be deployed on its own,
because platforms like Vercel and Netlify need a `package.json`, an
`index.html` entry point, and a build step to turn it into a static site.

## Data

The app reads and writes real data in Supabase (project `claudecode-demo`,
tables `customers`, `policies`, `claims`, `cases`) — there's no mock data
in the source anymore. On load, `App.jsx` fetches all four tables and joins
policies/claims onto each customer. The "Edit" / "Save" flow on a client's
profile writes directly to the `customers` table.

Connection details live in `.env` (already filled in, and gitignored so it
never gets committed). `.env.example` shows the two variables needed:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

**Note on security:** the tables currently have permissive "allow all" RLS
policies (no auth is wired up yet), so the publishable key above can read
and write every row. That's fine for development, but should be scoped
down (e.g. to authenticated users only) before this holds real customer
data.

## Run locally

```bash
npm install
npm run dev
```

Opens at http://localhost:5173

## Build for production

```bash
npm run build
```

Outputs a static site to `dist/`.

## Deploy

Since `.env` is gitignored, you'll need to add the two Supabase variables
in your hosting provider's dashboard — otherwise the deployed site will
build fine but fail to load data at runtime.

**Vercel**
1. Push this folder to a GitHub repo.
2. In Vercel, "Add New Project" → import the repo.
3. Under Project Settings → Environment Variables, add `VITE_SUPABASE_URL`
   and `VITE_SUPABASE_ANON_KEY` (values from `.env`).
4. Vercel auto-detects Vite. Leave the defaults (build command `vite build`,
   output directory `dist`) and deploy.

**Netlify**
1. Push this folder to a GitHub repo (or drag-and-drop the `dist/` folder
   after running `npm run build` for a one-off deploy — in that case, env
   vars aren't needed since `.env` is baked into your local build).
2. If connecting a repo: build command `npm run build`, publish directory
   `dist` (already set in `netlify.toml`). Add the same two environment
   variables under Site configuration → Environment variables.

## Project structure

```
index.html          entry HTML, points at src/main.jsx
src/main.jsx         mounts <App /> into #root
src/App.jsx          the dashboard itself (all data + UI in one file)
src/index.css        minimal global reset
```

All customer, case, and claims data is mock data defined at the top of
`src/App.jsx` — there's no backend. Edits made via the "Edit" button on a
client's profile are held in React state only, so they reset on refresh.
