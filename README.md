# Sharpen

A daily journal, todo list, habit tracker, and learning log — for you, not
for work. Built as its own app on purpose, separate from win-deck, so your
personal record doesn't live inside a PC-only control panel and *is*
reachable from your phone.

## What's in here

- **Today** (`/`) — journal (free log + reflection), mood/energy, today's
  todos, and a "learned today" quick-capture that files under whichever
  learning track it belongs to (or "General").
- **Habits** (`/habits`) — tap to mark done, see a 30-day strip, streak
  counter. Tapping any past day toggles that day too, so a missed day isn't
  a dead end.
- **Learning** (`/learning`) — the tracks you're actively building skill in
  (seeded from what's already on your V: drive: AWS, LangChain, LLM
  fundamentals, Python — edit/rename/delete freely), each with its log of
  dated entries underneath it.

Single user, PIN-gated, same URL from your PC browser and your iPhone
(Safari → Share → Add to Home Screen makes it feel like a real app).

## One-time setup

### 1. Turso (the database)

```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth signup      # or: turso auth login
turso db create sharpen
turso db show sharpen --url          # -> TURSO_DATABASE_URL
turso db tokens create sharpen       # -> TURSO_AUTH_TOKEN
```

### 2. Local env file

```bash
cp .env.example .env.local
```

Fill in `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` from above. For
`APP_SECRET`, run `openssl rand -hex 32` and paste the result. For
`APP_PIN`, pick something you'll actually remember but isn't `0000`.

### 3. Install and initialize

```bash
npm install
npm run db:init      # creates tables, seeds default habits + learning tracks
npm run dev           # http://localhost:3000
```

### 4. Deploy so your phone can reach it

```bash
npm i -g vercel
vercel                 # first deploy, follow the prompts
```

Then in the Vercel project's dashboard → Settings → Environment Variables,
add `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `APP_SECRET`, `APP_PIN` (same
values as your `.env.local`), and redeploy (`vercel --prod`).

Open the resulting `https://sharpen-....vercel.app` URL on your iPhone,
enter your PIN, then Share → Add to Home Screen.

## Backups

`npm run db:backup` dumps every table to a timestamped JSON file under
`backups/`. Since Turso is SQLite under the hood, you're never locked in —
you can also run `turso db shell sharpen .dump > backup.sql` anytime for a
raw SQL dump that any SQLite tool can read.

To make this automatic instead of something you have to remember: add a
scheduled GitHub Action (`.github/workflows/backup.yml`) that runs
`npm run db:backup` nightly and commits the result to a **private** repo —
ask for this to be wired up once the app is deployed and the repo exists,
since it needs the Turso credentials added as GitHub Actions secrets first.

## Known, low-risk item

`npm audit` flags a PostCSS source-map path-traversal advisory pulled in by
Next 14's build tooling. It only matters if something untrusted controls a
CSS source map at *build* time, which nothing here does — safe to ignore
for now, and it'll clear itself out whenever this gets upgraded to Next 15/16.
