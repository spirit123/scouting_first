# FTC Scouting App — Rebuild Prompt

Use this prompt to recreate the application from scratch in a new conversation.

---

## Prompt

Build a mobile-first scouting app for FIRST robotics competitions (FRC). The app must work with **no mobile network** at the venue. Multiple scouts (5-10) use their phones to evaluate robots, then sync data to one master phone.

### Architecture

- **Master phone** (Android): Runs a Node.js/Express server via **Termux** (from F-Droid, not Play Store)
- **Scout phones** (mix of Android + iOS): Open a **PWA** in their browser — no app install needed
- **Connectivity**: Master creates a WiFi hotspot. Scouts connect and open `http://<hotspot-ip>:3000`
- **Offline-first**: PWA caches via service worker. Scouts work offline, sync when near master

### Tech Stack

- **Backend**: Node.js + Express + **sql.js** (pure JS SQLite — no native compilation, works on Termux. Do NOT use better-sqlite3, it fails to compile on Termux ARM64) + multer for file uploads
- **Frontend**: Vanilla JS PWA — no framework, no build step. All files in `public/` served as static
- **Client storage**: IndexedDB for offline entries + cached team list
- **Dependencies**: Only `express`, `sql.js`, `multer`, `uuid`
- **IMPORTANT**: `crypto.randomUUID()` does NOT work on HTTP (non-secure context). Must use a Math.random fallback for UUID generation since scouts connect via HTTP over hotspot

### Team Data

- Teams are loaded from a CSV file (`2025gal_team_list.csv`) with columns: `team_number,team_name,city,state_prov,country,robot_image_url`
- A `seed-teams.js` script imports the CSV into SQLite
- ~75 teams with pre-loaded robot images from imgur

### Database Schema (Server — SQLite)

```sql
teams: team_number (PK), team_name, school, city, state, country, robot_image_url
entries: uuid (PK), team_number, role, filename (nullable), scout_name, notes, created_at, synced_at, file_size
scouts: name (PK)
assignments: team_number + scout_name (composite PK)
team_thumbnails: team_number (PK), photo_source (UUID or "default")
```

### Scouting Workflow (the core UX)

1. **Select Team** — searchable autocomplete. When input is focused with no text, shows assigned teams dropdown (to-do first with orange dot, done with green check)
2. **Pick Robot Role** — three buttons: Scorer, Feeder, Defender (color-coded: green, blue, orange)
3. **Photo** (optional) — camera capture or gallery pick. Images resized client-side to max 1920px wide, JPEG 80% quality (~500KB)
4. **Notes** (optional) — free text
5. **Save** — stores to IndexedDB, syncs later

**Key behavior**: When selecting a team that already has entries, the form **pre-fills** with the latest entry's role and notes. Switching teams clears and reloads. After saving, the team stays selected and data refreshes. When navigating from team detail via "Scout This Team", a "Back to Team #N" button appears.

### Scout Assignment System

- **Master phone** manages scouts via an Admin view (accessible from Teams > Manage button)
- Add/remove scout names
- **Auto-assign**: round-robin distribution, each team assigned to N scouts (default 2)
- Scouts set their name in Settings (must match)
- **Gallery view** shows: assignment progress bar, filter buttons (All / My Teams / To Do), teams sorted by assignment status (to-do first with orange border, done with green border)
- Progress dashboard shows per-scout completion and remaining teams

### Sync Protocol

- Client batches entries in groups of 5
- POST `/api/sync` with multipart form-data: `metadata` JSON array + optional `photo_<uuid>` files
- Server deduplicates by UUID, returns `{ synced: [...], duplicates: [...], errors: [...] }`
- Photo is optional — entries can sync without a photo attached

### Photo & Thumbnail System

- Scout photos replace pre-loaded robot images as team thumbnails in the gallery
- **Team detail page** shows ALL photos in a grid: pre-loaded image + all scout photos (local + synced)
- **Thumbnail picker**: Tap any photo in team detail to set it as the gallery thumbnail (star badge + pink outline on selected). Stored in `team_thumbnails` table
- Gallery thumbnail priority: chosen thumbnail > latest scout photo > pre-loaded robot image

### Views (6 main + 2 extra, hash routing SPA)

1. `#/scout` — Main scouting form (team search, role, photo, notes)
2. `#/scout/:num` — Scout form with team pre-selected + back button
3. `#/queue` — Pending uploads list, "Sync All" button with progress bar
4. `#/gallery` — Team cards grid with photos, assignment badges, search, filters
5. `#/team/:num` — Team detail: all photos grid with thumbnail picker, entries list, "Scout This Team" button
6. `#/export` — Stats, CSV/HTML/JSON download
7. `#/admin` — Scout management, auto-assign, progress dashboard
8. `#/settings` — Scout name, server IP/port, test connection, debug toggle, clear data

### Navigation

- Bottom tab bar: Scout, Queue (with badge count), Teams, Settings
- Admin accessible from Teams > Manage button
- Export accessible from Teams > Export button

### Service Worker

- Precache all app shell files
- Cache-then-network for `/api/teams`
- Cache-first for `/api/entries/*/image`
- Network-only for sync, export, status
- Bump `CACHE_VERSION` string on every change

### API Endpoints

```
GET  /api/status                    — health + stats
GET  /api/teams                     — team list with entry counts + thumbnail info
GET  /api/teams/:num                — single team
POST /api/teams/:num/thumbnail      — set gallery thumbnail { photoSource }
GET  /api/entries?team=NUM          — list entries
GET  /api/entries/:uuid/image       — serve photo JPEG
DELETE /api/entries/:uuid           — remove entry
POST /api/sync                      — bulk upload (multipart)
GET  /api/export/csv|json|html      — export data
GET  /api/scouts                    — list scouts with progress
POST /api/scouts                    — add scout { name }
DELETE /api/scouts/:name            — remove scout
GET  /api/scouts/assignments?scout= — get assignments
POST /api/scouts/assignments        — manual assign { teamNumber, scoutName }
DELETE /api/scouts/assignments      — remove assignment
POST /api/scouts/assignments/auto   — auto-distribute { perTeam }
```

### Termux Deployment

- `scripts/setup-termux.sh` — one-time: install Node.js, npm install, seed teams
- `scripts/start.sh` — detect hotspot IP via `ifconfig` (not `ip addr` which needs root), start server with wake-lock
- `scripts/update.sh` — git pull + reset DB + reseed
- Must run `termux-wake-lock` to prevent Android from killing the server
- Disable battery optimization for Termux in Android settings

### Settings & Debug

- Scout name stored in localStorage
- Server IP/port configurable (auto-detects from current URL by default)
- Debug logging toggle (off by default): all `UI.log()` calls gated by localStorage `debugMode` flag
- "Test Connection" button pings `/api/status`

### CSS Design

- Mobile-first, CSS variables for theming
- Dark header (#1a1a2e), accent red (#e94560)
- Role buttons: scorer=green, feeder=blue, defender=orange
- Assignment badges: to-do=orange border, done=green border
- Bottom tab bar with safe-area-inset for notched phones
- SVG icon for PWA manifest

### Key Lessons Learned

1. `crypto.randomUUID()` fails on HTTP — must provide fallback
2. `better-sqlite3` won't compile on Termux — use `sql.js` instead
3. `ip addr` needs root on Termux — use `ifconfig` for IP detection
4. Termux must be from F-Droid, not Play Store (Play Store version is abandoned)
5. Service worker cache version must be bumped on every code change
6. File input for camera must be appended to DOM before `.click()` on some browsers
7. IndexedDB version must be bumped when changing object store schema
