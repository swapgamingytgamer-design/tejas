# tejas

**Building What Comes Next.**
A new global technology ecosystem — AI infrastructure, a unified API gateway, developer
platforms, software, cloud and connected services, built as one system.

---

## Project structure

```
tejas/
├── index.html            # Main site (single-page: Home, Vision, Ecosystem, Products,
│                         #   Developers, About, Contact)
├── 404.html              # Custom 404 page (used automatically by Cloudflare Pages)
├── css/style.css         # Full stylesheet — dark corporate theme, design tokens
├── js/main.js            # Navigation, scroll reveals, active-section highlight,
│                         #   contact-form client
├── assets/
│   ├── favicon.svg       # TEJAS brand mark
│   ├── mark.svg          # Inline-reusable word mark
│   └── fonts/            # Self-hosted Space Grotesk + Inter (woff2, variable)
├── backend/              # OPTIONAL FastAPI backend
│   ├── main.py           #   contact intake → SQLite + serves site on :8000
│   └── requirements.txt
├── _headers              # Cloudflare Pages: caching + security headers
├── robots.txt / sitemap.xml
├── .gitignore
└── README.md
```

## Running locally (Windows)

### Option A — backend included (recommended, `localhost:8000`)

```bat
:: from the project root
python -m venv .venv
.venv\Scripts\pip install -r backend\requirements.txt
.venv\Scripts\uvicorn backend.main:app --port 8000
```

Then open **http://localhost:8000** — the full site is served, and the contact
form works (messages are stored in `backend/data/tejas.db`, which is never committed).

### Option B — static only (no backend)

Any static file server from the project root works, for example:

```bat
python -m http.server 8000
```

The site is fully functional except the contact form, which will tell you plainly
that no message backend is connected. Nothing is ever faked as "sent".

## Deployment (Cloudflare Pages)

The flow is: **OpenCode → GitHub → Cloudflare Pages → live site.**

1. This repository is connected to `https://github.com/swapgamingytgamer-design/tejas`.
2. In Cloudflare Pages, create a project from that Git repository.
3. Build settings: **no build command**, output directory `/` (the site is pre-built static).
4. Cloudflare Pages automatically uses `404.html` for not-found routes and `_headers`
   for caching/security headers.

## Development rules (for contributors and agents)

- Frontend stays static and dependency-free; the backend is optional and separate.
- Never put secrets or API keys in frontend JavaScript; never commit credentials.
- Contact messages (SQLite) are local data and git-ignored.
- Planned features on the site are labelled honestly (Planned / In development /
  Future) until they are real.
- Git: commit small and clear; never force-push; never rewrite remote history.
