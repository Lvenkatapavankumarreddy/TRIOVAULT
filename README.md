# 🛡️ TrioVault – Private Shared Cloud Storage for Three Friends

**TrioVault** is a real, full-stack, responsive, and secure cloud storage web application designed exclusively for three friends to store, organize, preview, download, and manage their personal files within dedicated spaces.

---

## 👥 The Three Predefined Spaces
Upon application initialization, TrioVault automatically creates and links three permanent folders:
1. **`L.V.pavan kumar reddy`** (`folder-pavan`)
2. **`D.hari charan sai vagnash`** (`folder-haricharan`)
3. **`K.deepak kumar`** (`folder-deepak`)

Each folder maintains strict file isolation, independent storage calculations, and separate activity logs.

---

## 🚀 Key Features

- 🔐 **Common Password Protection**: Single master key verification powered by `bcrypt` hashing, rate-limiting, and secure HTTP-only cookies.
- 📁 **Dedicated Friend Spaces**: 3 distinct cards with real-time file counters, storage sizes, and last upload timestamps.
- ☁️ **Cloud Storage Integration**: Supabase Storage private bucket integration via server-side service-role authentication (with local filesystem fallback for offline dev).
- 👁️ **In-Browser File Previews**: Native modal preview for PDFs, Images (JPG, PNG, GIF, SVG, WEBP), HTML5 Videos (MP4, MOV, WEBM), and formatted Text files (TXT, MD).
- 📥 **Secure Downloads**: Streamed through backend authorization checks or 5-minute short-lived signed URLs.
- 📊 **Storage Analytics**: Combined overview showing total storage across all friends, friend-by-friend usage comparison, and category distribution (Images, Documents, Videos, Archives).
- 📜 **Audit Trail & Activity Log**: Timestamped logs for file uploads, downloads, renames, deletions, folder navigation, and vault unlocks/locks.
- 🌓 **Theme Engine**: Instant toggle between Dark Mode and Light Mode with `localStorage` persistence.
- 📱 **Fully Responsive**: Tailored for desktop, tablet, and mobile browsers.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router 6, Tailwind CSS, Lucide Icons, Axios |
| **Backend** | Node.js, Express.js, Multer, Helmet, CORS, Cookie-Parser, Express-Rate-Limit |
| **Database** | MongoDB Atlas & Mongoose (with in-memory replica store fallback) |
| **Cloud Storage** | Supabase Storage SDK (`@supabase/supabase-js`) |
| **Authentication** | Bcrypt password hashing, JWT session in HTTP-only `SameSite` cookies |
| **Deployment** | Frontend on **Vercel**, Backend on **Render** |

---

## 📂 Project Structure

```
TRIOVAULT/
├── frontend/                     # React + Vite application
│   ├── public/                   # Static assets & SVG icons
│   ├── src/
│   │   ├── components/           # Navbar, UploadModal, FilePreviewModal, RenameModal, DeleteConfirmModal
│   │   ├── pages/                # PasswordScreen, FolderSelection, PersonalFolderDashboard, AnalyticsPage, ActivityPage
│   │   ├── context/              # AuthContext, ThemeContext, ToastContext
│   │   ├── services/             # Axios API client (authApi, folderApi, fileApi, analyticsApi, activityApi)
│   │   ├── utils/                # formatters (Bytes, Date, File icons)
│   │   ├── styles/               # Tailwind CSS & custom transitions
│   │   ├── App.jsx               # Protected client-side routing
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js            # API proxy configuration
│   └── package.json
│
├── backend/                      # Express.js REST API
│   ├── config/                   # MongoDB connection & Supabase client
│   ├── controllers/              # Auth, Folder, File, Activity, Analytics controllers
│   ├── middleware/               # Auth cookie verification & Multer upload filter
│   ├── models/                   # Folder, File, and Activity schemas
│   ├── routes/                   # Modular Express routers
│   ├── services/                 # Storage service & Auth JWT service
│   ├── utils/                    # Category detectors & filename sanitization
│   ├── tests/                    # Automated E2E verification test suite
│   ├── scripts/                  # Standalone database seed script
│   ├── server.js                 # Server entry point & auto-seeding
│   ├── .env.example
│   └── package.json
│
├── package.json                  # Root orchestration scripts
└── README.md
```

---

## ⚙️ Configuration & Environment Variables

Create `.env` in `backend/` based on `backend/.env.example`:

```ini
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Master vault security key (default: TrioVault2025!)
APP_PASSWORD=TrioVault2025!

# Secret key for signing session tokens
SESSION_SECRET=your_super_secret_session_token_key_here

# MongoDB Atlas Connection URI
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/triovault?retryWrites=true&w=majority

# Supabase Cloud Storage Configuration
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret_key
SUPABASE_BUCKET=triovault-files
MAX_FILE_SIZE_MB=500
```

> **Note on Local Testing**: If `SUPABASE_URL` or `MONGODB_URI` are omitted during initial offline testing, TrioVault automatically uses local fallback storage in `./uploads` and its high-availability in-memory replica store, allowing immediate full-featured operation without configuration blockers!

---

## 🏁 Quickstart Guide

### 1. Install Dependencies
```bash
# In backend
cd backend
npm install

# In frontend
cd ../frontend
npm install
```

### 2. Run Automated Verification Test Suite
```bash
node backend/tests/runTestSuiteInProcess.js
```
*Tests all 17 scenarios including authentication, folder isolation, multi-file uploads, previewing, downloads, renames, deletions, and rate limits.*

### 3. Start Development Servers

**Start Backend Server:**
```bash
cd backend
node server.js
# Backend listening at http://localhost:5000
```

**Start Frontend Development Server:**
```bash
cd frontend
npm run dev
# Vite dev server running at http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser. Enter the master key `TrioVault2025!` to unlock the vault.

---

## ☁️ Deployment Instructions

### 1. Database (MongoDB Atlas)
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster (M0).
3. Under **Database Access**, create a user (e.g., `triovault_admin`).
4. Under **Network Access**, add `0.0.0.0/0` (Allow access from anywhere).
5. Copy the connection string and set it as `MONGODB_URI`.

### 2. File Storage (Supabase)
1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Storage** -> **New Bucket**. Name it `triovault-files` and set it to **Private**.
3. Under **Project Settings -> API**, copy:
   - `Project URL` -> `SUPABASE_URL`
   - `service_role secret` -> `SUPABASE_SERVICE_ROLE_KEY` *(Never expose this key on the frontend)*.

### 3. Backend Deployment (Render)
1. Create a **New Web Service** connected to your GitHub repository.
2. Root Directory: `backend`
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Add Environment Variables:
   - `APP_PASSWORD`, `SESSION_SECRET`, `MONGODB_URI`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`, `FRONTEND_URL` (set to your Vercel URL).

### 4. Frontend Deployment (Vercel)
1. Import your GitHub repository to [Vercel](https://vercel.com).
2. Framework Preset: `Vite`
3. Root Directory: `frontend`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add Environment Variable:
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://triovault-backend.onrender.com/api`).

