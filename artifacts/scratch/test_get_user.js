import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

async function testRoute(id) {
  try {
    console.log(`Testing GET /api/users/${id}...`);
    const response = await axios.get(`${API_BASE_URL}/users/${id}`);
    console.log(`Result: Success! Status: ${response.status}`);
  } catch (error) {
    console.log(`Result: Failed! Status: ${error.response?.status}, Data:`, error.response?.data || error.message);
  }
}

async function run() {
  await testRoute("undefined");
  await testRoute("null");
  await testRoute("123456789012345678901234"); // Valid ObjectId format but nonexistent
  await testRoute("someFirebaseUid");
  await testRoute("");
}

run();
