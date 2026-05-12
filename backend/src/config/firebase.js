import admin from "firebase-admin";

function getFirebaseApp() {
  if (admin.apps.length) return admin.app();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("Firebase Admin credentials are missing. Protected routes require a valid Bearer token in production.");
    return null;
  }

  return admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey })
  });
}

export const firebaseApp = getFirebaseApp();
export const firebaseAuth = firebaseApp ? admin.auth(firebaseApp) : null;
