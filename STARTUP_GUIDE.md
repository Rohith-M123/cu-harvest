# How to Run CU Harvest 🚀

This project has two parts: a **Frontend** (React/Vite) and a **Backend** (Node/Express). You need to run **BOTH** for the app to work.

## Step 1: Start the Backend (Terminal 1)
The backend handles data, authentication, and payments.

1. Open a terminal.
2. Move to the backend folder:
   ```bash
   cd backend
   ```
3. Start the server:
   ```bash
   npm start
   ```
   *You should see: `Server running on port 5001`*

## Step 2: Start the Frontend (Terminal 2)
The frontend is the website you see in your browser.

1. Open a **NEW** terminal (do not close the first one).
2. Make sure you are in the main folder (`cu-harvest (1)`).
3. Start the website:
   ```bash
   npm run dev
   ```
   *You should see: `Local: http://localhost:3000`*

## Step 3: Open in Browser
- Go to **http://localhost:3000** in your browser.
- **DO NOT** use the deployed `web.app` link for local testing.

## Common Issues
- **"Failed to fetch"**: Check if Terminal 1 (Backend) is running and error-free.
- **"Missing script: start"**: You are trying to run `npm start` in the main folder. Run it in the `backend` folder instead.
