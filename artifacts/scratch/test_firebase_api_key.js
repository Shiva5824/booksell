import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("frontend/.env.local") });

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
console.log("Testing API Key:", apiKey);

try {
  // Try to call signUp with dummy email to test API key validity
  const res = await axios.post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      email: "test-nonexistent-user-12345@gmail.com",
      password: "somePassword123",
      returnSecureToken: true
    }
  );
  console.log("Success! Status:", res.status);
  console.log("Data:", res.data);
} catch (error) {
  console.error("API Key Test Failed!");
  if (error.response) {
    console.error("Status:", error.response.status);
    console.error("Error Data:", JSON.stringify(error.response.data, null, 2));
  } else {
    console.error("Error Message:", error.message);
  }
}
