import mongoose from "mongoose";
import dns from "node:dns";

export async function connectDb() {
  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI is not set. API will start without a database connection.");
    return;
  }

  if (process.env.MONGODB_URI.startsWith("mongodb+srv://")) {
    const servers = (process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1")
      .split(",")
      .map((server) => server.trim())
      .filter(Boolean);

    dns.setServers(servers);
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected");
}
