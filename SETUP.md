# Accounts setup (Supabase + Netlify)

Accounts use Supabase (email + password sign-in, confirmation and password-reset
emails, and a `progress` table). The site is a static build hosted on Netlify.
Without Supabase keys the app still runs, with progress saved only in the browser.

## 1. Supabase (free plan)
1. Create an account at https://supabase.com and a **New project** (any name, pick a region near you, save the database password somewhere).
2. **SQL Editor → New query**: paste `supabase/schema.sql`, click **Run**.
3. **Project Settings → API**: copy the **Project URL** and the **anon public** key.
   The anon key is meant to be public; the table's row-level security keeps each user's data private.
   Never share the `service_role` key.

## 2. Build
    cp .env.example .env      # paste the URL and anon key
    npm install
    npm run build             # -> dist/

## 3. Netlify (free plan)
1. Create an account at https://app.netlify.com.
2. Go to https://app.netlify.com/drop and drag the `dist` folder onto the page. Note the site URL it gives you (you can rename it under Site configuration).
   (Or connect a GitHub repo: build command `npm run build`, publish directory `dist`, and add the two `VITE_SUPABASE_*` variables under Environment variables.)

## 4. Point Supabase emails at the site
Supabase → **Authentication → URL Configuration**:
- **Site URL**: your Netlify URL, e.g. `https://tcf-swipe.netlify.app`
- **Redirect URLs**: add the same URL.
Confirmation and reset links in the emails then open the app, which finishes sign-up or shows the new-password form.

## Notes
- Supabase's built-in email sender is rate limited (a few emails per hour). Fine for a couple of users; add your own SMTP under Authentication → Emails for more.
- Progress syncs about a second after each swipe and again whenever you return to the tab. Signing out clears progress from that device (it stays in the account).
- `npm run build:single` makes the one-file preview (no accounts). `vite build --mode mock` builds against an in-memory fake backend for testing.
