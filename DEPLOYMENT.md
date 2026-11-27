# Deployment and sync

The app is live at **https://lifts.markcossey.co.uk**, on shared hosting (Plesk on Linux).
It previously ran on GitHub Pages; that has been switched off.

## How deploys work

Every push to `main` runs `.github/workflows/deploy.yml`, which:

1. runs the tests (`npm run test:run`), so a failing test stops the deploy;
2. builds the app (`npm run build`) into `dist/`;
3. uploads over encrypted FTP (FTPS) with `lftp`:
   - `dist/` → the site root (old build files are removed, but `api/` and
     `.well-known/` are left alone);
   - `server/api/` → `api/` (except `config.php`, which only exists on the server).

You can also start a deploy by hand from the repo's **Actions** tab ("Run workflow").

The hosting plan doesn't allow SSH, which is why it uses FTPS. The FTP login is stored in
the repo's GitHub Actions secrets `FTP_USERNAME` and `FTP_PASSWORD`. That FTP account
can only reach the subdomain's folder.

The app is served from the root of the subdomain, so `base` and the manifest paths in
`vite.config.ts` are `/`. HTTPS uses a free Let's Encrypt certificate that Plesk renews
automatically.

## Data sync

Each device keeps its data in `localStorage` and works offline. When a device is connected
to sync (**Settings → Sync**, or "I already use this on another device" on the welcome
screen), it also syncs with a small PHP API on the hosting:

| File | Purpose |
|---|---|
| `server/api/login.php` | Swaps the sync passcode for a per-device token. 10 wrong attempts lock that IP out for 15 minutes. |
| `server/api/state.php` | Reads and saves the whole app state as one JSON document with a revision number. A save only succeeds if the device had the latest revision. The last 100 versions are kept in `state_history`. |
| `server/api/setup.php` | One-time page that creates the database tables and writes `config.php`. It refuses to run again once `config.php` exists. |
| `server/api/lib.php` | Shared helpers. Not reachable from the web. |

On the app side, `src/hooks/useSync.ts` pushes changes shortly after they're made. It pulls
when the app opens, comes back to the foreground or reconnects, and every minute while
visible. If two devices both changed data offline, `src/sync/merge.ts` combines them:
workouts from both are kept, and lift weights follow the device with the most recent workout.

### Changing the sync passcode

1. In Plesk's **File Manager**, delete `api/config.php` in the subdomain's folder.
2. Open `https://lifts.markcossey.co.uk/api/setup.php` and fill it in again. Your saved
   data is kept; only the passcode and database details are rewritten.
3. Existing devices stay connected. To force every device to re-enter the passcode, also
   empty the `tokens` table (Plesk → Databases → phpMyAdmin).

### Restoring an earlier version of the data

Every save keeps the previous version in the `state_history` table. To roll back, copy the
`data` of the version you want into the `app_state` row in phpMyAdmin and increase its
`revision` by one. Devices pick it up on their next sync.

## Installing on iPhone or iPad

1. Open https://lifts.markcossey.co.uk in Safari.
2. Tap Share → **Add to Home Screen**.
3. Open it and tap **"I already use this on another device"**, then enter the sync passcode.

## Local development

`npm run dev` runs the app locally. Sync calls `/api`, which doesn't exist on the dev
server, so sync shows "Not synced" there. Everything else works as normal.
