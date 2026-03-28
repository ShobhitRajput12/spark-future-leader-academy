# Spark Future Leader Academy (Full Stack)

## Structure

- `frontend/` Expo React Native app
- `backend/` Node.js + Express API (Gemini + MongoDB)

## Backend setup

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Environment variables (`backend/.env`):

- `GEMINI_API_KEY` (required)
- `MONGODB_URI` (optional; if empty, server runs without persistence)
- `PORT` (default `3000`)

## Frontend setup

```bash
cd frontend
copy .env.example .env
npm install
npm run start
```

Environment variables (`frontend/.env`):

- `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000`

Note (real phone): set `EXPO_PUBLIC_API_BASE_URL` to your PC LAN IP, e.g. `http://192.168.1.10:3000`.

## API

- `POST /ai` body: `{ "prompt": "How to join NDA?" }` → `{ "text": "..." }`
- `GET /schemes` → array of schemes used by the app
