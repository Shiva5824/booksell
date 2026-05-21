import dns from "node:dns";
import axios from "axios";

console.log("Setting DNS servers to 8.8.8.8, 1.1.1.1...");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  console.error("Failed to set DNS servers:", e);
}

console.log("Attempting to fetch google.com...");
try {
  const res = await axios.get("https://www.google.com");
  console.log("Success! Status:", res.status);
} catch (err) {
  console.error("Failed to fetch google.com! Error:", err.message);
}
