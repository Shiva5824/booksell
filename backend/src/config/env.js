import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// Get current file's directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Candidate paths where .env could reside
const candidates = [
  path.join(process.cwd(), ".env"),
  path.join(process.cwd(), "backend", ".env"),
  path.join(__dirname, "..", "..", ".env"),
];

let loaded = false;
for (const envPath of candidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`[Env Loader] Loaded environment variables from: ${envPath}`);
    loaded = true;
    break;
  }
}

if (!loaded) {
  dotenv.config();
  console.warn("[Env Loader] No specific .env file found in candidate paths. Falling back to default dotenv loading.");
}
