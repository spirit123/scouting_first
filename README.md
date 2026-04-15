# FTC Scout

Offline-first scouting app for FIRST robotics competitions. Scouts use their phone browsers to evaluate robots, take photos, and sync data to a master phone over WiFi hotspot — no internet required.

## How It Works

1. **Master phone** (Android) creates a WiFi hotspot and runs a Node.js server via Termux
2. **Scout phones** (any phone) connect to the hotspot and open the app in their browser
3. Scouts start on the Teams view, tap a team, and fill in the scouting form: role (scorer/feeder/defender), optional photo, and notes
4. Data is stored locally offline and synced to the master phone when in range
5. Master phone exports reports (CSV, HTML, JSON)

## Features

- **Offline-first PWA** — works without network, syncs when connected
- **No app install on scout phones** — just open a URL in the browser
- **Scout assignments** — auto-distribute teams across scouts, track completion progress
- **Photo management** — capture/pick photos, set team thumbnails from team detail view
- **Pre-filled forms** — returning to a team loads the latest scouting data (role + notes)
- **Compact scout workflow** — 3 steps: select team (with image + camera), pick role, add notes
- **Export** — CSV, printable HTML report, JSON data dump

## Quick Start (Development)

```bash
npm install
node seed-teams.js
node server.js
# Open http://localhost:3000
```

## Android Setup (Competition)

### Prerequisites

- Install **Termux** from [F-Droid](https://f-droid.org/en/packages/com.termux/) (NOT Play Store)
- Install **Termux:API** from F-Droid (optional)

### First-Time Setup

```bash
# In Termux:
pkg update -y && pkg upgrade -y
pkg install -y nodejs-lts git
git clone https://github.com/spirit123/scouting_first.git ~/ftc-scout
cd ~/ftc-scout
npm install
node seed-teams.js
```

### Prevent Android from Killing Termux

1. Go to **Settings > Apps > Termux > Battery > Unrestricted**
2. Don't swipe away the Termux notification

### At the Competition

1. Turn on **WiFi Hotspot** on the master phone
2. In Termux:
   ```bash
   cd ~/ftc-scout
   bash scripts/start.sh
   ```
3. The script prints the URL (e.g., `http://192.168.1.22:3000`)
4. Tell scouts the WiFi name/password and URL
5. Keep the master phone **plugged in** (hotspot + server drains battery)

### Updating

```bash
bash scripts/update.sh
bash scripts/start.sh
```

## Fetching Team Stats

The app can pull OPR, rankings, win rate, and scouting data from [The Blue Alliance](https://www.thebluealliance.com/) API.

1. Get a free API key at **https://www.thebluealliance.com/account**
2. Run:
   ```bash
   TBA_KEY=your_key_here node fetch-stats.js
   node seed-teams.js
   ```

This fetches each team's most recent event data: OPR, record, rank, average RP, and calculates a composite score and tier (elite/strong/average/below_avg/developing). Teams with no completed events get a base estimate.

To refresh stats and update in one step:
```bash
TBA_KEY=your_key bash scripts/update.sh && bash scripts/start.sh
```

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/start.sh` | Start server with IP auto-detection + wake-lock |
| `scripts/update.sh` | Pull latest code, reset DB, reseed teams (+ fetch stats if TBA_KEY set) |
| `scripts/setup-termux.sh` | Full one-time Termux setup |
| `node fetch-stats.js` | Fetch team stats from The Blue Alliance API |
| `node seed-teams.js` | Import teams + stats into database |
| `node test.js` | Run diagnostic tests (server must be running) |

## Team List

Edit `2025gal_team_list.csv` to update the team list. Format:
```
team_number,team_name,city,state_prov,country,robot_image_url
16,Bomb Squad,Mountain Home,Arkansas,USA,https://i.imgur.com/example.jpg
```

Then run `node seed-teams.js` to reload.

## Tech Stack

- **Backend**: Node.js, Express, sql.js (pure JS SQLite), multer
- **Frontend**: Vanilla JS PWA (no framework, no build step)
- **Storage**: SQLite (server), IndexedDB (client)
- **Dependencies**: 4 npm packages total
