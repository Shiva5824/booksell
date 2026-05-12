# SellChey

A mobile-first student marketplace MVP for buying and selling books and equipment inside college communities.

## Stack

- Frontend: Next.js App Router, Tailwind CSS, Axios
- Backend: Node.js, Express.js, Zod, Mongoose
- Auth: Firebase Authentication
- Database: MongoDB Atlas
- Media: Cloudinary
- Chat MVP: Firebase Realtime Database

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment files:

```bash
copy frontend\.env.example frontend\.env.local
copy backend\.env.example backend\.env
```

3. Fill Firebase, MongoDB Atlas, and Cloudinary values.

4. Run both apps:

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000/api/health

The frontend includes demo listings so the UI remains usable before backend credentials are connected.
