import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import User from "../../backend/src/models/User.js";

// Load backend .env file relative to process.cwd() which is the workspace root
dotenv.config({ path: path.resolve("backend/.env") });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(`MONGODB_URI is not defined in backend/.env! Resolved path: ${path.resolve("backend/.env")}`);
  }
  await mongoose.connect(uri);
  console.log("Connected to MongoDB!");
  
  const users = await User.find({});
  console.log(`Found ${users.length} users:`);
  users.forEach((u) => {
    console.log(`- Name: ${u.name}`);
    console.log(`  _id: ${u._id}`);
    console.log(`  firebaseUid: ${u.firebaseUid}`);
    console.log(`  avatar: "${u.avatar}"`);
    console.log(`  phone: "${u.phone}"`);
    console.log("------------------------");
  });

  await mongoose.disconnect();
}

run().catch(console.error);
