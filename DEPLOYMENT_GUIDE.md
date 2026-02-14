# 🏛️ The Everlasting Vault — Deployment Guide

## 1. Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A free [Render.com](https://render.com), [Railway.app](https://railway.app), or [Fly.io](https://fly.io) account
- (Optional) A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster for persistent messages

---

## 2. Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Open **http://localhost:3000** in your browser.  
Default access code: `Neeku endhuku bro`

---

## 3. Environment Variables

| Variable       | Required | Description                                 |
|----------------|----------|---------------------------------------------|
| `PORT`         | No       | Server port (default: `3000`)               |
| `MONGO_URI`    | No       | MongoDB connection string for persistence   |
| `ACCESS_CODE`  | No       | Custom access code (default is hardcoded)   |

> **⚠️ Never commit your MONGO_URI or ACCESS_CODE to version control.**  
> Always set them as environment variables in your hosting dashboard.

---

## 4. Deploy to Render.com (Recommended Free Tier)

1. Push your code to a **GitHub** or **GitLab** repo.
2. Go to [Render Dashboard](https://dashboard.render.com/) → **New** → **Web Service**.
3. Connect your repo.
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** `Node`
5. Add **Environment Variables**:
   - `MONGO_URI` → your MongoDB Atlas connection string
   - `ACCESS_CODE` → your secret passphrase
6. Click **Deploy**.

---

## 5. MongoDB Atlas Setup (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas) → Create a free **M0** cluster.
2. Create a database user with a strong password.
3. Whitelist `0.0.0.0/0` in **Network Access** (so Render can connect).
4. Click **Connect** → **Connect your application** → Copy the connection string.
5. Replace `<password>` with your actual password.
6. Paste as the `MONGO_URI` environment variable in Render.

---

## 6. The "Stay Awake" Protocol (Cron-job.org)

Render's free tier spins down after **15 minutes of inactivity**. To prevent this:

1. Go to [Cron-job.org](https://cron-job.org) → Create a free account.
2. Click **Create Cronjob**.
3. Configure:
   - **Title:** `Vault Keep-Alive`
   - **URL:** `https://your-app-name.onrender.com/healthcheck`
   - **Schedule:** Every **10 minutes**
4. Save. Your server will now stay alive 24/7! 🎉

### Alternative Ping Services

- [UptimeRobot](https://uptimerobot.com/) (free, 5-minute intervals)
- [Freshping](https://www.freshworks.com/website-monitoring/) (free tier available)

---

## 7. Security Checklist

- [x] **Helmet.js** security headers enabled
- [x] **Access code** gated entry (server-side validation)
- [x] **CORS** configured
- [x] **Message length** capped at 2,000 characters
- [x] **Username length** capped at 24 characters
- [x] **sessionStorage** for auth (not localStorage — cleared on browser close)
- [ ] Add rate limiting (`express-rate-limit`) for production
- [ ] Enable HTTPS (automatic on Render/Railway)
- [ ] Set a strong, unique `ACCESS_CODE` environment variable

---

## 8. Project Structure

```
New server/
├── server.js              # Express + Socket.io backend
├── package.json           # Dependencies & scripts
├── DEPLOYMENT_GUIDE.md    # This file
└── public/
    └── index.html         # Complete frontend (HTML + CSS + JS)
```

---

## 9. Troubleshooting

| Issue                     | Fix                                                    |
|---------------------------|--------------------------------------------------------|
| MongoDB won't connect     | Check `MONGO_URI`, whitelist `0.0.0.0/0` in Atlas      |
| Server spins down         | Set up Cron-job.org pinging `/healthcheck`              |
| Can't connect from phone  | Use the Render URL, not `localhost`                     |
| Blank page                | Check browser console for errors; ensure `/` serves HTML |

---

**Built with ❤️ — The Everlasting Vault**
