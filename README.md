# AI SaaS — Intelligent Workspace Automation

A production-ready AI SaaS platform where users can connect their Google accounts and use an AI assistant that can perform real-world actions — send emails, schedule meetings, manage Drive files, create Sheets & Docs, send WhatsApp messages, and more.

## Architecture

```
ai-saas/
├── backend/      → Node.js + Express + PostgreSQL (Prisma) + Docker
└── frontend/     → React + Vite + Tailwind CSS v3 + Context API
```

---

## Quick Start

### 1. Clone & Setup

```bash
# Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Fill in your .env values

Edit `backend/.env` with:
- `OPENAI_API_KEY` — from https://platform.openai.com
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` — from Razorpay Dashboard
- `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` — from Twilio Console
- `JWT_SECRET` — any long random string
- `ENCRYPTION_KEY` — exactly 32 characters

### 3. Start PostgreSQL with Docker

```bash
cd backend
docker-compose up postgres -d
```

### 4. Run database migrations

```bash
cd backend
npm install
npx prisma migrate dev --name init
```

### 5. Start backend

```bash
cd backend
npm run dev
```

### 6. Start frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000
pgAdmin: http://localhost:8080

---

## Google Cloud Setup (Required for Google services)

1. Go to https://console.cloud.google.com
2. Create a new project: `AI-SaaS`
3. Enable these APIs:
   - Gmail API
   - Google Calendar API
   - Google Drive API
   - Google Docs API
   - Google Sheets API
4. Go to **Credentials** → Create **OAuth 2.0 Client ID** (Web Application)
5. Add Authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Secret → paste in `backend/.env`

---

## How the SaaS OAuth Works

This is **Model 2 — Per-User OAuth** (true SaaS):

```
Your Google Cloud Project (1 OAuth app)
    ↓
User clicks "Connect Google Account"
    ↓
Google consent screen → User grants access
    ↓
Your app gets THAT user's access token
    ↓
Tokens stored encrypted (AES-256) in DB
    ↓
AI uses EACH user's own token for their actions
  • Emails sent FROM their Gmail
  • Files saved TO their Drive
  • Events on their Calendar
```

---

## AI Tool System

The AI agent uses OpenAI function calling with these tools:

| Tool | Action |
|---|---|
| `send_email` | Send email via user's Gmail |
| `create_calendar_event` | Add event to user's Calendar |
| `create_google_meet` | Create Meet with video link |
| `list_drive_files` | List files in user's Drive |
| `upload_to_drive` | Upload file to user's Drive |
| `create_spreadsheet` | Create new Google Sheet |
| `append_to_spreadsheet` | Add rows to existing Sheet |
| `create_google_doc` | Create new Google Doc |
| `send_whatsapp_message` | Send WhatsApp via Twilio |

---

## API Reference

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
GET    /api/auth/google                    → OAuth redirect
GET    /api/auth/google/callback           → OAuth callback

GET    /api/chat/conversations
POST   /api/chat/conversations
GET    /api/chat/conversations/:id/messages
POST   /api/chat/conversations/:id/messages  → sends to AI
DELETE /api/chat/conversations/:id

GET    /api/google/status
POST   /api/google/gmail/send
GET    /api/google/calendar/events
POST   /api/google/calendar/events
POST   /api/google/calendar/meet
GET    /api/google/drive/files
POST   /api/google/drive/upload
POST   /api/google/sheets/create
POST   /api/google/docs/create

GET    /api/payments/plans
POST   /api/payments/create-order
POST   /api/payments/verify
GET    /api/payments/subscription

POST   /api/whatsapp/send
GET    /api/whatsapp/contacts
POST   /api/whatsapp/contacts

GET    /api/dashboard/stats
```

---

## Subscription Plans

| Feature | Free | Pro (₹999/month) |
|---|---|---|
| AI Chat | 50 msg/month | Unlimited |
| Gmail | 5 emails/month | Unlimited |
| Calendar | 3 events/month | Unlimited |
| Google Drive | ❌ | ✅ |
| Sheets & Docs | ❌ | ✅ |
| WhatsApp | ❌ | ✅ |
| Analytics | Basic | Advanced |

---

## Tech Stack

| | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS v3 |
| State | React Context API (Auth, Chat, App, Theme) |
| Backend | Node.js + Express.js |
| Database | PostgreSQL (Docker) + Prisma ORM |
| AI | OpenAI GPT-4 with Function Calling |
| Auth | JWT (httpOnly cookies) + Google OAuth 2.0 |
| Payments | Razorpay |
| WhatsApp | Twilio |
| Charts | Recharts |
| Animations | Framer Motion |
