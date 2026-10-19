# Ade's Gadget — Render (free) deploy packet

**Chosen path:** Render free web service, deploy `server.js` as-is, with the admin password guarded by a Render secret instead of the file. Access-code backup (`AG_ADMIN_SECRET` / `admin-secret.txt`) stays working.

**How the auth now works (after the code change):**
- Admin login: email from `admin-account.json`, password from `process.env.ADMIN_PASSWORD` first, then `admin-account.json` as fallback.
- Legacy access code: `process.env.AG_ADMIN_SECRET` first, then `admin-secret.txt` as fallback.
- Sessions: in-memory. After a Render free restart you sign in again — expected, fine.

**What lives on the Render free disk (ephemeral):**
- `local-storageMock.json` — the live catalog/hero/promos your admin edits write to.
- `img-admin/uploads/` — photos you upload from the admin panel.

These can be lost on a redeploy or free-tier recycle. The safety net: if the catalog is wiped, `server.js` re-seeds from `catalog-data.json` on next start, so the default 16 phones come back. Uploaded photos do not auto-recover — that is the durability caveat for the free plan.

**If you want edits/photos to survive restarts later:** the next upgrade is Cloudflare R2 (free 10 GB) backing `local-storageMock.json` and uploads. It is a small change to `server.js`, not a rewrite. Say the word and I will add it.

---

## 1. Files you are shipping

Send all of these to your Git repo (repo root = project folder):

Core files:
- `index.html`
- `app.js`
- `admin.js`
- `styles.css`
- `server.js`

Credentials (kept in the repo for now):
- `admin-account.json` — email only matters much once the password is in a Render secret
- `admin-secret.txt`

Data:
- `catalog-data.json` — default catalog seed, used to re-seed if the live catalog is wiped
- `local-storageMock.json` — the live dataset (starts as a copy of `catalog-data.json`)

Images:
- `img/` — all 16 phone photos
- `img-admin/` — must exist; `img-admin/uploads/` is where uploads go

Build helper (included for completeness, not required at runtime):
- `build-catalog-json.js`

This handoff:
- `render-deploy.md`

---

## 2. Create the Git repo and push

1. Go to https://github.com/new and create a new repo named `ades-gadget` (or any name you like).
   - Public or private both work for Render. If public, the password file is visible until you switch the login to the Render secret; that is why the next step moves the password into a secret.
2. In this project folder, run:
   ```
   git init
   git add index.html app.js admin.js styles.css server.js admin-account.json admin-secret.txt catalog-data.json local-storageMock.json build-catalog-json.js img img-admin render-deploy.md
   git commit -m "Ade's Gadget shop + admin"
   git branch -M main
   git remote add origin <YOUR_GITHUB_REPO_URL>
   git push -u origin main
   ```
   Replace `<YOUR_GITHUB_REPO_URL>` with the URL GitHub gave you.
   - If you want the password file out of the repo entirely, add a `.gitignore` with `admin-account.json` and `admin-secret.txt`, and rely only on Render secrets + the access-code env var. For your "only me" goal with a private repo, shipping the file plus the Render secret is fine.

3. Verify GitHub shows all the files, including the `img/` folder and `img-admin/`.

---

## 3. Render — create the web service

1. In Render, **New → Web Service**.
2. Connect your GitHub account, then choose the `ades-gadget` repo.
3. Configure:
   - **Name:** `ades-gadget` (or any name you like)
   - **Region:** closest to you/Nigeria if available
   - **Branch:** `main`
   - **Root Directory:** leave empty (files are at the repo root)
   - **Runtime:** `Node`
   - **Build Command:** leave empty
   - **Start Command:** `node server.js`
   - **Plan:** `Free`
4. **Environment variables** — add these in Render's UI for the service before deploying:
   - `PORT` = `10000`
   - `ADMIN_PASSWORD` = `Shalom12345...` — mark this as a **Secret**
   - `AG_ADMIN_SECRET` = `ag_mv9bg6nj_lihs3gtb`
   - `NODE_ENV` = `production` (optional, but good hygiene)

   Notes:
   - `ADMIN_PASSWORD` is the actual admin password. Keep it as a secret so it does not show in logs or the dashboard plainly.
   - `AG_ADMIN_SECRET` is the access-code backup. If you ever want to change it, set a new value here and in `admin-secret.txt`, or use the admin panel "Change" button (which calls `/admin-set-secret`).
   - `PORT=10000` is what Render expects for web services; `server.js` now reads `process.env.PORT`.
5. Click **Create Web Service**.
6. Wait for the deploy to reach **Live**. Your site will be at `https://<name>.onrender.com`.

---

## 4. First-time checks after deploy

1. Open the live site. The shop should render with the 16 phones.
2. Open the admin panel and sign in:
   - Email: `adebusayoibrahim27@gmail.com`
   - Password: `Shalom12345...`
3. In the admin panel, confirm:
   - The catalog shows the 16 phones.
   - Editing a phone price and saving updates the shop.
   - Uploading a photo to a phone saves and shows on the phone card.
4. Copy your live URL and share it. The public sees only the shop; the admin panel is behind email+password (and the access-code backup if you prefer that).

**Important free-tier behavior to know:**
- The service sleeps after about 15 minutes of no traffic and wakes on the next request. First visit after a pause can take a few seconds.
- If you edit the catalog and then a redeploy/restart happens, your edits are stored on the ephemeral disk and can be lost. Re-seeding from `catalog-data.json` brings back the default phones, not your custom edits. That is the trade-off for staying on the free plan.

---

## 5. If you later want durability on the free plan

Only if you want admin edits and uploaded photos to survive restarts:
- Create a free Cloudflare account.
- Create an R2 bucket.
- Create an R2 API token with read/write for that bucket.
- Set these Render env vars:
  - `R2_ACCOUNT_EMAIL`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_BUCKET`
- I then change `server.js` to read/write the catalog/hero/promos and uploads through R2 instead of the local disk.

That keeps your catalog and photos durable on the free Render plan. Until then, the current packet is the smallest working deploy.

---

## 6. If you ever want to rotate the admin password

1. In Render, edit the service's environment variables and set a new `ADMIN_PASSWORD` secret.
2. Redeploy (or restart) so `server.js` picks up the new secret.
3. Sign in with the new password.
