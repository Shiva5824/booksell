import mongoose from "mongoose";
import dns from "node:dns";
import dotenv from "dotenv";
import path from "path";
import User from "../../backend/src/models/User.js";

// Load backend .env file relative to process.cwd() which is the workspace root
dotenv.config({ path: path.resolve("backend/.env") });

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not defined in backend/.env!");
}

if (uri.startsWith("mongodb+srv://")) {
  const servers = (process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  console.log("Setting DNS servers to:", servers);
  dns.setServers(servers);
}

async function run() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB successfully!");
  
  const users = await User.find({});
  console.log(`Found ${users.length} users:`);
  users.forEach((u) => {
    console.log(`- Name: ${u.name}`);
    console.log(`  _id: ${u._id}`);
    console.log(`  email: ${u.email}`);
    console.log(`  firebaseUid: ${u.firebaseUid}`);
    console.log(`  isActive: ${u.isActive}`);
    console.log("------------------------");
  });

  await mongoose.disconnect();
}

run().catch(console.error);
