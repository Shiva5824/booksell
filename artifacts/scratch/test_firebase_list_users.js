import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("backend/.env") });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

try {
  const app = admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey })
  });
  console.log("Firebase App Initialized successfully!");
  
  const auth = admin.auth(app);
  console.log("Fetching users from Firebase...");
  const listUsersResult = await auth.listUsers(10);
  console.log("Successfully fetched users! Number of users:", listUsersResult.users.length);
  listUsersResult.users.forEach((userRecord) => {
    console.log(`- User: ${userRecord.uid}, Email: ${userRecord.email}, Provider: ${userRecord.providerData[0]?.providerId}`);
  });
} catch (error) {
  console.error("Firebase Auth operation failed:", error);
}
