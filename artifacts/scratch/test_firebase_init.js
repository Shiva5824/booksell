import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("backend/.env") });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

console.log("FIREBASE_PROJECT_ID:", projectId);
console.log("FIREBASE_CLIENT_EMAIL:", clientEmail);
console.log("FIREBASE_PRIVATE_KEY exists:", !!privateKey);
if (privateKey) {
  console.log("FIREBASE_PRIVATE_KEY length:", privateKey.length);
  console.log("FIREBASE_PRIVATE_KEY starts with:", JSON.stringify(privateKey.substring(0, 50)));
  console.log("FIREBASE_PRIVATE_KEY ends with:", JSON.stringify(privateKey.substring(privateKey.length - 50)));
}

try {
  const app = admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey })
  });
  console.log("Firebase App Initialized successfully!", !!app);
} catch (error) {
  console.error("Firebase Initialization Failed:", error);
}
