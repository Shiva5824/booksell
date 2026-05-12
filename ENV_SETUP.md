# SellChey Environment Setup

Do not paste real API secrets into chat, screenshots, GitHub, or commits. Put them only in:

- `frontend/.env.local`
- `backend/.env`

## Frontend Values

File: `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

These values come from the Firebase Web App config object.

## Backend Values

File: `backend/.env`

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGODB_URI=
DNS_SERVERS=8.8.8.8,1.1.1.1
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Important Private Key Format

Firebase gives you a JSON file with this:

```json
"private_key": "-----BEGIN PRIVATE KEY-----\nABC...\n-----END PRIVATE KEY-----\n"
```

In `backend/.env`, keep it on one line, wrapped in quotes:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nABC...\n-----END PRIVATE KEY-----\n"
```

The backend code converts the `\n` text back into real newlines.

## Restart After Editing

After changing env files, stop and restart the dev servers:

```bash
npm run dev
```

Frontend env values are loaded at startup, so browser refresh alone is not enough.
