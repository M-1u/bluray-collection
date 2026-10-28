<h1 align="center"><img src="build/icon.png" width="96" alt=""><br>Blu-ray Collection</h1>

<p align="center">
  Manage your <b>physical film collection</b> — Blu-ray, 4K, DVD, steelbooks and custom covers.<br>
  Entries enriched by <a href="https://www.themoviedb.org">TMDB</a>, cross-referenced with your <a href="https://letterboxd.com">Letterboxd</a> data. Local and offline.
</p>

<p align="center">
  <a href="https://github.com/M-1u/bluray-collection/releases/latest"><img src="https://img.shields.io/github/v/release/M-1u/bluray-collection?color=f2b544&label=version" alt="Latest version"></a>
  <img src="https://img.shields.io/badge/platforms-Windows%20%7C%20Linux-2b6cf0" alt="Platforms">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-f2b544" alt="MIT license"></a>
  <img src="https://img.shields.io/badge/Electron-React-8b5cf6" alt="Electron + React">
</p>

<p align="center">
  <a href="README.md">🇫🇷 Français</a> · <b>🇬🇧 English</b>
  &nbsp;•&nbsp;
  <a href="https://github.com/M-1u/bluray-collection/releases/latest"><b>⬇️ Download</b></a>
  &nbsp;•&nbsp;
  <a href="https://m-1u.github.io/bluray-collection/">🌐 Website</a>
</p>

> The app interface is in French.

<p align="center"><img src="screenshots/collection.png" alt="The collection, shelved by director" width="88%"></p>

## Screenshots

| A film's page | Statistics |
| :---: | :---: |
| ![Film page](screenshots/detail.png) | ![Statistics](screenshots/stats.png) |
| **Custom covers** | **Table view** |
| ![Custom](screenshots/custom.png) | ![Table](screenshots/table.png) |

## Features

- **Three lists** — **Owned** (your collection), **Custom** (covers you make yourself) and **To buy** (your wishlist).
- **Several editions per film** — own a film on Blu-ray and want it in 4K. Formats: 1080p, 4K, DVD, Blu-ray, Steelbook, Custom.
- **Sorted like your shelf** — by director's last name, then year, with a divider per director. A manual sort key handles special cases.
- **Custom cover tracking** — to create → created → printed, waiting for a case → done. Finished customs join your collection automatically.
- **Two-click adding** from TMDB: poster, directors, genres, countries, runtime, synopsis. Posters are cached locally.
- **Letterboxd import** — import your Letterboxd export zip any time: watched films, ratings, reviews, likes and watchlist are **replaced**; your collection is **never** touched. A backup is made before each import.
- **Statistics** — formats, directors, genres, countries, decades, custom progress; owned watched/unwatched, average rating, films you loved but don't own yet, most rewatched…

## Install

Grab the latest version from the [**releases**](https://github.com/M-1u/bluray-collection/releases/latest) page: `.AppImage` or `.deb` for Linux, `Setup .exe` for Windows (unsigned: SmartScreen may warn — “More info” → “Run anyway”).

## Getting started

1. **TMDB key** — create a free account on [themoviedb.org](https://www.themoviedb.org), go to *Settings → API*, copy your v3 key or v4 read token, paste it in **Réglages** and click **Tester**.
2. **Letterboxd export** *(optional)* — *Settings → Data → Export your data* on Letterboxd, then **Import Letterboxd** in the app.
3. **Add films** with **+ Ajouter un film**.

## Your data

Everything stays on your computer in `collection.json` (`~/.config/bluray-collection/` on Linux, `%APPDATA%\bluray-collection\` on Windows), with automatic backups before each import. Only TMDB is contacted.

## Development

```bash
npm install
npm run dev      # Vite + Electron with hot reload
npm test         # tests (vitest)
npm run dist     # packages in release/
```

Use `BLURAY_DATA_DIR=/tmp/test-collection npm run dev` to test without touching your real data.

## License

[MIT](LICENSE). This product uses the TMDB API but is not endorsed or certified by TMDB. Not affiliated with Letterboxd.
