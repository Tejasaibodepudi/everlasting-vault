# 🏛️ The Everlasting Vault

> **A production-ready, real-time encrypted chat server.**

## 🚀 Deployment

### Environment Variables

When deploying (e.g. to Render, Railway, Fly.io), you **must** set these environment variables in your dashboard:

| Variable | Description | Default (if not set) |
| :--- | :--- | :--- |
| `ACCESS_CODE` | The secret password to enter the chat. | `Neeku endhuku bro` |
| `MONGO_URI` | MongoDB connection string (for saving messages forever). | *None (messages lost on restart)* |
| `NODE_VERSION` | Node.js version to use. | `20.11.0` |

### Quick Start (Local)

1.  Clone the repo
2.  `npm install`
3.  `npm start`
4.  Open `http://localhost:3000`

### Keep-Alive

To prevent the server from sleeping on free tiers, set up a cron job (e.g. on [cron-job.org](https://cron-job.org)) to ping:
`https://your-app-name.onrender.com/healthcheck`
