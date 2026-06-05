# voicev1 — 2-Way Audio Calling with LiveKit

A full-stack audio calling demo built with **NestJS + PostgreSQL + Next.js + LiveKit**.

Supports **two LiveKit modes** via a single env flag:
- `selfhosted` — runs your own open-source LiveKit server via Docker
- `cloud`     — uses LiveKit Cloud (managed service)

## Features
- Signup / login (JWT in httpOnly cookies + refresh tokens)
- Search a user by username/email
- Place an audio call (full ringing flow via Socket.IO)
- Receiver gets accept / decline modal
- Audio room powered by LiveKit (`@livekit/components-react`)
- Postgres-backed call history (caller, callee, status, timestamps)

## Quick Start (Local)

### 1. Start infrastructure
```bash
docker compose up -d
```
This starts Postgres (5432), Redis (6379) and self-hosted LiveKit (7880).

### 2. Backend
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run start:dev
```
Backend runs at http://localhost:4000

### 3. Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```
Frontend runs at http://localhost:3000

### 4. Test with 2 accounts
Open Chrome **and** an Incognito window. Sign up as two different users (e.g. `alice` and `bob`). From Alice's dashboard, search for `bob` and place a call. Accept on Bob's window — the audio room opens for both.

## Switching to LiveKit Cloud
In `backend/.env`, change:
```
LIVEKIT_MODE=cloud
LIVEKIT_CLOUD_URL=wss://your-project.livekit.cloud
LIVEKIT_CLOUD_API_KEY=APIxxxxx
LIVEKIT_CLOUD_API_SECRET=xxxxxxxxxxxx
```
The frontend automatically uses whichever URL the backend returns when minting a token.

## Going Live with ngrok
See [docs/ngrok.md](docs/ngrok.md) for instructions on exposing the local stack publicly so two people on different networks can call each other.

## Project Layout
```
voicev1/
├── docker-compose.yml      # Postgres + Redis + LiveKit server
├── livekit.yaml            # Self-hosted LiveKit config
├── backend/                # NestJS API
└── frontend/               # Next.js app
```
