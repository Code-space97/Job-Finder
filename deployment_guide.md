# 🚀 Full-Stack Job Matcher Deployment Guide

This guide details how to deploy your Job Matcher application to production for free using **Vercel** (Frontend), **Render** (Backend), and **MongoDB Atlas** (Database).

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Step 1: Save Your Code to GitHub](#step-1-save-your-code-to-github)
3. [Step 2: Set Up MongoDB Atlas (Database)](#step-2-set-up-mongodb-atlas)
4. [Step 3: Deploy the Backend on Render](#step-3-deploy-the-backend-on-render)
5. [Step 4: Deploy the Frontend on Vercel](#step-4-deploy-the-frontend-on-vercel)
6. [Step 5: Link Frontend and Backend (CORS Setup)](#step-5-link-frontend-and-backend)
7. [⚡ Troubleshooting & Post-Deployment Checklist](#-troubleshooting--post-deployment-checklist)

---

## 1. Prerequisites

Make sure you have:
* A **GitHub** account ([github.com](https://github.com))
* A **MongoDB Atlas** account ([mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas))
* A **Render** account ([render.com](https://render.com))
* A **Vercel** account ([vercel.com](https://vercel.com))
* Your **Groq API Key** and **Jooble API Key**

---

## Step 1: Save Your Code to GitHub

Since you are running on Windows and may not have the Git CLI configured, the easiest way to upload your code is using **GitHub Desktop** or the **GitHub Website**, or by installing Git.

### Option A: Using Git CLI (Recommended if installed)
1. Open PowerShell / Command Prompt in the project folder `C:\Users\lokes\Desktop\Job-Matcher`.
2. Initialize and push your repository:
   ```bash
   # Initialize git
   git init

   # Rename branch to main
   git branch -M main

   # Add all files (the root .gitignore will keep your .env files and node_modules safe)
   git add .

   # Commit
   git commit -m "feat: ready for production hosting"

   # Create a NEW repository on github.com (empty, do not add README or license)
   # Copy the remote command from GitHub and run it:
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

   # Push to main
   git push -u origin main
   ```

### Option B: Using GitHub Desktop (Easiest GUI)
1. Download and install **GitHub Desktop** from [desktop.github.com](https://desktop.github.com/).
2. Open it, select **File** -> **Add Local Repository**, and select `C:\Users\lokes\Desktop\Job-Matcher`.
3. If it says it's not a git repository, click **Create Repository**.
4. In the Summary field, write "Initial Commit", then click **Commit to main**.
5. Click **Publish Repository** to upload it directly to your GitHub account as a private or public repository.

---

## Step 2: Set Up MongoDB Atlas (Database)

MongoDB Atlas provides a 100% free shared database cluster.

1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Click **Create** to deploy a new database.
3. Select **M0 Shared Cluster** (Free tier). Select your preferred region (e.g., AWS N. Virginia or Mumbai) and click **Create**.
4. **Security Quickstart**:
   * **Username & Password**: Create a database user (e.g., username: `dbuser`, password: `yoursecurepassword`). *Write these down!*
   * **IP Access List**: Select **Allow Access from Anywhere** (adds `0.0.0.0/0`). This is necessary because Render's free services change their IP addresses dynamically.
5. Click **Finish and Close**.
6. On the Database Dashboard, click **Connect**.
7. Choose **Drivers** (Node.js).
8. Copy your **Connection String**. It will look like this:
   ```text
   mongodb+srv://dbuser:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
9. Replace `<password>` with the password you created for your database user. Keep this string ready for the backend deployment.

---

## Step 3: Deploy the Backend on Render

1. Log in to the [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Select **Connect a repository** and choose your `Job-Matcher` GitHub repository.
4. Configure the Web Service settings:
   * **Name**: `job-matcher-backend` (or similar)
   * **Region**: Choose the region closest to you
   * **Branch**: `main`
   * **Root Directory**: `backend` *(CRITICAL: Must be set to backend)*
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
5. Scroll down to the **Environment Variables** section and click **Add Environment Variable**:
   
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production mode |
   | `MONGODB_URI` | `mongodb+srv://...` | Paste your MongoDB Atlas Connection String from Step 2 |
   | `JWT_SECRET` | `generate-some-long-random-string` | Used to sign login tokens |
   | `JWT_EXPIRES_IN` | `7d` | How long login sessions last |
   | `GROQ_API_KEY` | `gsk_xxxx...` | Your Groq AI key |
   | `JOOBLE_API_KEY` | `d1c79deb-...` | Your Jooble API key |
   | `PORT` | `5000` | Render port configuration |
   | `FRONTEND_URL` | `https://your-frontend.vercel.app` | *Leave empty for now* - we will fill this in after Vercel is deployed |

6. Click **Create Web Service**.
7. Render will build and deploy your Express backend. Once it is successful, copy your backend URL shown at the top of the page (e.g., `https://job-matcher-backend.onrender.com`).

---

## Step 4: Deploy the Frontend on Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Import your `Job-Matcher` GitHub repository.
4. Configure Project settings:
   * **Framework Preset**: `Vite` (automatically detected)
   * **Root Directory**: Click Edit, select the `frontend` folder, and click **Continue**.
5. Open **Environment Variables** and add the following:
   * **Key**: `VITE_API_URL`
   * **Value**: `https://your-backend-url.onrender.com/api` (Replace with your Render URL from Step 3, making sure it ends with `/api`)
6. Click **Deploy**.
7. Once deployed, Vercel will give you a production URL (e.g., `https://job-matcher-frontend.vercel.app`). Copy this URL.

---

## Step 5: Link Frontend and Backend (CORS Setup)

For security, the backend only allows requests from authorized origins. Now that you have your frontend URL, let's update your backend.

1. Go back to your [Render Dashboard](https://dashboard.render.com/) and click on your backend service.
2. Go to the **Environment** tab on the left sidebar.
3. Edit the `FRONTEND_URL` variable:
   * **Key**: `FRONTEND_URL`
   * **Value**: `https://your-frontend.vercel.app` (The Vercel URL you copied in Step 4)
4. Click **Save Changes**.
5. Render will automatically redeploy the backend with the new CORS permissions.

---

## ⚡ Troubleshooting & Post-Deployment Checklist

### 1. The frontend loads, but signing up or logging in fails
* Open the browser console (Right-click -> Inspect -> Console) and look for network errors.
* Double-check that your `VITE_API_URL` in Vercel is configured exactly as your Render backend URL plus `/api` (e.g., `https://job-matcher-backend.onrender.com/api`).
* Make sure `FRONTEND_URL` in Render matches your Vercel URL exactly (without a trailing slash).

### 2. Render backend cold-start delay
* Render's free plan puts your backend container to sleep if there's no traffic for 15 minutes.
* When you open the app after a while, the page loads instantly (thanks to Vercel), but registration, login, or job matching will spin/wait for 30–50 seconds while the backend wakes up. This is normal on free tiers.

### 3. Database connection fails
* Ensure you whitelisted all IP addresses (`0.0.0.0/0`) in your MongoDB Atlas cluster network access settings.
* Check that your database password does not contain special characters (like `@`, `:`, `/`) which can break connection URI parsing. If it does, recreate the db user with alphanumeric characters.
