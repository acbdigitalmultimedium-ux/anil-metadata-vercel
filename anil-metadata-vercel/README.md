# anil metadata — Vercel All-in-One

Frontend (Vite + React) + Backend serverless API in one repo.

## Deploy (Free)
1. Push this folder to a new GitHub repo.
2. Go to https://vercel.com → Add New Project → import the repo.
3. Build Command: `npm run build`  • Output Directory: `dist`
4. (Optional) Environment Variables on Vercel:
   - `OPENAI_API_KEY` (for GPT)
   - `GOOGLE_API_KEY` (for Gemini)
5. Deploy → Your app is live: `/api/generate` is the backend endpoint.

## Local Dev
```bash
npm i
npm run dev
# http://localhost:5173
```
