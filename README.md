# League Management System

Student demo of **spec-driven** Vue 3 + Express + MySQL catalog CRUD: leagues, teams, people, seasons, and games.

Specifications define _what_ to build (`features/`). Cursor rules define _how_ (`.cursor/rules/`). Tests verify both.

**Docs:** [Student catalog-copy guide](docs/STUDENT-GUIDE.md) · [features/README.md](features/README.md) · [features/framework.md](features/framework.md)

---

## Stack

| Layer    | Technology                                                        |
| -------- | ----------------------------------------------------------------- |
| Frontend | Vue 3, Vuetify 4, Vite, vue-router, axios                         |
| Backend  | Node.js (ES modules), Express, Sequelize, MySQL                   |
| Tests    | Jest + supertest (backend), Vitest + `@vue/test-utils` (frontend) |

Default ports: frontend `8082`, backend `3200`. API mount: `/league`.

---

## First run

```bash
npm install --prefix frontend
npm install --prefix backend

# macOS / Linux / Git Bash:
cp backend/.env.example backend/.env
cp backend/.env.test.example backend/.env.test
# Windows: copy backend\.env.example backend\.env
# Create MySQL databases; set DB_* and AUTH_SECRET
```

If MySQL still has leftover `courses`, `faculties`, or `sections` tables from older sample code, drop those tables before starting the backend.

```bash
npm test
cd backend && npm run dev
cd frontend && npm run dev
```

Optional demo data (admin user, one league, three teams, one season):

```bash
npm run seed --prefix backend
```

Sign in as `admin` / `password123`.

Works on **macOS, Windows, and Linux** — use `npm run …` for all tooling (PDF, Agility, bundles).

## Branching

| Branch        | Purpose                           |
| ------------- | --------------------------------- |
| `main`        | Release / starter snapshot        |
| `dev`         | Integration                       |
| `feature/N-*` | One feature at a time             |

Product code belongs on `feature/N-short-name`, branched from `dev`.

## Copy a catalog

See [docs/STUDENT-GUIDE.md](docs/STUDENT-GUIDE.md). Start from League (list + dialog), not from the Feature 8 scheduler.
